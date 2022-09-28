import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  constructor() { 
    this.demoMode = false;
    this.eventHubConnection = "";
    this.eventHubKey = "";
  }

  demoMode: boolean;
  eventHubConnection: string;
  eventHubKey: string;
}
