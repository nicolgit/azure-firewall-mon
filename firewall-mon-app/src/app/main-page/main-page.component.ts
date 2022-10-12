import { Component, OnInit } from '@angular/core';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';
import { DemoSourceService } from '../services/demo-source.service';
import { EventHubSourceService } from '../services/event-hub-source.service';

import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { empty } from 'rxjs';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
  private model: ModelService;
  private firewallSource: IFirewallSource;

  constructor(
    private model_in: ModelService,
    private demoSource: DemoSourceService,
    private eventHubService: EventHubSourceService
    ) {
      this.model = model_in;
      this.firewallSource = this.model.demoMode ? this.demoSource : this.eventHubService;
      this.firewallSource.onDataArrived = (data) => this.onDataSourceChanged(data);
  }
  
  private onDataSourceChanged(data: Array<FirewallDataRow>) {
    this.dataSource = new TableVirtualScrollDataSource(data); 
  }

  public displayedColumns = ['time', 'category', 'protocol','sourceip', 'srcport','targetip', 'targetport', 'action'];
  public dataSource: TableVirtualScrollDataSource<FirewallDataRow> = new TableVirtualScrollDataSource(new Array<FirewallDataRow>());

  ngOnInit(): void {
    this.firewallSource.connect();    
  }

}
