import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ModelService } from '../services/model.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../shared.scss', './login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private model: ModelService,
    private router: Router
    ) {
    
   }

  ngOnInit(): void {
  }

  eventHubConnectionString: string = this.model.eventHubConnection;
  eventHubAccessKey: string = this.model.eventHubKey;
  isDemoMode: boolean = this.model.demoMode;
  isStartDisabled: boolean = true;

  setDemo(completed: boolean) {
      this.isDemoMode = completed;
      
      this.setStart();
    }
  
  setStart(): void {
    this.isStartDisabled = true;

    if (this.isDemoMode)
    {
      this.isStartDisabled = false;
    }

    if (this.eventHubConnectionString != null && this.eventHubConnectionString.length>0 && this.eventHubAccessKey != null && this.eventHubAccessKey.length>0)
    {
      this.isStartDisabled = false;
    }

    }
  
    navigateNext(): void {
      this.model.eventHubConnection = this.eventHubConnectionString;
      this.model.eventHubKey = this.eventHubAccessKey;
      this.model.demoMode = this.isDemoMode;

      this.router.navigateByUrl('/live')
    }
}
