import { Injectable } from '@angular/core';
import { filter } from 'rhea-promise';

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
  onRowSkipped?: (skipped: number) => void;
  onMessageArrived?: (message: string) => void;
  disconnect(): void;
  skippedRows: number;
}

export interface FirewallDataRow {  
  time: string;
  category: string;
  protocol: string;
  sourceip: string;
  srcport: string;
  targetip: string;
  targetport: string;
  action: string;
  dataRow: any;
};

// AzureFirewallDataRow

export interface AzureFirewallRecordProperties {
  msg: string;
}

export interface AzureFirewallRecord {
  category: string;
  time: Date;
  resourceId: string;
  operationName: string;
  properties: AzureFirewallRecordProperties;
}

export interface EventHubBody {
  records: AzureFirewallRecord[];
}


/// Sample data
/*
{
  "records": [{
          "category": "AzureFirewallNetworkRule",
          "time": "2022-10-12T16:47:05.7288580Z",
          "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
          "operationName": "AzureFirewallNetworkRuleLog",
          "properties": {
              "msg": "TCP request from 10.13.1.4:50712 to 10.13.2.4:3389. Action: Allow. "
          }
      }, {
          "category": "AzureFirewallNetworkRule",
          "time": "2022-10-12T16:47:05.7832180Z",
          "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
          "operationName": "AzureFirewallNetworkRuleLog",
          "properties": {
              "msg": "UDP request from 10.13.1.4:62674 to 10.13.2.4:3389. Action: Allow. "
          }
      }
  ]

  {
    "records": [{
            "category": "AzureFirewallNetworkRule",
            "time": "2022-10-18T10:19:05.9886250Z",
            "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
            "operationName": "AzureFirewallNatRuleLog",
            "properties": {
                "msg": "TCP request from 194.79.199.174:61563 to 20.31.19.13:3389 was DNAT'ed to 10.13.2.4:3389"
            }
        }
    ]
}
}


*/