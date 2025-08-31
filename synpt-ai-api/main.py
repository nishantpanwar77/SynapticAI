from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sse_starlette.sse import EventSourceResponse
import ollama
import json
import asyncio
from datetime import datetime
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
# import hashlib
import re
# from collections import defaultdict
import logging
import os
# from Crypto.Cipher import AES
# from Crypto.Hash import MD5
# import base64
# from typing import Union
import subprocess
from fastapi.responses import JSONResponse

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from hashlib import sha256


SECRET_KEY = 'mySuperSecretKey1234567890'  # Must match frontend
IV = b'1234567890123456'  # 16 bytes

app = FastAPI()

# MongoDB Configuration
MONGO_URL = "YOUR_MONGO_DB_CONNECTION_STRING"

client = AsyncIOMotorClient(
    MONGO_URL,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000
)

db = client.ai_chat_db
chats_collection = db.chats
memories_collection = db.chat_memories

# CORS setup
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:4300","http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TEMPERATURE = 0
MAX_CONTEXT_MESSAGES = 15  # Maximum recent messages to include
MEMORY_SEARCH_LIMIT = 5    # Maximum relevant memory pieces to retrieve
MIN_KEYWORD_MATCHES = 2    # Minimum keyword matches for relevance


class ContentSection(BaseModel):
    type: str  # 'text', 'code', 'table', 'list', 'header', 'think'
    content: str
    language: Optional[str] = None  # For code blocks
    metadata: Optional[Dict[str, Any]] = None  # For additional info

class ParsedMessage(BaseModel):
    type: str
    content: str
    sections: List[ContentSection]
    timestamp: str
    isStreaming: Optional[bool] = False


# Pydantic models
class Message(BaseModel):
    type: str
    content: str
    timestamp: str

class ModelInfo(BaseModel):
    name: str
    size: int

class Chat(BaseModel):
    title: str
    messages: List[Message]
    created_at: str
    updated_at: str
    model: ModelInfo

class ChatResponse(Chat):
    id: str

class EncryptedRequest(BaseModel):
    data: str
