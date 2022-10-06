import { Time } from '@angular/common';
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
  onDataArrived?: (data: Array<FirewallDataRow>) => void;
  disconnect(): void;
}

export interface FirewallDataRow {
  time: string;
  protocol: string;
  sourceip: string;
  srcport: string;
  targetip: string;
  targetport: string;
  action: string;
  dataRow: any;
};