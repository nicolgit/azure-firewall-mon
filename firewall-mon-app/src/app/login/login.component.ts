import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

import { ModelService } from '../services/model.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../shared.scss', './login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private model: ModelService,
    private router: Router
  ) {
    this.setStart();
  }

  username: string = '';

  ngOnInit(): void {
    this.getUserName();
  }

  buildDate: string = environment.BuildDate;
  eventHubConnectionString: string = this.model.eventHubConnection;
  eventHubConsumerGroup: string = this.model.eventHubConsumerGroup;
  azureMapsSharedKey: string = this.model.azureMapsSharedKey;
  aoaiEndpoint: string = this.model.aoaiEndpoint;
  aoaiDeploymentId: string = this.model.aoaiDeploymentId;
  aoaiAccessKey: string = this.model.aoaiAccessKey;
  isDemoMode: boolean = this.model.demoMode;
  isStartDisabled: boolean = false;

  setDemo(completed: boolean) {
    this.isDemoMode = completed;

    this.setStart();
  }

  setStart(): void {
    this.isStartDisabled = true;

    if (this.isDemoMode) {
      this.isStartDisabled = false;
    }

    if (this.eventHubConnectionString != null && this.eventHubConnectionString.length > 0 && this.eventHubConsumerGroup != null && this.eventHubConsumerGroup.length > 0) {
      this.isStartDisabled = false;
    }

  }

  navigateNext(): void {
    if (!this.isStartDisabled) {
      this.model.eventHubConnection = this.eventHubConnectionString;
      this.model.eventHubConsumerGroup = this.eventHubConsumerGroup;
      this.model.azureMapsSharedKey = this.azureMapsSharedKey;
      this.model.aoaiEndpoint = this.aoaiEndpoint;
      this.model.aoaiDeploymentId = this.aoaiDeploymentId;
      this.model.aoaiAccessKey = this.aoaiAccessKey;
      this.model.demoMode = this.isDemoMode;
      this.model.save();

      this.router.navigateByUrl('/live')
    }

  }

  async getUserName(): Promise<void> {
    try {
      // Set default username in case of errors
      this.username = 'User';

      // Try to get username from Azure built-in auth endpoint
      //const response = await fetch('/.auth/me');
      const response = await fetch('/api/HelloWorld');

      if (!response.ok) {
        console.log('Authentication endpoint not available or returned error');
        return;
      }

      // parse resoinse body as JSO 
      var responseObject = await response.json();
      this.username = responseObject.clientPrincipal.userDetails;
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Keep default username
    }
  }
}
