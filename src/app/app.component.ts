import {Component} from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AgentWindowComponent } from './components/agent-window/agent-window.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavbarComponent,
    RouterOutlet,
    AgentWindowComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'bytewise';
}
