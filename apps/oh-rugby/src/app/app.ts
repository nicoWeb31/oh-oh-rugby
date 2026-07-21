import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';

@Component({
  imports: [NxWelcome, RouterModule],
  selector: 'oh-rugby-root',
  template: `<oh-rugby-nx-welcome></oh-rugby-nx-welcome>
    <router-outlet></router-outlet>`,
  styles: ``,
})
export class App {
  protected title = 'oh-rugby';
}
