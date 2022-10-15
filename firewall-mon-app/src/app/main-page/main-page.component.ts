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
      this.firewallSource.onRowSkipped = (skipped) => this.onRowSkipped(skipped);
  }
  
  private onDataSourceChanged(data: Array<FirewallDataRow>) {
    this.dataSource = new TableVirtualScrollDataSource(data); 
    this.dataSource.filterPredicate = (data: FirewallDataRow, filter: string) => {
      
        if (filter == null || filter.length == 0)
          return true;
    
        var words = filter.toLowerCase().split(" ");
        var foundWords:number = 0;
    
        for (var i = 0; i < words.length; i++) {
          var word = words[i];
          if (word.length > 0 && 
            data.time.toLowerCase().includes(word) || 
            data.category.toLowerCase().includes(word) || 
            data.protocol.toLowerCase().includes(word) || 
            data.sourceip.toLowerCase().includes(word) || 
            data.srcport.toLowerCase().includes(word) || 
            data.targetip.toLowerCase().includes(word) || 
            data.targetport.toLowerCase().includes(word) || 
            data.action.toLowerCase().includes(word))
          {
            foundWords++;
          }
          else
            return false;
        }
    
        return true;
    };
    this.dataSource.filter = this.filterText;
    this.totalRows = data.length;
    this.visibleRows = this.dataSource.filteredData.length;
  }

  private onRowSkipped(skipped: number) {
    this.skippedRows = skipped;
  }

  filterTextChanged(): void {
    this.dataSource.filter = this.filterText;
    this.dataSource.filteredData.length;
    this.visibleRows = this.dataSource.filteredData.length;
  }

  public displayedColumns = ['time', 'category', 'protocol','sourceip', 'srcport','targetip', 'targetport', 'action'];
  public dataSource: TableVirtualScrollDataSource<FirewallDataRow> = new TableVirtualScrollDataSource(new Array<FirewallDataRow>());
  public skippedRows: number = 0;
  public filterText: string = "";
  public totalRows: number = 0;
  public visibleRows: number = 0;

  ngOnInit(): void {
    this.firewallSource.connect();    
  }

}
