import { Injectable } from '@angular/core';

import * as Model from '../services/model.service';
import { LoggingService } from './logging.service';

import { EventHubConsumerClient, earliestEventPosition, ReceivedEventData, SubscribeOptions } from "@azure/event-hubs";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventHubSourceService implements Model.IFirewallSource {
  private DATA: Array<Model.FirewallDataRow> = [];

  constructor(
    private logginService: LoggingService,
    private model:Model.ModelService
    )  {
  }

  private queueLength: number = 0;
  private defaultSleepTime: number = 1500;
  private consumerClient: EventHubConsumerClient | undefined;
  private subscription: any;
  private lastEvent: ReceivedEventData | undefined;

  public skippedRows: number = 0;
  public onDataArrived?: (data: Array<Model.FirewallDataRow>) => void;
  public onRowSkipped?: (skipped: number) => void;
  public onMessageArrived?: ((message: string) => void);

  public async start() {
    this.queueLength = await this.getQueueLenght();

    try {
      this.outputMessage(`connecting to azure event hub`);
      await new Promise(resolve => setTimeout(resolve, this.defaultSleepTime));
      this.consumerClient = new EventHubConsumerClient(this.model.eventHubConsumerGroup, this.model.eventHubConnection);
      
      this.outputMessage(`getting partitionIds`);
      await new Promise(resolve => setTimeout(resolve, this.defaultSleepTime));
      const partitionIds = await this.consumerClient.getPartitionIds();
      
      this.outputMessage(`reading events from partitions: ${partitionIds.join(", ")}`);
      await new Promise(resolve => setTimeout(resolve, this.defaultSleepTime));

      var subscribeOptions: SubscribeOptions = { startPosition: earliestEventPosition, maxBatchSize: 200 };
      if (this.lastEvent !== undefined && this.lastEvent !== null) {
        subscribeOptions.startPosition = { sequenceNumber: this.lastEvent.sequenceNumber };        
      }

      this.subscription = this.consumerClient.subscribe( 
        {
          processEvents: async (events, context) => {
            var moreRows:number = 0;

            if (events.length === 0) {
              console.log(`No events received within wait time. Waiting for next interval`);
              return;
            }
            
            for (const event of events) {
              var eventBody: Model.EventHubBody = event.body;

              // track event for malformed json
              if (eventBody.records == null) {
                this.logginService.logEvent(`UNABLE TO PARSE eventBODY (malformed json): ${eventBody.toString()}`); 
              }
              else {
                for (const record of eventBody.records) {
                  const resourceId:string = record.resourceId;

                  if (resourceId && resourceId.includes("/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/") == true) {
                    var row: Model.FirewallDataRow | undefined = undefined;

                    switch (record.category) {
                      case "AzureFirewallNetworkRule":
                      case "AzureFirewallApplicationRule":
                      case "AzureFirewallDnsProxy":    {
                        row = this.parseAzureFirewallRuleLegacy(record);
                        break;
                      }
                      // new format (structured logs)
                      case "AZFWDnsQuery":
                      case "AZFWApplicationRule":
                      case "AZFWNetworkRule":
                      case "AZFWNatRule":
                      case "AZFWIdpsSignature":
                      case "AZFWThreatIntel": 
                        row = this.parseAzureFirewallRule(record);
                        break;
                      default: {
                        row = {
                          rowid: this.getRowID(),
                          time: record.time.toString(),
                          category: "SKIPPED Category - " + record.category,
                          protocol: "-",
                          sourceip: "-",
                          srcport: "-",
                          targetip: "-",
                          targetport: "-",
                          action: "-",
                          dataRow: record
                        } as Model.FirewallDataRow;

                        this.skippedRows++;
                        this.onRowSkipped?.(this.skippedRows);
                        break;
                      }
                    }
                  }
                  else {
                    row = {
                      rowid: this.getRowID(),
                      time: record.time.toString(),
                      category: "SKIPPED Res Type - " + resourceId,
                    } as Model.FirewallDataRow;

                    this.skippedRows++;
                    this.onRowSkipped?.(this.skippedRows); 
                  }
                  moreRows++;
                  this.DATA.unshift(row);

                  while (this.DATA.length > this.queueLength) {
                    this.DATA.pop();
                  }
                }

                this.onDataArrived?.(this.DATA); 
              }
              const messageArrived = moreRows + " more events received as of " + new Date().toLocaleString();
              this.outputMessage(messageArrived);

            }

            // save last event for later resume
            this.lastEvent = events.pop();
            if (this.lastEvent !== undefined && this.lastEvent !== null) {
              context.updateCheckpoint(this.lastEvent);
            }

          },
          processError: async (err, context) => { 
            console.log(`${err}`);
            this.logginService.logException(err);
          }
        },
        subscribeOptions );

      /*
      // After 30 seconds, stop processing.
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          this.outputMessage(`disconnecting consumerClient and subscription`);
          await this.subscription.close();
          await this.consumerClient?.close();
          
          resolve();
        }, 30000);
      });
      */
    }
    catch (err: any) {
      this.logginService.logException(err.toString());
      this.outputMessage(err.toString());
      throw err;
    }    
  }

  public async pause() {
    await this.consumerClient?.close();
    this.logginService.logEvent(`paused connection with event hub`);
    this.outputMessage("Connection with event hub - Paused");
  }

  public async stop() {
    this.lastEvent = undefined;
    
    await this.consumerClient?.close();
    this.logginService.logEvent(`stopped connection with event hub`);
    this.outputMessage("Connection with event hub - Stopped");
  }

  public async clear() {
    this.DATA = [];
    this.onDataArrived?.(this.DATA);
    this.outputMessage("Logs successfully deleted!");
  }

  private async getQueueLenght(): Promise<number> {
    try {
      const response = await fetch('/api/settings/local_queuelength');
      
      if (!response.ok) {
        console.error('queue lenght API endpoint returned error:', response.status);
        return 10;
      }      
      
      // Parse the response as text and convert to number
      const text = await response.text();
      return Number(text);
    } catch (error) {
      console.error('Error fetching queue lenght endpoint:', error);
      return 10;
    }
  }

  private outputMessage (text:string): void {
    this.onMessageArrived?.(text);
  }

  private parseAzureFirewallRuleLegacy(record: Model.AzureFirewallRecord): Model.FirewallDataRow {
    var row: Model.FirewallDataRow;

    try {
      switch (record.operationName) {
        case "AzureFirewallNetworkRuleLog": {
          // OLD: UDP request from 10.13.1.4:62674 to 10.13.2.4:3389. Action: Allow.             
          // NEW: ICMP Type=8 request from 10.13.2.4:0 to 13.107.4.50:0. Action: Deny..

          const splitRequest = record.properties.msg.split(" request from ");
          const splitDetail = splitRequest[1].split(" ");
          
          const ipport1 = splitDetail[0].split(":");
          const ipport2 = splitDetail[2].split(":");

          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "NetworkRule (legacy)",
            protocol: splitRequest[0],
            sourceip: ipport1[0],
            srcport: ipport1[1],
            targetip: ipport2[0],
            targetport: ipport2[1].replace(".", ""),
            action: splitDetail[4].replace(".", "").replace(".", ""),
            dataRow: record
          } as Model.FirewallDataRow;    
          break; 
        }
        case "AzureFirewallNatRuleLog": {
          // TCP request from 194.79.199.174:61563 to 20.31.19.13:3389 was DNAT'ed to 10.13.2.4:3389
          const split = record.properties.msg.split(" ");
          const ipport1 = split[3].split(":");
          const ipport2 = split[5].split(":");

          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "NATRule (legacy)",
            protocol: split[0],
            sourceip: ipport1[0],
            srcport: ipport1[1],
            targetip: ipport2[0],
            targetport: ipport2[1],
            action: split[7],
            dataRow: record
          } as Model.FirewallDataRow;
          
          for (let i = 8; i < split.length; i++) {
            row.action += " " + split[i];
          }
          break; 
        }
        case "AzureFirewallApplicationRuleLog": {
          //"HTTPS request from 10.13.1.4:55611 to md-zz400hv4xnwl.z32.blob.storage.azure.net:443. Action: Deny. No rule matched. Proceeding with default action"
          //"HTTPS request from 10.13.1.4:55583 to winatp-gw-cus3.microsoft.com:443. Action: Deny. Policy: my-policy. Rule Collection Group: DefaultApplicationRuleCollectionGroup. Rule Collection: block-sites. Rule: block-microsoft"
          //"HTTP  request from 10.13.1.4:55202 to au.download.windowsupdate.com:80. Url: au.download.windowsupdate.com/c/msdownload/update/software/updt/2021/01/windows10.0-kb4589208-v2-x64_c7af21cdf923f050a3dc8e7924c0245ee651da56.cab. Action: Deny. No rule matched. Proceeding with default action"
    
          row = {} as Model.FirewallDataRow;
          
          const splitStops = record.properties.msg.split(". ");
          const splitSpaces = record.properties.msg.substring(6).split(" ");
          const ipport1 = splitSpaces[2].split(":");
          const ipport2 = splitSpaces[4].split(":");

          row.rowid = this.getRowID(),
          row.time = record.time.toString();
          row.category = "AppRule (legacy)";
          row.protocol = splitStops[0].split(" ")[0];
          row.policy ="";

          row.sourceip = ipport1[0];
          row.srcport = ipport1[1];
          row.targetip = ipport2[0];
          row.targetport = ipport2[1];
          row.dataRow = record;

          splitStops.forEach((sentence, index) => {
            var words = sentence.split(": ");
            switch (words[0]) {
              case "Action":{
                row.action = words[1];
                break;
              }
              case "Policy": {
                break;
              }
              case "Rule Collection Group":
              case "Rule Collection": 
              case "Rule": {
                row.policy += ">" + words[1];
                break;
              }
              case "Url": {
                row.moreInfo = words[1];
                break;
              }
              case "No rule matched. Proceeding with default action": {
                row.policy = "N/A";
                break;
              }
            }           
          });

          if (row.policy.startsWith(">")) {
            row.policy = row.policy.substring(1);
          }

          break; 
        }
        case "AzureFirewallDnsProxyLog": {
          //  "DNS Request: 10.12.3.5:7943 - 8951 AAAA IN tsfe.trafficshaping.dsp.mp.microsoft.com. udp 58 false 512 NOERROR qr,rd,ra 135 0.004987569s"
          //     " Error: 2 time.windows.com.reddog.microsoft.com. A: read udp 10.0.1.5:49126->168.63.129.160:53: i/o timeout”

          const split = record.properties.msg.split(" ");

          row = {} as Model.FirewallDataRow;
          row.rowid = this.getRowID(),
          row.time = record.time.toString();
          row.category = "DnsProxy (legacy)";
          row.action = split[1].replace(":", "");
          row.sourceip = split[2].split(":")[0];
          row.srcport = split[2].split(":")[1];
          row.protocol = split[8];        
          row.moreInfo = split[5] + " " + split[6] + " " + split[7];
          
          row.dataRow = record;

          break;
        }
        default: {
          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "SKIPPED - UNMANAGED Operation Name: " + record.category,
            protocol: "-",
            sourceip: "-",
            srcport: "-",
            targetip: "-",
            targetport: "-",
            action: "-",
            dataRow: record
          } as Model.FirewallDataRow;

          this.skippedRows++;
          this.onRowSkipped?.(this.skippedRows);
          break; 
        }
      }

    }  catch (err: any) {
        this.logginService.logEvent(`parseAzureFirewallRuleLegacy: ERROR in parsing AzureFirewallRule: ${err.toString()} - ${record}`);
        
        row = {
          rowid: this.getRowID(),
          time: record.time.toString(),
          category: "SKIPPED - ERROR parsing message",
          protocol: "-",
          sourceip: "-",
          srcport: "-",
          targetip: "-",
          targetport: "-",
          action: "-",
          dataRow: record
        } as Model.FirewallDataRow;
    }

    return row;
  }

  private parseAzureFirewallRule(record: Model.AzureFirewallRecord): Model.FirewallDataRow {
    var row: Model.FirewallDataRow;

    try {
      switch (record.category) {
        case "AZFWDnsQuery": {
          /* SAMPLE
          {
            "category": "AZFWDnsQuery",
            "time": "2023-09-06T14:33:46.8119710Z",
            "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
            "properties": {
              "SourceIp": "10.12.3.6",
              "SourcePort": 17312,
              "QueryId": 10433,
              "QueryType": "A",
              "QueryClass": "IN",
              "QueryName": "winatp-gw-cus3.microsoft.com.",
              "Protocol": "udp",
              "RequestSize": 46,
              "DnssecOkBit": false,
              "EDNS0BufferSize": 512,
              "ResponseCode": "NOERROR",
              "ResponseFlags": "qr,rd,ra",
              "ResponseSize": 308,
              "RequestDurationSecs": 0.005563465,
              "ErrorNumber": 0,
              "ErrorMessage": ""
            }
          }     
          */
          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "AzDnsQuery",
            protocol: record.properties.Protocol?.toString(),
            sourceip: record.properties.SourceIp?.toString(),
            srcport: record.properties.SourcePort?.toString(),
            targetip: "",
            targetport: "",
            action: "Request",
            policy: "",
            moreInfo: record.properties.QueryId?.toString() + 
            " " + record.properties.QueryType?.toString() + 
            " " + record.properties.QueryClass?.toString() + 
            " " + record.properties.QueryName?.toString() + 
            " " + record.properties.ResponseFlags?.toString() + 
            " " + record.properties.ResponseCode?.toString() + 
            " " + record.properties.ErrorNumber?.toString() +
            " " + record.properties.ErrorMessage?.toString(),
            dataRow: record
          } as Model.FirewallDataRow; 
          break; 
        }
        case "AZFWApplicationRule": {
          /* SAMPLE
          {
            "category": "AZFWApplicationRule",
            "time": "2023-09-06T14:33:46.8121070Z",
            "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
            "properties": {
              "Protocol": "HTTPS",
              "SourceIp": "10.13.2.4",
              "SourcePort": 50975,
              "DestinationPort": 443,
              "Fqdn": "winatp-gw-cus3.microsoft.com",
              "TargetUrl": "",
              "Action": "Allow",
              "Policy": "my-firewall-policy",
              "RuleCollectionGroup": "DefaultApplicationRuleCollectionGroup",
              "RuleCollection": "internet-out-collection",
              "Rule": "allow-internet-traffic-out",
              "ActionReason": "",
              "IsTlsInspected": false,
              "WebCategory": "",
              "IsExplicitProxyRequest": false
            }
          }
          */
          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "ApplicationRule",
            protocol: record.properties.Protocol?.toString(),
            sourceip: record.properties.SourceIp?.toString(),
            srcport: record.properties.SourcePort?.toString(),
            targetip: record.properties.Fqdn?.toString(),
            targetport: record.properties.DestinationPort?.toString(),
            action: record.properties.Action?.toString(),
            policy: record.properties.Policy?.toString() + " " +
                    record.properties.RuleCollectionGroup?.toString() + "»" + 
                    record.properties.RuleCollection?.toString() + "»" + 
                    record.properties.Rule?.toString(),
            moreInfo:
                    "target:"+ record.properties.TargetUrl?.toString() +
                    " WebCategory:" + record.properties.WebCategory?.toString(),
                    
            
            dataRow: record
          } as Model.FirewallDataRow;
          break;
        } 
        case "AZFWNetworkRule": {
          /* SAMPLE
          {
            "category": "AZFWNetworkRule",
            "time": "2023-09-06T14:22:44.9546030Z",
            "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
            "properties": {
              "Protocol": "UDP",
              "SourceIp": "10.13.1.4",
              "SourcePort": 52555,
              "DestinationIp": "23.72.254.146",
              "DestinationPort": 443,
              "Action": "Deny",
              "Policy": "",
              "RuleCollectionGroup": "",
              "RuleCollection": "",
              "Rule": "",
              "ActionReason": "Default Action"
            }
          }
          */
          var fullPolicy;

          if (record.properties.RuleCollectionGroup?.toString() != "") {
            fullPolicy = 
              record.properties.Policy?.toString() + "»" +
              record.properties.RuleCollectionGroup?.toString() + "»" + 
              record.properties.RuleCollection?.toString() + "»" + 
              record.properties.Rule?.toString();
          }
          else {
            fullPolicy = record.properties.ActionReason?.toString();
          }

          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "NetworkRule",
            protocol: record.properties.Protocol?.toString(),
            sourceip: record.properties.SourceIp?.toString(),
            srcport: record.properties.SourcePort?.toString(),
            targetip: record.properties.DestinationIp?.toString(),
            targetport: record.properties.DestinationPort?.toString(),
            action: record.properties.Action?.toString(),
            policy: fullPolicy,
            moreInfo: "",
          
            dataRow: record
          } as Model.FirewallDataRow;
          break;
        }
        case "AZFWNatRule": {
          var fullPolicy;

          if (record.properties.RuleCollectionGroup?.toString() != "") {
            fullPolicy = 
              record.properties.Policy?.toString() + "»" +
              record.properties.RuleCollectionGroup?.toString() + "»" + 
              record.properties.RuleCollection?.toString() + "»" + 
              record.properties.Rule?.toString();
          }
          else {
            fullPolicy = record.properties.ActionReason?.toString();
          }

          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "NATRule",
            protocol: record.properties.Protocol?.toString(),
            sourceip: record.properties.SourceIp?.toString(),
            srcport: record.properties.SourcePort?.toString(),
            targetip: record.properties.TranslatedIp?.toString(),
            targetport: record.properties.TranslatedPort?.toString(),
            policy: fullPolicy,
            moreInfo: "",
          
            dataRow: record
          } as Model.FirewallDataRow;
          break;
        }
        case "AZFWIdpsSignature": {
          /* SAMPLE
          {
            "category": "AZFWIdpsSignature",
            "time": "2023-09-06T14:04:01.7660350Z",
            "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
            "properties": {
              "Protocol": "TCP",
              "SourceIp": "10.12.3.6",
              "SourcePort": 44592,
              "DestinationIp": "104.21.49.135",
              "DestinationPort": 80,
              "Action": "alert",
              "SignatureId": "2008989",
              "Category": "Attempted Information Leak",
              "Description": "POLICY IP Check Domain (showmyip in HTTP Host)",
              "Severity": 2
            }
          }
          */
          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "IdpsSignature",
            protocol: record.properties.Protocol?.toString(),
            sourceip: record.properties.SourceIp?.toString(),
            srcport: record.properties.SourcePort?.toString(),
            targetip: record.properties.DestinationIp?.toString(),
            targetport: record.properties.DestinationPort?.toString(),
            action: record.properties.Action?.toString(),
            moreInfo: "SEV:" + record.properties.Severity?.toString() + 
                      " " + record.properties.SignatureId?.toString() + 
                      " " + record.properties.Category?.toString() + 
                      " " + record.properties.Description?.toString(),

            dataRow: record
          } as Model.FirewallDataRow;

          break;
          }
          case "AZFWThreatIntel": {
          /* SAMPLE
          {
            "category": "AZFWThreatIntel",
            "time": "2023-09-06T14:41:59.4005840Z",
            "resourceId": "/SUBSCRIPTIONS/0DE6ABDE-B801-4CB3-AABE-4082A63C0A4D/RESOURCEGROUPS/HUB-AND-SPOKE-PLAYGROUND/PROVIDERS/MICROSOFT.NETWORK/AZUREFIREWALLS/LAB-FIREWALL",
            "properties": {
              "Protocol": "HTTP",
              "SourceIp": "10.13.1.4",
              "SourcePort": 51674,
              "DestinationIp": "",
              "DestinationPort": 80,
              "Fqdn": "testmaliciousdomain.eastus.cloudapp.azure.com",
              "TargetUrl": "",
              "Action": "Alert",
              "ThreatDescription": "This is a test indicator for a Microsoft owned domain.",
              "IsTlsInspected": "false"
            }
          }
          */
          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "ThreatIntel",
            protocol: record.properties.Protocol?.toString(),
            sourceip: record.properties.SourceIp?.toString(),
            srcport: record.properties.SourcePort?.toString(),
            targetip: record.properties.Fqdn?.toString(),
            targetport: record.properties.DestinationPort?.toString(),
            action: record.properties.Action?.toString(),
            moreInfo: record.properties.ThreatDescription?.toString(),

            dataRow: record
          } as Model.FirewallDataRow;

          break;
          }
        
        default: {
          row = {
            rowid: this.getRowID(),
            time: record.time.toString(),
            category: "SKIPPED - UNMANAGED Category Name: " + record.category,
            protocol: "-",
            sourceip: "-",
            srcport: "-",
            targetip: "-",
            targetport: "-",
            action: "-",
            dataRow: record
          } as Model.FirewallDataRow;

          this.skippedRows++;
          this.onRowSkipped?.(this.skippedRows);
          break; 
        }
      }

    }  catch (err: any) {
        this.logginService.logEvent(`parseAzureFirewallRuleLegacy: ERROR in parsing AzureFirewallRule: ${err.toString()} - ${record}`);
        
        row = {
          rowid: this.getRowID(),
          time: record.time.toString(),
          category: "SKIPPED - ERROR parsing message",
          protocol: "-",
          sourceip: "-",
          srcport: "-",
          targetip: "-",
          targetport: "-",
          action: "-",
          dataRow: record
        } as Model.FirewallDataRow;
    }

    return row;
  }

  private lastRowID: number = 0;
  private getRowID(): string {
    this.lastRowID++;
    return this.lastRowID.toString();
  }
}
