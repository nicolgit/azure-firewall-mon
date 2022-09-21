import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../shared.scss', './login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  eventHubConnectionString: string = "";
  eventHubAccessKey: string = "";
  isDemoMode: boolean = false;
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
}