class SimpleMemoryService:
    """Simple memory service using keyword matching and text analysis"""
    
    def __init__(self):
        self.stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'this',
            'these', 'those', 'what', 'when', 'where', 'how', 'why', 'can',
            'could', 'would', 'should', 'do', 'did', 'have', 'had', 'my',
            'your', 'his', 'her', 'our', 'their'
        }
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from text"""
        # Convert to lowercase and remove special characters
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
        words = text.split()
        
        # Filter out stop words and short words
        keywords = [word for word in words 
                   if word not in self.stop_words and len(word) > 2]
        
        return list(set(keywords))  # Remove duplicates
    
    def calculate_relevance_score(self, query_keywords: List[str], message_keywords: List[str]) -> float:
        """Calculate relevance score based on keyword matching"""
        if not query_keywords or not message_keywords:
            return 0.0
        
        # Count matching keywords
        matches = len(set(query_keywords) & set(message_keywords))
        
        # Calculate score as ratio of matches to query keywords
        score = matches / len(query_keywords)
        
        return score
    
    async def store_conversation_memory(self, chat_id: str, messages: List[dict]):
        """Store conversation messages with keyword indexing"""
        try:
            # Clear existing memories for this chat
            await memories_collection.delete_many({"chat_id": chat_id})
            
            memory_docs = []
            for idx, message in enumerate(messages):
                if message['content'].strip():
                    keywords = self.extract_keywords(message['content'])
                    
                    memory_doc = {
                        "chat_id": chat_id,
                        "message_index": idx,
                        "content": message['content'],
                        "type": message['type'],
                        "timestamp": message['timestamp'],
                        "keywords": keywords,
                        "created_at": datetime.now().isoformat()
                    }
                    memory_docs.append(memory_doc)
            
            if memory_docs:
                await memories_collection.insert_many(memory_docs)
                logger.info(f"Stored {len(memory_docs)} memories for chat {chat_id}")
            
        except Exception as e:
            logger.error(f"Error storing conversation memory: {str(e)}")
    
    async def retrieve_relevant_memory(self, chat_id: str, query: str, limit: int = MEMORY_SEARCH_LIMIT) -> List[dict]:
        """Retrieve relevant memories based on keyword matching"""
        try:
            query_keywords = self.extract_keywords(query)
            if not query_keywords:
                return []
            
            # Find memories with matching keywords
            memories = []
            cursor = memories_collection.find({
                "chat_id": chat_id,
                "keywords": {"$in": query_keywords}
            })
            
            async for memory in cursor:
                relevance = self.calculate_relevance_score(query_keywords, memory['keywords'])
                if relevance > 0:
                    memory['relevance_score'] = relevance
                    memories.append(memory)
            
            # Sort by relevance and limit results
            memories.sort(key=lambda x: x['relevance_score'], reverse=True)
            relevant_memories = memories[:limit]
            
            logger.info(f"Retrieved {len(relevant_memories)} relevant memories for chat {chat_id}")
            return relevant_memories
            
        except Exception as e:
            logger.error(f"Error retrieving relevant memory: {str(e)}")
            return []
    
    async def delete_chat_memory(self, chat_id: str):
        """Delete all memory for a specific chat"""
        try:
            result = await memories_collection.delete_many({"chat_id": chat_id})
            logger.info(f"Deleted {result.deleted_count} memories for chat {chat_id}")
        except Exception as e:
            logger.error(f"Error deleting chat memory: {str(e)}")

# Initialize memory service
memory_service = SimpleMemoryService()


class ContentParsingService:
    """Service to parse AI responses into structured sections"""
    
    def __init__(self):
        self.section_patterns = {
            'code_block': r'```(\w*)\n([\s\S]*?)```',
            'table': r'\|(.+)\|[\r\n]',
            'think_block': r'<think>\n([\s\S]*?)\n</think>',
            'header': r'^(#{1,6})\s+(.+)$',
            'numbered_list': r'^\d+\.\s+(.+)$',
            'bullet_list': r'^[-*]\s+(.+)$',
            'bold_text': r'\*\*(.*?)\*\*'
        }
    
    def parse_content_to_sections(self, content: str) -> List[ContentSection]:
        """Parse content into structured sections"""
        sections = []
        
        # Track processed content to avoid duplicates
        processed_ranges = []
        
        # Find code blocks first (highest priority)
        code_sections = self._extract_code_blocks(content)
        sections.extend(code_sections['sections'])
        processed_ranges.extend(code_sections['ranges'])
        
        # Find tables
        table_sections = self._extract_tables(content, processed_ranges)
        sections.extend(table_sections['sections'])
        processed_ranges.extend(table_sections['ranges'])
        
        # Find think blocks
        think_sections = self._extract_think_blocks(content, processed_ranges)
        sections.extend(think_sections['sections'])
        processed_ranges.extend(think_sections['ranges'])
        
        # Process remaining text into text sections
        text_sections = self._extract_text_sections(content, processed_ranges)
        sections.extend(text_sections)
        
        # Sort sections by their original position in content
        sections.sort(key=lambda x: x.metadata.get('start_pos', 0) if x.metadata else 0)
        
        return sections
    
    def _extract_code_blocks(self, content: str) -> Dict[str, Any]:
        """Extract code blocks from content"""
        import re
        sections = []
        ranges = []
        
        pattern = re.compile(r'```(\w*)\n([\s\S]*?)```', re.MULTILINE)
        
        for match in pattern.finditer(content):
            language = match.group(1) or 'text'
            code_content = match.group(2).strip()
            
            section = ContentSection(
                type='code',
                content=code_content,
                language=language,
                metadata={
                    'start_pos': match.start(),
                    'end_pos': match.end(),
                    'raw_content': match.group(0)
                }
            )
            
            sections.append(section)
            ranges.append((match.start(), match.end()))
        
        return {'sections': sections, 'ranges': ranges}
    
    def _extract_tables(self, content: str, processed_ranges: List[tuple]) -> Dict[str, Any]:
        """Extract tables from content"""
        import re
        sections = []
        ranges = []
        
        lines = content.split('\n')
        table_lines = []
        table_start_pos = 0
        in_table = False
        
        current_pos = 0
        for i, line in enumerate(lines):
            line_start = current_pos
            line_end = current_pos + len(line) + 1  # +1 for newline
            
            # Check if this line is in a processed range
            is_processed = any(start <= line_start < end for start, end in processed_ranges)
            
            if not is_processed and line.strip().startswith('|') and '|' in line.strip()[1:]:
                if not in_table:
                    table_start_pos = line_start
                    in_table = True
                    table_lines = []
                
                table_lines.append(line)
            else:
                if in_table and table_lines:
                    # Process the table
                    table_content = '\n'.join(table_lines)
                    table_html = self._convert_table_to_html(table_content)
                    
                    section = ContentSection(
                        type='table',
                        content=table_html,
                        metadata={
                            'start_pos': table_start_pos,
                            'end_pos': line_start,
                            'raw_content': table_content
                        }
                    )
                    
                    sections.append(section)
                    ranges.append((table_start_pos, line_start))
                    
                    in_table = False
                    table_lines = []
            
            current_pos = line_end
        
        # Handle table at end of content
        if in_table and table_lines:
            table_content = '\n'.join(table_lines)
            table_html = self._convert_table_to_html(table_content)
            
            section = ContentSection(
                type='table',
                content=table_html,
                metadata={
                    'start_pos': table_start_pos,
                    'end_pos': len(content),
                    'raw_content': table_content
                }
            )
            
            sections.append(section)
            ranges.append((table_start_pos, len(content)))
        
        return {'sections': sections, 'ranges': ranges}
    
    def _extract_think_blocks(self, content: str, processed_ranges: List[tuple]) -> Dict[str, Any]:
        """Extract think blocks from content"""
        import re
        sections = []
        ranges = []
        
        pattern = re.compile(r'<think>\n([\s\S]*?)\n</think>', re.MULTILINE)
        
        for match in pattern.finditer(content):
            # Check if this match is in a processed range
            is_processed = any(start <= match.start() < end for start, end in processed_ranges)
            
            if not is_processed:
                think_content = match.group(1).strip()
                
                section = ContentSection(
                    type='think',
                    content=think_content,
                    metadata={
                        'start_pos': match.start(),
                        'end_pos': match.end(),
                        'raw_content': match.group(0)
                    }
                )
                
                sections.append(section)
                ranges.append((match.start(), match.end()))
        
        return {'sections': sections, 'ranges': ranges}
    
    def _extract_text_sections(self, content: str, processed_ranges: List[tuple]) -> List[ContentSection]:
        """Extract remaining text sections"""
        sections = []
        
        # Sort processed ranges
        processed_ranges.sort()
        
        current_pos = 0
        
        for start, end in processed_ranges:
            # Extract text before this processed range
            if current_pos < start:
                text_content = content[current_pos:start].strip()
                if text_content:
                    # Format the text content
                    formatted_content = self._format_text_content(text_content)
                    
                    section = ContentSection(
                        type='text',
                        content=formatted_content,
                        metadata={
                            'start_pos': current_pos,
                            'end_pos': start
                        }
                    )
                    sections.append(section)
            
            current_pos = end
        
        # Extract remaining text after last processed range
        if current_pos < len(content):
            text_content = content[current_pos:].strip()
            if text_content:
                formatted_content = self._format_text_content(text_content)
                
                section = ContentSection(
                    type='text',
                    content=formatted_content,
                    metadata={
                        'start_pos': current_pos,
                        'end_pos': len(content)
                    }
                )
                sections.append(section)
        
        return sections
    
    def _convert_table_to_html(self, table_content: str) -> str:
        """Convert markdown table to HTML"""
        lines = table_content.strip().split('\n')
        if not lines:
            return ""
        
        html = '<div class="table-container"><table class="table table-bordered table-striped">'
        
        # Process header
        if lines:
            header_cells = [cell.strip() for cell in lines[0].split('|') if cell.strip()]
            if header_cells:
                html += '<thead><tr>'
                for cell in header_cells:
                    html += f'<th>{self._process_table_cell(cell)}</th>'
                html += '</tr></thead>'
        
        # Skip separator line (usually second line with ---)
        body_start = 2 if len(lines) > 1 and '---' in lines[1] else 1
        
        # Process body
        if len(lines) > body_start:
            html += '<tbody>'
            for line in lines[body_start:]:
                cells = [cell.strip() for cell in line.split('|') if cell.strip()]
                if cells:
                    html += '<tr>'
                    for cell in cells:
                        html += f'<td>{self._process_table_cell(cell)}</td>'
                    html += '</tr>'
            html += '</tbody>'
        
        html += '</table></div>'
        return html
    
    def _process_table_cell(self, content: str) -> str:
        """Process individual table cell content"""
        # Handle bold text
        content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)
        # Handle italic text
        content = re.sub(r'\*(.*?)\*', r'<em>\1</em>', content)
        return content
    
    def _format_text_content(self, text: str) -> str:
        """Format regular text content"""
        # Handle headers
        text = re.sub(r'^(#{1,6})\s+(.+)$', r'<h\1>\2</h\1>', text, flags=re.MULTILINE)
        
        # Handle bold text
        text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
        
        # Handle numbered lists
        text = re.sub(r'^\d+\.\s+(.+)$', r'<li>\1</li>', text, flags=re.MULTILINE)
        
        # Handle bullet lists
        text = re.sub(r'^[-*]\s+(.+)$', r'<li>\1</li>', text, flags=re.MULTILINE)
        
        # Wrap consecutive list items
        text = re.sub(
            r'(<li>.*?</li>(?:\s*<li>.*?</li>)*)',
            r'<ul>\1</ul>',
            text,
            flags=re.DOTALL
        )
        
        # Handle paragraphs (split by double newlines)
        paragraphs = text.split('\n\n')
        formatted_paragraphs = []
        
        for para in paragraphs:
            para = para.strip()
            if para and not para.startswith('<'):
                para = f'<p>{para}</p>'
            formatted_paragraphs.append(para)
        
        return '\n'.join(formatted_paragraphs)

# Initialize the content parsing service
content_parser = ContentParsingService()

# Utility functions
def convert_objectid_to_str(chat):
    chat['id'] = str(chat['_id'])
    del chat['_id']
    return chat

# * Use these below functions for end-to-end encryption *

# def evp_bytes_to_key(password: bytes, salt: bytes, key_len: int, iv_len: int):
#     d = d_i = b""
#     while len(d) < key_len + iv_len:
#         d_i = MD5.new(d_i + password + salt).digest()
#         d += d_i
#     return d[:key_len], d[key_len:key_len + iv_len]

# def decrypt(encrypted_b64: str) -> dict:
#     encrypted = base64.b64decode(encrypted_b64)
#     assert encrypted[:8] == b"Salted__"
#     salt = encrypted[8:16]
#     ciphertext = encrypted[16:]

#     key, iv = evp_bytes_to_key(SECRET_KEY.encode(), salt, 32, 16)
#     cipher = AES.new(key, AES.MODE_CBC, iv)
#     decrypted = cipher.decrypt(ciphertext)
#     padding_len = decrypted[-1]
#     json_str = decrypted[:-padding_len].decode('utf-8')
#     return json.loads(json_str)

# def pad(data: bytes) -> bytes:
#     padding_len = AES.block_size - len(data) % AES.block_size
#     return data + bytes([padding_len] * padding_len)

# def encrypt(data: Union[dict, list]) -> str:
#     json_str = json.dumps(data)
#     data_bytes = pad(json_str.encode('utf-8'))

#     salt = os.urandom(8)
#     key, iv = evp_bytes_to_key(SECRET_KEY.encode(), salt, 32, 16)

#     cipher = AES.new(key, AES.MODE_CBC, iv)
#     encrypted = cipher.encrypt(data_bytes)

#     # Prepend OpenSSL salt header: Salted__ + 8-byte salt
#     openssl_payload = b"Salted__" + salt + encrypted
#     return base64.b64encode(openssl_payload).decode('utf-8')

# * ------------------------END------------------------ *


async def build_context_messages(chat_history: List[dict], current_prompt: str, chat_id: str) -> List[dict]:
    """Build optimized context using recent messages + relevant memories"""
    
    # Get recent messages (last N messages)
    recent_messages = chat_history[-MAX_CONTEXT_MESSAGES:] if len(chat_history) > MAX_CONTEXT_MESSAGES else chat_history
    
    # Get relevant memories from older conversation
    relevant_memories = []
    if len(chat_history) > MAX_CONTEXT_MESSAGES:
        # Update memory with all messages
        await memory_service.store_conversation_memory(chat_id, chat_history)
        
        # Retrieve relevant memories based on current prompt
        memories = await memory_service.retrieve_relevant_memory(chat_id, current_prompt)
        
        # Filter to only include memories from older messages
        for memory in memories:
            if memory['message_index'] < len(chat_history) - MAX_CONTEXT_MESSAGES:
                relevant_memories.append(memory)
    
    # Combine recent messages with relevant memories
    context_messages = []
    
    # Add relevant memories first (as context)
    for memory in relevant_memories[:3]:  # Limit to top 3 memories
        context_messages.append({
            "role": "user" if memory["type"] == "user" else "assistant",
            "content": f"[Previous Context] {memory['content']}"
        })
    
    # Add recent messages
    for msg in recent_messages:
        context_messages.append({
            "role": "user" if msg["type"] == "user" else "assistant",
            "content": msg["content"]
        })
    
    return context_messages

class EncryptedData(BaseModel):
    data: str


# API Endpoints

# ** API Func to test e2e encryption/decryption -----------START-----

# @app.post("/crxtest")
# async def crxtest(payload: EncryptedData):
#     print(f"-- REQ --{payload.data}")
#     dcrData = decrypt(payload.data)
#     print(f"--- DCR_DATA --- {dcrData}")
    
#     ecrData = encrypt(dcrData)
#     print(f"--- ECR_DATA --- {ecrData}")
    
#     return ecrData

# ** API Func to test e2e encryption/decryption -------------END-----

@app.get("/models")
async def list_ollama_models():
    """List all locally installed Ollama models"""
    try:
        # Use ollama library instead of subprocess
        models = ollama.list()
        return models
        
    except Exception as e:
        logger.error(f"Error listing Ollama models: {str(e)}")
        return JSONResponse(
            status_code=200,
            content={
                "error": "Failed to list Ollama models",
                "success": False,
                "models": [],
                "details": str(e),
                "suggestion": "Make sure Ollama is running and accessible"
            }
        )

# Alternative version if you want to keep using subprocess with better error handling
# todo: Will implement later

@app.get("/models-subprocess")
async def list_ollama_models_subprocess():
    """Alternative implementation using subprocess"""
    try:
        import shutil
        
        # Check if ollama command exists
        if not shutil.which("ollama"):
            return JSONResponse(
                status_code=500,
                content={"error": "Ollama CLI not found in PATH"}
            )
        
        result = subprocess.run(
            ["ollama", "list"],  # Remove --json flag first to see raw output
            capture_output=True,
            text=True,
            timeout=30  # Add timeout
        )
        
        logger.info(f"Ollama command return code: {result.returncode}")
        logger.info(f"Ollama stdout: {result.stdout}")
        logger.info(f"Ollama stderr: {result.stderr}")

        if result.returncode != 0:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Ollama command failed",
                    "return_code": result.returncode,
                    "stderr": result.stderr,
                    "stdout": result.stdout
                }
            )

        # Try with --json flag
        result_json = subprocess.run(
            ["ollama", "list", "--json"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result_json.returncode == 0:
            try:
                models = json.loads(result_json.stdout)
                return models
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": "Failed to parse JSON output",
                        "raw_output": result_json.stdout,
                        "json_error": str(e)
                    }
                )
        else:
            # Fallback: parse the regular output
            return parse_ollama_list_output(result.stdout)

    except subprocess.TimeoutExpired:
        return JSONResponse(
            status_code=500,
            content={"error": "Ollama command timed out"}
        )
    except FileNotFoundError:
        return JSONResponse(
            status_code=500,
            content={"error": "Ollama CLI not found. Is it installed and in your PATH?"}
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Unexpected error", "details": str(e)}
        )

def parse_ollama_list_output(output: str) -> dict:
    """Parse the regular ollama list output into JSON format"""
    lines = output.strip().split('\n')
    models = []
    
    for line in lines[1:]:  # Skip header
        if line.strip():
            parts = line.split()
            if len(parts) >= 3:
                models.append({
                    "name": parts[0],
                    "id": parts[1] if len(parts) > 1 else "",
                    "size": parts[2] if len(parts) > 2 else "",
                    "modified": " ".join(parts[3:]) if len(parts) > 3 else ""
                })
    
    return {"models": models}

@app.post("/chats")
async def create_chat(chat: Chat):
    print(f"chat :: {chat}")
# async def create_chat(payload: EncryptedRequest):
    # chat = Chat(**decrypt(payload.data))
    chat_dict = chat.model_dump()
    chat_dict['created_at'] = datetime.now().isoformat()
    chat_dict['updated_at'] = chat_dict['created_at']

    result = await chats_collection.insert_one(chat_dict)
    created_chat = await chats_collection.find_one({'_id': result.inserted_id})
    
    return convert_objectid_to_str(created_chat)

@app.get("/chats", response_model=List[ChatResponse])
async def get_chats():
    chats = []
    cursor = chats_collection.find().sort('updated_at', -1)
    async for chat in cursor:
        chats.append(convert_objectid_to_str(chat))
    # encChats = encrypt(chats)
    return chats

@app.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    try:
        chat = await chats_collection.find_one({'_id': ObjectId(chat_id)})
        if chat:
            return convert_objectid_to_str(chat)
        raise HTTPException(status_code=404, detail="Chat not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/chats/{chat_id}")
async def update_chat(chat_id: str, chat: Chat):
    chat_dict = chat.dict()
    chat_dict['updated_at'] = datetime.now().isoformat()
    
    result = await chats_collection.update_one(
        {'_id': ObjectId(chat_id)},
        {'$set': chat_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    updated_chat = await chats_collection.find_one({'_id': ObjectId(chat_id)})
    
    # Update memory
    if updated_chat and 'messages' in updated_chat:
        await memory_service.store_conversation_memory(chat_id, updated_chat['messages'])
    
    return convert_objectid_to_str(updated_chat)

@app.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    result = await chats_collection.delete_one({'_id': ObjectId(chat_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Delete associated memory
    await memory_service.delete_chat_memory(chat_id)
    
    return {"message": "Chat deleted successfully"}


# Add this new function to handle real-time database updates during streaming
async def update_chat_message_content(chat_id: str, message_index: int, content: str, is_streaming: bool = True):
    """Update specific message content in the database during streaming"""
    try:
        # Update the specific message in the messages array
        result = await chats_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    f"messages.{message_index}.content": content,
                    f"messages.{message_index}.isStreaming": is_streaming,
                    "updated_at": datetime.now().isoformat()
                }
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating message content: {str(e)}")
        return False


async def stream_model_response(prompt: str, model_value: str, chat_history: List[dict] | None = None, chat_id: str | None = None):
    accumulated_content = ""
    ai_message_index = None
    
    try:
        # Find the index of the AI message we're updating
        if chat_id and chat_history:
            ai_message_index = len(chat_history) + 1
        
        # Build context messages
        if chat_history and chat_id:
            context_messages = await build_context_messages(chat_history, prompt, chat_id)
        else:
            context_messages = []
            if chat_history:
                for msg in chat_history:
                    context_messages.append({
                        "role": "user" if msg["type"] == "user" else "assistant",
                        "content": msg["content"]
                    })
        
        context_messages.append({"role": "user", "content": prompt})
        
        logger.info(f"Using {len(context_messages)} messages for context")
        
        stream = ollama.chat(
            model=model_value,
            messages=context_messages,
            stream=True,
            options={"temperature": TEMPERATURE}
        )
        
        # Stream and update database simultaneously
        for chunk in stream:
            if chunk and hasattr(chunk, 'message') and chunk.message.content:
                accumulated_content += chunk.message.content
                
                # Parse content into sections for better frontend handling
                sections = content_parser.parse_content_to_sections(accumulated_content)
                
                # Update database with current accumulated content and sections
                if chat_id and ai_message_index is not None:
                    await update_chat_message_with_sections(
                        chat_id, 
                        ai_message_index, 
                        accumulated_content,
                        sections,
                        is_streaming=True
                    )
                
                # Yield to frontend with sections
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "content": chunk.message.content,
                        "accumulated_content": accumulated_content,
                        "sections": [section.dict() for section in sections],
                        "status": "streaming",
                        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                }
                await asyncio.sleep(0.01)
        
        # Mark as complete in database
        if chat_id and ai_message_index is not None:
            final_sections = content_parser.parse_content_to_sections(accumulated_content)
            await update_chat_message_with_sections(
                chat_id, 
                ai_message_index, 
                accumulated_content,
                final_sections,
                is_streaming=False
            )
            
            # Update memory
            updated_chat = await chats_collection.find_one({'_id': ObjectId(chat_id)})
            if updated_chat and 'messages' in updated_chat:
                await memory_service.store_conversation_memory(chat_id, updated_chat['messages'])
        
    except Exception as e:
        logger.error(f"Error in stream_model_response: {str(e)}")
        
        if chat_id and ai_message_index is not None:
            error_content = accumulated_content + f"\n\n[Error occurred: {str(e)}]"
            error_sections = content_parser.parse_content_to_sections(error_content)
            await update_chat_message_with_sections(
                chat_id, 
                ai_message_index, 
                error_content,
                error_sections,
                is_streaming=False
            )
        
        yield {
            "event": "error",
            "data": json.dumps({
                "error": str(e),
                "status": "error",
                "accumulated_content": accumulated_content
            })
        }
    finally:
        yield {
            "event": "message",
            "data": json.dumps({
                "content": "",
                "status": "complete",
                "accumulated_content": accumulated_content,
                "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        }

# * Update the database update function to handle sections
async def update_chat_message_with_sections(chat_id: str, message_index: int, content: str, sections: List[ContentSection], is_streaming: bool = True):
    """Update message content with parsed sections in the database"""
    try:
        result = await chats_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    f"messages.{message_index}.content": content,
                    f"messages.{message_index}.sections": [section.dict() for section in sections],
                    f"messages.{message_index}.isStreaming": is_streaming,
                    "updated_at": datetime.now().isoformat()
                }
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating message with sections: {str(e)}")
        return False

# * Update the stream endpoint to prepare the chat with user and AI messages before streaming
@app.get("/stream-generate")
async def stream_completion(prompt: str, chat_id: Optional[str] = None):
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    chat_history = []
    model_value = None
    
    if chat_id:
        chat = await chats_collection.find_one({'_id': ObjectId(chat_id)})
        if chat and 'messages' in chat:
            chat_history = chat['messages']
            if 'model' in chat and 'name' in chat['model']:
                model_value = chat['model']['name']
            else:
                raise HTTPException(status_code=400, detail="Model information is missing from the chat")
        else:
            raise HTTPException(status_code=404, detail="Chat not found or has no messages")
        
        # Add user message and empty AI message to the database before streaming
        user_message = {
            "type": "user",
            "content": prompt,
            "timestamp": datetime.now().isoformat()
        }
        
        ai_message = {
            "type": "ai",
            "content": "",
            "timestamp": datetime.now().isoformat(),
            "isStreaming": True
        }
        
        # Update chat with new messages
        updated_messages = chat_history + [user_message, ai_message]
        await chats_collection.update_one(
            {'_id': ObjectId(chat_id)},
            {
                '$set': {
                    'messages': updated_messages,
                    'updated_at': datetime.now().isoformat()
                }
            }
        )
        
        # Update chat_history for context
        chat_history = chat_history  # Don't include the new messages in context yet
        
    else:
        raise HTTPException(status_code=400, detail="For new chats, please use the POST /chats endpoint first")
    
    return EventSourceResponse(
        stream_model_response(prompt, model_value, chat_history, chat_id),
        media_type="text/event-stream"
    )

# * Add new endpoint to handle cancellation
@app.post("/stream-generate/{chat_id}/cancel")
async def cancel_stream_generation(chat_id: str):
    """Handle stream cancellation and store partial response"""
    try:
        # Get the current chat
        chat = await chats_collection.find_one({'_id': ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        messages = chat.get('messages', [])
        if messages:
            # Find the last AI message and mark it as cancelled
            for i in range(len(messages) - 1, -1, -1):
                if messages[i]['type'] == 'ai':
                    messages[i]['content'] += '\n\n[Generation cancelled]'
                    messages[i]['isStreaming'] = False
                    break
            
            # Update the chat in database
            await chats_collection.update_one(
                {'_id': ObjectId(chat_id)},
                {
                    '$set': {
                        'messages': messages,
                        'updated_at': datetime.now().isoformat()
                    }
                }
            )
            
            # Update memory
            await memory_service.store_conversation_memory(chat_id, messages)
            
            return {"message": "Generation cancelled and stored"}
        
        return {"message": "No active generation found"}
        
    except Exception as e:
        logger.error(f"Error cancelling generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chats/{chat_id}/update-memory")
async def update_chat_memory(chat_id: str):
    """Manually update memory for a chat"""
    try:
        chat = await chats_collection.find_one({'_id': ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        if 'messages' in chat and chat['messages']:
            await memory_service.store_conversation_memory(chat_id, chat['messages'])
            return {"message": f"Memory updated for chat {chat_id}"}
        else:
            return {"message": "No messages to store in memory"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chats/{chat_id}/memory-stats")
async def get_memory_stats(chat_id: str):
    """Get memory statistics for a chat"""
    try:
        count = await memories_collection.count_documents({"chat_id": chat_id})
        return {
            "chat_id": chat_id,
            "stored_memories": count,
            "memory_type": "keyword_based"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "memory_system": "keyword_based",
        "database": "mongodb"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
