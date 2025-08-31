import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  output,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ParsedSection, ResponseSection } from '../web-ui.model';
import { LoaderOneComponent } from '../../shared/loader-one/loader-one.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, skip, Subject, take, takeUntil } from 'rxjs';
import { MatRippleModule } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { Clipboard } from '@angular/cdk/clipboard';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { AppLogoComponent } from '../../shared/app-logo';
import { syntaxRules, Token } from '../../models/syntaxRules';
import {
  Chat,
  ContentSection,
  LLMmodel,
  Message,
} from '../../models/ai-response.interface';
import { AIResponseService } from '../services/web-ui.service';

@Component({
  selector: 'app-main-area',
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatToolbarModule,
    FormsModule,
    CommonModule,
    LoaderOneComponent,
    MatRippleModule,
    ClipboardModule,
    CustomDropdownComponent,
    MatButtonModule,
    AppLogoComponent,
  ],
  templateUrl: './main-area.component.html',
  styleUrl: './main-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainAreaComponent {
  modelList = signal<LLMmodel[]>([]);
  selectedOption = signal<LLMmodel>({});
  toggleKey = signal<boolean>(false);
  isResponseFetching = signal<boolean>(false);
  sections = signal<ResponseSection[]>([]);
  parsedSections = signal<ParsedSection[]>([]);
  response = signal<string>('');
  userPrompt = signal<string>('');
  messages = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  chats = signal<Chat[]>([]);
  currentChatId = signal<string | null | undefined>(undefined);
  previousChatId = signal<string>('');

  hasMessages = computed(() => this.messages().length > 0);
  showMessagesContainer = computed(
    () => this.isResponseFetching() || this.currentChatId()
  );

  toggleSidebar = output<boolean>();
  messagesContainer = viewChild.required<ElementRef>('messagesContainer');

  private currentEventSource: EventSource | null = null;
  private actRoute = inject(ActivatedRoute);
  private apiSrv = inject(AIResponseService);
  private sanitizer = inject(DomSanitizer);
  private clipboard = inject(Clipboard);
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.apiSrv
      .getModelsList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.models.length) {
            this.modelList.set(result.models);
            this.selectedOption.set(this.modelList()[0]);
          }
        },
      });

    const routeChatId = this.actRoute.snapshot.paramMap.get('id')!;
    this.currentChatId.set(routeChatId);

    if (!this.currentChatId()) {
      this.apiSrv.selectedChatSubject
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res === null) {
            this.currentChatId.set(null);
          } else {
            this.currentChatId.set(res?.id);
          }
        });
    }

    this.apiSrv.sharedSelectedChat
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe({
        next: (chat) => {
          if (chat?.id) {
            this.currentChatId.set(chat.id);
            this.fetchChatData(chat.id);
          } else {
            this.isLoading.set(false);
            this.messages.set([]);
            this.currentChatId.set('');
          }
        },
      });

    if (this.currentChatId()) {
      this.fetchChatData(this.currentChatId()!);
    }
  }

  onSelectionChange(selectedModel: LLMmodel) {
    this.selectedOption.set(selectedModel);
  }

  private fetchChatData(chatId: string): void {
    this.apiSrv
      .getChat(chatId)
      .pipe(take(1))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.processMessages(res);
        },
        error: (err) => {
          console.error('Error fetching chat data:', err);
        },
      });
  }

  private baseUrl = 'http://localhost:8000';

  streamResponse(prompt: string): Observable<any> {
    const subject = new Subject<any>();

    if (!this.currentChatId()) {
      subject.error(new Error('No chat ID available. Create a chat first.'));
      return subject.asObservable();
    }

    this.currentEventSource = new EventSource(
      `${this.baseUrl}/stream-generate?prompt=${encodeURIComponent(
        prompt
      )}&chat_id=${this.currentChatId()}`
    );

    this.currentEventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        subject.next(data);

        if (data.status === 'complete') {
          this.currentEventSource?.close();
          this.currentEventSource = null;
          subject.complete();
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    });

    this.currentEventSource.addEventListener('error', (error) => {
      console.error('EventSource error:', error);
      this.currentEventSource?.close();
      this.currentEventSource = null;
      subject.error(error);
    });

    return subject.asObservable();
  }

  initiateChat() {
    if (!this.userPrompt().trim() || this.isLoading()) return;

    this.isResponseFetching.set(true);
    this.isLoading.set(true);

    const newMessage: Message = {
      type: 'user',
      content: this.userPrompt(),
      timestamp: new Date().toISOString(),
    };

    const aiMessage: Message = {
      type: 'ai',
      content: '',
      formattedContent: '',
      sections: [],
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    const currentMessages = this.messages();
    this.messages.set([...currentMessages, newMessage, aiMessage]);

    const currentPrompt = this.userPrompt();

    const chatData = {
      title: this.messages()[0]?.content.substring(0, 50) || 'New Chat',
      messages: this.messages(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      model: {
        name: this.selectedOption()?.model,
        size: this.selectedOption()?.size,
      },
    };

    const processStreamResponse = () => {
      this.streamResponse(currentPrompt)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            if (data.content) {
              aiMessage.content += data.content;

              // Update sections if available
              if (data.sections) {
                aiMessage.sections = data.sections;
              }

              // Keep formatted content for fallback
              aiMessage.formattedContent = this.formatText(aiMessage.content);

              const updatedMessages = this.messages();
              this.messages.set([...updatedMessages]);

              this.scrollToBottom();
            }

            if (data.status === 'complete') {
              aiMessage.isStreaming = false;
              const finalMessages = this.messages();
              this.messages.set([...finalMessages]);
            }
          },
          error: (error) => {
            console.error('Error:', error);
            if (this.currentEventSource !== null) {
              const currentMessages = this.messages();
              currentMessages.pop();
              this.messages.set([
                ...currentMessages,
                {
                  type: 'error',
                  content:
                    'An error occurred while connecting to the server. Please try again later.',
                  timestamp: new Date().toISOString(),
                },
              ]);
            }
            this.isLoading.set(false);
            this.isResponseFetching.set(false);
          },
          complete: () => {
            this.userPrompt.set('');
            this.isLoading.set(false);
            this.isResponseFetching.set(false);
            aiMessage.isStreaming = false;
          },
        });
    };

    if (!this.currentChatId()) {
      this.apiSrv
        .createChat(chatData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (chat) => {
            this.currentChatId.set(chat.id!);
            window.history.pushState({}, '', `/chat/${this.currentChatId()}`);
            processStreamResponse();
          },
          error: (error) => {
            console.error('Error creating chat:', error);
            this.isLoading.set(false);
            this.isResponseFetching.set(false);

            const currentMessages = this.messages();
            currentMessages.pop();
            currentMessages.pop();

            this.messages.set([
              ...currentMessages,
              {
                type: 'error',
                content: 'Error creating chat. Please try again.',
                timestamp: new Date().toISOString(),
              },
            ]);
          },
        });
    } else {
      processStreamResponse();
    }
  }

  private processMessages(res: any): void {
    res?.messages.forEach((element: Message) => {
      // Process sections if available, otherwise fall back to formatted content
      if (element.sections && element.sections.length > 0) {
        // Content already structured
      } else {
        // Fall back to old formatting for backward compatibility
        element.formattedContent = this.formatText(element.content);
      }
    });

    this.messages.set(res?.messages || []);

    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
  }

  cancelGeneration() {
    if (this.currentEventSource) {
      this.currentEventSource.close();
      this.currentEventSource = null;

      if (this.currentChatId()) {
        this.apiSrv
          .cancelStreamGeneration(this.currentChatId()!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              const currentMessages = this.messages();
              const lastMessage = currentMessages[currentMessages.length - 1];

              if (lastMessage && lastMessage.type === 'ai') {
                lastMessage.content += '\n\n[Generation cancelled]';
                lastMessage.formattedContent =
                  this.sanitizer.bypassSecurityTrustHtml(
                    this.formatText(lastMessage.content)
                  );
                lastMessage.isStreaming = false;
                this.messages.set([...currentMessages]);
              }
            },
            error: (error) => {
              console.error('Error handling cancellation:', error);

              const currentMessages = this.messages();
              const lastMessage = currentMessages[currentMessages.length - 1];

              if (lastMessage && lastMessage.type === 'ai') {
                lastMessage.content += '\n\n[Generation cancelled]';
                lastMessage.formattedContent =
                  this.sanitizer.bypassSecurityTrustHtml(
                    this.formatText(lastMessage.content)
                  );
                lastMessage.isStreaming = false;
                this.messages.set([...currentMessages]);
              }
            },
          });
      }

      this.isLoading.set(false);
      this.isResponseFetching.set(false);
      this.userPrompt.set('');
    }
  }

  refreshChatFromServer() {
    if (this.currentChatId()) {
      this.fetchChatData(this.currentChatId()!);
    }
  }

  private formatText(text: string): string {
    let formattedText = text;
    // formattedText = this.formatTables(formattedText);
    // formattedText = this.formatCodeBlocks(formattedText);
    formattedText = this.formatBoldText(formattedText);
    formattedText = this.formatLists(formattedText);
    formattedText = this.formatHeaders(formattedText);
    formattedText = this.formatParagraphs(formattedText);
    formattedText = this.formatThinkBlocks(formattedText);
    return formattedText;
  }

  private formatTables(text: string): string {
    const tableRegex = /\|(.+)\|[\r\n]/g;
    const hasTable = text.match(tableRegex);

    if (!hasTable) return text;

    const lines = text.split('\n');
    let isInTable = false;
    let tableHTML =
      '<div class="table-responsive"><table class="table table-bordered">';

    for (let line of lines) {
      if (line.trim().startsWith('|')) {
        if (!isInTable) {
          isInTable = true;
          tableHTML += '<thead>';
        }

        const cells = line.split('|').filter((cell) => cell.trim().length > 0);
        const isHeader = cells.some((cell) => cell.includes('---'));

        if (isHeader) {
          tableHTML += '</thead><tbody>';
          continue;
        }

        tableHTML += '<tr>';
        cells.forEach((cell) => {
          const cellContent = cell.trim();
          if (isInTable && !tableHTML.includes('</thead>')) {
            tableHTML += `<th>${this.processTableCell(cellContent)}</th>`;
          } else {
            tableHTML += `<td>${this.processTableCell(cellContent)}</td>`;
          }
        });
        tableHTML += '</tr>';
      } else if (isInTable) {
        isInTable = false;
        tableHTML += '</tbody></table></div>';
        text = text.replace(/\|[\s\S]+?\n\n/, tableHTML);
      }
    }

    return text;
  }

  private processTableCell(content: string): string {
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return content;
  }

  getCodeById(id: string): string {
    const element = document.getElementById(id);
    if (element) {
      return element.getAttribute('data-raw-code') || '';
    }
    return '';
  }

  copyCode(event: MouseEvent, elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      const rawCode = element.getAttribute('data-raw-code') || '';
      const success = this.clipboard.copy(rawCode);

      const button = event.target as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    }
  }

  highlightSyntax(code: string, language: string): string {
    if (!language) return this.escapeHtml(code);

    let highlighted = this.escapeHtml(code);

    const tokens: Token[] = [{ text: highlighted, type: null }];

    if (language in syntaxRules) {
      const rules = syntaxRules[language];

      for (const [ruleKey, rule] of Object.entries(rules)) {
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];

          if (token.type === null) {
            const segments: Token[] = [];
            let lastIndex = 0;

            const textToMatch = token.text;
            const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);

            let match;
            while ((match = pattern.exec(textToMatch)) !== null) {
              if (match.index > lastIndex) {
                segments.push({
                  text: textToMatch.substring(lastIndex, match.index),
                  type: null,
                });
              }

              segments.push({
                text: match[0],
                type: rule.className,
              });

              lastIndex = match.index + match[0].length;

              if (match.index === pattern.lastIndex) {
                pattern.lastIndex++;
              }
            }

            if (lastIndex < textToMatch.length) {
              segments.push({
                text: textToMatch.substring(lastIndex),
                type: null,
              });
            }

            if (segments.length > 0) {
              tokens.splice(i, 1, ...segments);
              i += segments.length - 1;
            }
          }
        }
      }
    }

    if (language === 'typescript' || language === 'javascript') {
      for (let i = 0; i < tokens.length - 1; i++) {
        if (
          tokens[i].text === 'function' &&
          tokens[i].type === 'keyword' &&
          tokens[i + 1].type === null &&
          /^[\s]+[a-zA-Z_$][\w$]*/.test(tokens[i + 1].text)
        ) {
          const match = tokens[i + 1].text.match(
            /^([\s]+)([a-zA-Z_$][\w$]*)(.*)/
          );

          if (match) {
            tokens.splice(
              i + 1,
              1,
              { text: match[1], type: null },
              { text: match[2], type: 'function' },
              { text: match[3], type: null }
            );
          }
        }
      }
    }

    return tokens
      .map((token) => {
        if (token.type) {
          return `<span class="token ${token.type}">${token.text}</span>`;
        }
        return token.text;
      })
      .join('');
  }

  private formatBoldText(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<span class="bold">$1</span>');
  }

  private formatLists(text: string): string {
    text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    text = text.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

    text = text.replace(
      /<li>(?:[^<]+|<(?!\/li>))*<\/li>(?:\s*<li>(?:[^<]+|<(?!\/li>))*<\/li>)*/g,
      (match) => {
        return match.includes('1.') ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
      }
    );

    return text;
  }

  private formatHeaders(text: string): string {
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      return `<p>${content}</p>`;
    });
  }

  private formatParagraphs(text: string): string {
    return text.replace(/(?:^|\n\n)([^\n]+)(?:\n\n|$)/g, '<p>$1</p>');
  }

  private formatThinkBlocks(text: string): string {
    return text.replace(
      /<think>\n([\s\S]*?)\n<\/think>/g,
      '<div class="think-block" style="background: transparent; padding: 15px; margin: 15px 0;">$1</div>'
    );
  }

  private escapeHtml(text: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>]/g, (char) => htmlEntities[char]);
  }

  trackBySection(index: number, section: ContentSection): string {
    return `${section.type}-${index}-${section.content?.substring(0, 50)}`;
  }

  // Copy code section content
  copyCodeSection(content: string): void {
    const success = this.clipboard.copy(content);
    if (success) {
      // You can add a toast notification here
    }
  }

  // Copy table section content
  copyTableSection(section: ContentSection): void {
    // Extract text content from HTML table for copying
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = section.content;
    const tableText = this.extractTableText(tempDiv);

    const success = this.clipboard.copy(tableText);
    if (success) {
    }
  }

  // Extract plain text from table HTML
  private extractTableText(element: HTMLElement): string {
    const rows = element.querySelectorAll('tr');
    const textRows: string[] = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll('th, td');
      const cellTexts = Array.from(cells).map(
        (cell) => cell.textContent?.trim() || ''
      );
      textRows.push(cellTexts.join('\t')); // Tab-separated values
    });

    return textRows.join('\n');
  }

  // Toggle think section visibility
  toggleThinkSection(event: Event): void {
    const button = event.target as HTMLElement;
    const thinkContainer = button.closest('.think-container');
    const thinkContent = thinkContainer?.querySelector('.think-content');
    const icon = button.querySelector('i');

    if (thinkContent && icon) {
      if (thinkContent.classList.contains('collapsed')) {
        thinkContent.classList.remove('collapsed');
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
      } else {
        thinkContent.classList.add('collapsed');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
      }
    }
  }

  toggle() {
    this.toggleKey.update((value) => !value);
    this.toggleSidebar.emit(this.toggleKey());
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer().nativeElement.scrollTop =
        this.messagesContainer().nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
