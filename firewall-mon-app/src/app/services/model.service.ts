import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  constructor() { 
    this.demoMode = false;
    this.eventHubConnection = "";
    this.eventHubName = "";
  }

  demoMode: boolean;
  eventHubConnection: string;
  eventHubName: string;
}

export interface IFirewallSource {
  connect(): void;
  disconnect(): void;
}