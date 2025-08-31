import { Routes } from '@angular/router';
import { WebUiWrapperComponent } from './web-ui/web-ui-wrapper/web-ui-wrapper.component';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'chat', component: WebUiWrapperComponent },
  { path: 'chat/:id', component: WebUiWrapperComponent },
];
