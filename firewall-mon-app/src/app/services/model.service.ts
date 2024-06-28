import { Injectable } from '@angular/core';
import { filter } from 'rhea-promise';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  constructor(encryptionSvc: EncryptionService) { 
    this.encryptionSvc = encryptionSvc;
    this.demoMode = false;
    this.eventHubConnection = "";
    this.eventHubConsumerGroup = "$Default";
    this.azureMapsSharedKey = "";

    this.aoaiEndpoint="";
    this.aoaiDeploymentId="";
    this.aoaiAccessKey="";

    this.load();
  }
  private encryptionSvc: EncryptionService; 
  public demoMode: boolean;
  public eventHubConnection: string;
  public eventHubConsumerGroup: string;
  public azureMapsSharedKey: string;
  public aoaiEndpoint: string;
  public aoaiDeploymentId: string;
  public aoaiAccessKey: string;

  public async load(): Promise<void> {
    var _demoMode = localStorage.getItem("demoMode");
    if (_demoMode != null) {
      this.demoMode = JSON.parse(_demoMode);
    }

    var _eventHubConnection = localStorage.getItem("eventHubConnection");
    if (_eventHubConnection != null) {
      this.eventHubConnection = this.encryptionSvc.decrypt(_eventHubConnection);
    }

    var _eventHubConsumerGroup = localStorage.getItem("eventHubConsumerGroup");
    if (_eventHubConsumerGroup != null) {
      this.eventHubConsumerGroup = _eventHubConsumerGroup;
    }

    var _azureMapsSharedKey = localStorage.getItem("azureMapsSharedKey");
    if (_azureMapsSharedKey != null) {
      this.azureMapsSharedKey = _azureMapsSharedKey;
    }

    var _aoaiEndpoint = localStorage.getItem("aoaiEndpoint");
    if (_aoaiEndpoint != null) {
      this.aoaiEndpoint = _aoaiEndpoint;
    }

    var _aoaiDeploymentId = localStorage.getItem("aoaiDeploymentId");
    if (_aoaiDeploymentId != null) {
      this.aoaiDeploymentId = _aoaiDeploymentId;
    }

    var _aoaiAccessKey = localStorage.getItem("aoaiAccessKey");
    if (_aoaiAccessKey != null) {
      this.aoaiAccessKey = this.encryptionSvc.decrypt(_aoaiAccessKey);
    }
  }

  public async save(): Promise<void> {
    localStorage.setItem("demoMode", this.demoMode.toString());
    localStorage.setItem("eventHubConnection", this.encryptionSvc.encrypt(this.eventHubConnection));
    localStorage.setItem("eventHubConsumerGroup", this.eventHubConsumerGroup);
    localStorage.setItem("azureMapsSharedKey", this.azureMapsSharedKey);
    localStorage.setItem("aoaiEndpoint", this.aoaiEndpoint);
    localStorage.setItem("aoaiDeploymentId", this.aoaiDeploymentId);
    localStorage.setItem("aoaiAccessKey", this.encryptionSvc.encrypt(this.aoaiAccessKey));
  }  
}

export interface IFirewallSource {
  start(): void;
  pause(): void;
  stop(): void;
  onDataArrived?: (data: Array<FirewallDataRow>) => void;
  onRowSkipped?: (skipped: number) => void;
  onMessageArrived?: (message: string) => void;
  clear(): void;
  skippedRows: number;
}

export interface FirewallDataRow {  
  rowid: string;

  time: string;
  category: string;
  protocol: string;
  sourceip: string;
  srcport: string;
  targetip: string;
  targetport: string;
  moreInfo: string;
  action: string;
  policy: string;
  dataRow: any;
};

// AzureFirewallDataRow

export interface AzureFirewallRecordProperties {
  msg: string;

  // Azure firewall Structured log
  SourceIp?: string;
  SourcePort?: string;
  QueryId?: string;
  QueryType?: string;
  QueryClass?: string;
  QueryName?: string;
  Protocol?: string;
  RequestSize?: string;
  DnssecOkBit?: string;
  EDNS0BufferSize?: string;
  ResponseCode?: string;
  ResponseFlags?: string;
  ResponseSize?: string;
  RequestDurationSecs?: string;
  ErrorNumber?: string;
  ErrorMessage?: string;

  Fqdn?: string;
  DestinationPort?: string;
  Action?: string;
  RuleCollectionGroup?: string;
  RuleCollection?: string;
  Rule?: string;
  TargetUrl?: string;
  WebCategory?: string;

  DestinationIp?: string;
  Policy?: string;
  ActionReason?: string;

  TranslatedIp?: string;
  TranslatedPort?: string;

  Severity?: string;
  SignatureId?: string;
  Category?: string;
  Description?: string;

  ThreatDescription?: string;
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

{
    "category": "AzureFirewallApplicationRule",
    "time": "2022-10-18T17:11:04.8852020Z",
    "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
    "operationName": "AzureFirewallApplicationRuleLog",
    "properties": {
        "msg": "HTTPS request from 10.13.1.4:55611 to md-zz400hv4xnwl.z32.blob.storage.azure.net:443. Action: Deny. No rule matched. Proceeding with default action"
    }
}, 
{
    "category": "AzureFirewallApplicationRule",
    "time": "2022-10-18T17:09:46.9543860Z",
    "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
    "operationName": "AzureFirewallApplicationRuleLog",
    "properties": {
        "msg": "HTTPS request from 10.13.1.4:55583 to winatp-gw-cus3.microsoft.com:443. Action: Deny. Policy: my-policy. Rule Collection Group: DefaultApplicationRuleCollectionGroup. Rule Collection: block-sites. Rule: block-microsoft"
    }
}


*/