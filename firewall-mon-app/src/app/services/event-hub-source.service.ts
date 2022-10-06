import { Injectable } from '@angular/core';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';

import { EventHubConsumerClient, earliestEventPosition } from "@azure/event-hubs";
//const { EventHubConsumerClient } = require("@azure/event-hubs");

@Injectable({
  providedIn: 'root'
})
export class EventHubSourceService implements IFirewallSource {

  constructor(private model:ModelService) { 
    //this.consumer = new EventHubConsumerClient(this.model.eventHubConnection, this.model.eventHubName);
  }

  private consumer: any;
  //private subscription: any;

  public async connect() {
    this.consumer = new EventHubConsumerClient(this.model.eventHubConsumerGroup, this.model.eventHubConnection);

    /*
    this.consumer = new EventHubConsumerClient(this.model.eventHubConnection, this.model.eventHubName);

    this.subscription = this.consumer.subscribe({
        processEvents: async (events, context) => {
          if (events.length === 0) {
            console.log(`No events received within wait time. Waiting for next interval`);
            return;
          }

          for (const event of events) {
            console.log(`Received event: '${event.body}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`);
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
        await this.subscription.close();
        await this.consumer.close();
        resolve();
      }, 30000);
    });
    */
}
 
onDataArrived?: (data: Array<FirewallDataRow>) => void;

public async disconnect() {
  //await this.consumer.close();
}
  
private DATA: Array<FirewallDataRow> = [];
}
