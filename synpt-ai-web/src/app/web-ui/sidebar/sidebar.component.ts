import {
  ChangeDetectionStrategy,
  Component,
  inject,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppLogoComponent } from '../../shared/app-logo';
import { AIResponseService } from '../services/web-ui.service';
import { Chat } from '../../models/ai-response.interface';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatToolbarModule,
    MatRippleModule,
    AppLogoComponent,
    MatDialogModule,
    MatButtonModule,
    AsyncPipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  today = new Date();
  chats!: Observable<Chat[]>;
  currentChatId: string | null = null;

  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  apiSrv = inject(AIResponseService);
  route = inject(Router);
  dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadChats();
  }

  loadChats() {
    this.chats = this.apiSrv.getChats();
  }

  createNewChat() {
    this.currentChatId = null;
    this.apiSrv.selectedChatSubject.next(null);
    this.route.navigate(['/chat']);
  }

  timeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4)
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12)
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  }

  onSelectChat(chat: Chat) {
    this.route.navigateByUrl('/', { browserUrl: `chat/${chat.id}` });
    this.apiSrv.selectedChatSubject.next(chat);
  }

  deleteChat(chatId: string) {
    this.dialog
      .open(this.deleteDialog)
      .afterClosed()
      .subscribe({
        next: (value) => {
          if (value) {
            this.apiSrv.deleteChat(chatId).subscribe({
              next: () => {
                this.loadChats();
                if (this.currentChatId === chatId) {
                  this.createNewChat();
                  this.loadChats();
                }
              },
              error(err) {
                console.error('Error deleting chat:', err);
              },
            });
          }
        },
      });
  }
}
