import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MainAreaComponent } from '../main-area/main-area.component';
import { MediaMatcher } from '@angular/cdk/layout';

@Component({
  selector: 'app-web-ui-wrapper',
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatToolbarModule,
    SidebarComponent,
    MainAreaComponent,
  ],
  templateUrl: './web-ui-wrapper.component.html',
  styleUrl: './web-ui-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebUiWrapperComponent {
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;
  isSidenavOpen = true;
  constructor(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', () => {
      this.isSidenavOpen = this.mobileQuery.matches ? false : true;
      this._mobileQueryListener;
    });
  }
  ngOnInit(): void {
    this.isSidenavOpen = this.mobileQuery.matches ? false : true;
  }

  toggleSidenav(event: boolean) {
    if (this.mobileQuery.matches) {
      this.isSidenavOpen = event ? true : false;
    } else {
      this.isSidenavOpen = !event ? true : false;
    }
  }
}
