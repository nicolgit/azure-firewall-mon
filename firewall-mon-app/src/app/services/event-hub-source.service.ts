import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';

import { EventHubConsumerClient, earliestEventPosition } from "@azure/event-hubs";
//const { EventHubConsumerClient } = require("@azure/event-hubs");

@Injectable({
  providedIn: 'root'
})
export class EventHubSourceService implements IFirewallSource {
  private DATA: Array<FirewallDataRow> = [];

  constructor(private model:ModelService,
    private datePipe: DatePipe)  {
  }

  private consumerClient: EventHubConsumerClient | undefined;
  private subscription: any;

  onDataArrived?: (data: Array<FirewallDataRow>) => void;

  public async connect() {
    this.outputLog(`connecting consumerClient to azure event hub`);
    this.consumerClient = new EventHubConsumerClient(this.model.eventHubConsumerGroup, this.model.eventHubConnection);
    this.outputLog(`connected! getting partitionIds`);
    const partitionIds = await this.consumerClient.getPartitionIds();
    this.outputLog(`done! reading events from partitions: ${partitionIds.join(", ")}`);
    this.subscription = this.consumerClient.subscribe({
        processEvents: async (events, context) => {
          if (events.length === 0) {
            console.log(`No events received within wait time. Waiting for next interval`);
            return;
          }

          for (const event of events) {
            var row = {
              time: new Date().toLocaleString(),
              protocol: "-",
              sourceip: "-",
              srcport: "-",
              targetip: "-",
              targetport: "-",
              action: "-",
              dataRow: event.body
            } as FirewallDataRow;
            this.DATA.unshift(row);

            console.log(`Received event: '${JSON.stringify(event.body)}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`);
            this.onDataArrived?.(this.DATA);
          }
        },

        processError: async (err, context) => {
          console.log(`Error : ${err}`);
        }
      },
      { startPosition: earliestEventPosition }
    );

    // After 30 seconds, stop processing.
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        this.outputLog(`disconnecting consumerClient and subscription`);
        await this.subscription.close();
        await this.consumerClient?.close();
        resolve();
      }, 30000);
    });
  }

  public async disconnect() {
    await this.consumerClient?.close();
  }
    
  private outputLog(text: string): void {
    var date = new Date();
    console.log(`${this.datePipe.transform(date,'hh:mm:ss')} - EventHubSourceService - ${text}\n`);
  }
}
