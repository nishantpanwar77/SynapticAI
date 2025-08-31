export interface AIStreamResponse {
  content: string;
  status: 'streaming' | 'complete';
  time: string;
}

export interface ParsedElement {
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'table' | 'blockquote';
  content: string;
  level?: number;
  language?: string;
  items?: string[];
  rows?: string[][];
}

export interface ContentSection {
  type: 'text' | 'code' | 'table' | 'list' | 'header' | 'think';
  content: string;
  language?: string; // For code blocks
  metadata?: { [key: string]: any };
}

export interface Message {
  type: 'user' | 'ai' | 'error';
  content: string;
  formattedContent?: string;
  sections?: ContentSection[]; // New property for structured content
  timestamp: string;
  isStreaming?: boolean;
  model?: LLMmodel;
}

export interface Chat {
  id?: string;
  title?: string;
  messages?: Message[];
  created_at?: string;
  updated_at?: string;
  model?: LLMmodel;
}

export interface LLMmodel {
  model?: string;
  size?: number;
}
