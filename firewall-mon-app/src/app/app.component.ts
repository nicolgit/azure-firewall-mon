import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'az-firewall-mon';

  constructor(private router: Router,
    private logingService: LoggingService) {
      
  }
}
