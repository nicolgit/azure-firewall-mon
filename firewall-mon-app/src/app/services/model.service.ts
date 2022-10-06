import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  constructor() { 
    this.demoMode = false;
    this.eventHubConnection = "";
    this.eventHubConsumerGroup = "$Default";
  }

  demoMode: boolean;
  eventHubConnection: string;
  eventHubConsumerGroup: string;
}

export interface IFirewallSource {
  connect(): void;
  disconnect(): void;
}