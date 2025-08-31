import { inject, Injectable, signal } from '@angular/core';
import { ResponseSection } from '../web-ui.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chat, LLMmodel } from '../../models/ai-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AIResponseService {
  http = inject(HttpClient);

  selectedChatSubject = new BehaviorSubject<Chat | null>(null);
  sharedSelectedChat = this.selectedChatSubject.asObservable();

  private fetchChatListSignal = signal(false);

  private baseUrl = 'http://localhost:8000';

  get fetchList$() {
    return this.fetchChatListSignal.asReadonly();
  }

  fetchListApiCall() {
    this.fetchChatListSignal.set(true);
  }

  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.baseUrl}/chats`);
  }

  getModelsList(): Observable<{ models: LLMmodel[] }> {
    return this.http.get<{ models: LLMmodel[] }>(`${this.baseUrl}/models`);
  }

  getChat(id: string): Observable<Chat> {
    return this.http.get<Chat>(`${this.baseUrl}/chats/${id}`);
  }

  createChat(chat: Omit<Chat, 'id'>): Observable<Chat> {
    return this.http.post<Chat>(`${this.baseUrl}/chats`, chat);
  }

  updateChat(id: string, chat: Omit<Chat, 'id'>): Observable<Chat> {
    return this.http.put<Chat>(`${this.baseUrl}/chats/${id}`, chat);
  }

  deleteChat(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/chats/${id}`);
  }

  parseResponse(text: string): ResponseSection[] {
    const sections: ResponseSection[] = [];

    // Split text into sections
    const lines = text.split('\n');
    let currentSection: ResponseSection | null = null;
    let codeBlockOpen = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle thinking sections
      if (line.includes('<think>')) {
        currentSection = { type: 'thinking', content: '' };
        continue;
      } else if (line.includes('</think>')) {
        if (currentSection?.type === 'thinking') {
          sections.push(currentSection);
          currentSection = null;
        }
        continue;
      }

      // Handle code blocks
      if (line.includes('```')) {
        if (!codeBlockOpen) {
          const language = line.replace('```', '').trim();
          currentSection = {
            type: 'code',
            content: '',
            language: language || 'typescript',
          };
          codeBlockOpen = true;
        } else {
          if (currentSection?.type === 'code') {
            sections.push(currentSection);
          }
          currentSection = null;
          codeBlockOpen = false;
        }
        continue;
      }

      // Handle headings
      if (line.startsWith('###')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'heading',
          content: line.replace(/^###\s+/, ''),
          level: 3,
        };
        sections.push(currentSection);
        currentSection = null;
        continue;
      }

      // Handle numbered lists and steps
      if (/^\d+\.\s/.test(line)) {
        if (currentSection?.type !== 'steps') {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            type: 'steps',
            content: '',
            items: [],
          };
        }
        currentSection.items?.push(line.replace(/^\d+\.\s/, ''));
        continue;
      }

      // Add content to current section
      if (currentSection) {
        currentSection.content += line + '\n';
      } else if (line.trim()) {
        currentSection = {
          type: 'text',
          content: line + '\n',
        };
        sections.push(currentSection);
        currentSection = null;
      }
    }

    // Add final section if exists
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  cancelStreamGeneration(chatId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/stream-generate/${chatId}/cancel`,
      {}
    );
  }
}
