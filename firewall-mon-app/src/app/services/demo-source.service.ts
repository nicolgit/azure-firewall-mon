import { Injectable } from '@angular/core';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';

@Injectable({
  providedIn: 'root'
})
export class DemoSourceService implements IFirewallSource {
  
  constructor( private model:ModelService) { 
  }

  private intervalId: any;
  private protocolsArray: Array<string> = ["TCP", "UDP"];
  private actionsArray: Array<string> = ["ACCEPT", "DROP"];
  private portsArray: Array<string> = ["80", "443", "8080", "8443","22","21","23","25","53","110","143","389","443","445","993","995","1723","3306","3389","5900","8080","8443"];
  
  private DATA: Array<FirewallDataRow> = [];

  public onDataArrived?: (data: Array<FirewallDataRow>) => void;

  public async connect() {
    for (let i = 0; i < 10; i++) {
      var row = {
        time: new Date().toLocaleString(),
        protocol: this.protocolsArray[Math.floor(Math.random() * this.protocolsArray.length)],
        sourceip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
        srcport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
        targetip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
        targetport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
        action: this.actionsArray[Math.floor(Math.random() * this.actionsArray.length)]
      } as FirewallDataRow;
      this.DATA.push(row);
    }

    this.onDataArrived?.(this.DATA);

    this.intervalId = setInterval(() => {
      
      var row = {
        time: new Date().toLocaleString(),
        protocol: this.protocolsArray[Math.floor(Math.random() * this.protocolsArray.length)],
        sourceip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
        srcport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
        targetip: (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255)),
        targetport: this.portsArray[Math.floor(Math.random() * this.portsArray.length)],
        action: this.actionsArray[Math.floor(Math.random() * this.actionsArray.length)]
      } as FirewallDataRow;

      this.DATA.unshift(row);
      this.onDataArrived?.(this.DATA);

      console.log("DEMO Source heartbit");

    }, 1000);
  }

  public async disconnect() {
    clearInterval(this.intervalId);
  }
}
