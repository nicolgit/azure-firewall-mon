import { Component, OnInit, Testability } from '@angular/core';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';
import { DemoSourceService } from '../services/demo-source.service';
import { EventHubSourceService } from '../services/event-hub-source.service';
import { FlagData, FlagsService } from '../services/flags.service';

import { MatDialog} from '@angular/material/dialog';

import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { empty } from 'rxjs';
import { Router } from '@angular/router';
import { YesnoDialogComponent } from '../yesno-dialog/yesno-dialog.component';
import { LoggingService } from '../services/logging.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
  private firewallSource: IFirewallSource;

  constructor(
    private model: ModelService,
    private demoSource: DemoSourceService,
    private eventHubService: EventHubSourceService,
    private flagService: FlagsService,
    private router: Router,
    private logging: LoggingService,
    public dialog: MatDialog
    ) {
      this.firewallSource = this.model.demoMode ? this.demoSource : this.eventHubService;
      this.firewallSource.onDataArrived = (data) => this.onDataSourceChanged(data);
      this.firewallSource.onRowSkipped = (skipped) => this.onRowSkipped(skipped);
      this.firewallSource.onMessageArrived = (message) => this.onMessageArrived(message);
  }
  
  private onDataSourceChanged(data: Array<FirewallDataRow>) {
    this.dataSource = new TableVirtualScrollDataSource(data); 
    this.dataSource.filterPredicate = (data: FirewallDataRow, filter: string) => {
      
        try {
          if (filter == null || filter.length == 0)
          return true;
    
        var words = filter.toLowerCase().split(" ");
        var foundWords:number = 0;
    
        for (var i = 0; i < words.length; i++) {
          var word = words[i];
          if (word.length > 0 && 
            data.time?.toLowerCase().includes(word) || 
            data.category?.toLowerCase().includes(word) || 
            data.protocol?.toLowerCase().includes(word) || 
            data.sourceip?.toLowerCase().includes(word) || 
            data.srcport?.toLowerCase().includes(word) || 
            data.targetip?.toLowerCase().includes(word) || 
            data.targetport?.toLowerCase().includes(word) || 
            data.policy?.toLowerCase().includes(word) ||
            data.moreInfo?.toLowerCase().includes(word) ||
            data.action?.toLowerCase().includes(word))
          {
            foundWords++;
          }
          else
            return false;
        }
    
        return true;
        } catch (error) {
          //console.log ("Error [" + error + "] in filterPredicate working on: " + data);
          return true;
        } 
    };
    this.dataSource.filter = this.filterText;
    this.totalRows = data.length;
    this.visibleRows = this.dataSource.filteredData.length;
  }

  private onRowSkipped(skipped: number) {
    this.skippedRows = skipped;
  }

  private onMessageArrived(message: string) {
    this.message = message;
  }

  public onRowClicked(row: FirewallDataRow) {
    this.selectedRow = row.dataRow;

    if (this.selectedRowJson === JSON.stringify(row.dataRow, null, 2)) {
      this.panelOpenState = ! this.panelOpenState;
    }
    else {
      this.panelOpenState = true;
    }

    this.selectedRowJson = JSON.stringify(row.dataRow, null, 2);
  }

  filterTextChanged(): void {
    this.dataSource.filter = this.filterText;
    this.dataSource.filteredData.length;
    this.visibleRows = this.dataSource.filteredData.length;
  }


  public displayedColumns = ['time', 'category', 'protocol','source','target', 'action', 'policy', 'targetUrl'];
  public dataSource: TableVirtualScrollDataSource<FirewallDataRow> = new TableVirtualScrollDataSource(new Array<FirewallDataRow>());
  public skippedRows: number = 0;
  public filterText: string = "";
  public totalRows: number = 0;
  public visibleRows: number = 0;
  public message: string = "";
  public selectedRow: FirewallDataRow|null = null;
  public selectedRowJson: string|null = null;
  public isPaused: boolean = false;

  public panelOpenState = false;

  public now(): string {
    return Date.now().toString();
  }

  public setActionBackground(action: string): string {
    if (this.hasHighlightColor(action) != '')
      return this.hasHighlightColor(action);

    if (this.safeCheckString(action,"Deny") || this.safeCheckString(action,"drop"))
      return '#ffe6f0';
    else if (this.safeCheckString(action,"Allow"))
      return '#e6fff7';
    else if (this.safeCheckString(action,"Request") || this.safeCheckString(action,"alert"))
      return '#e6faff';
    else
      return '';
  }

  public highlightSelection(text:string): string {
    if (text == null || text.length == 0) {
      return "";
    }

    if (this.filterText != null && this.filterText.length > 0 && text.length > 0) {
      const words = this.filterText.split(" ");
    
      words.forEach(word => {
        const position = text.toLowerCase().indexOf(word.toLowerCase());
        if (position >= 0 && word.length > 0) {
          text = text.substring(0, position) + "<b>" + text.substring(position, position + word.length) + "</b>" + text.substring(position + word.length);
        }      
      });
    }

    return text;
  }

  public hasHighlightColor(text: string): string {
    if (text == null || text.length == 0)
      return "";

    var result = text.length != this.highlightSelection(text).length;
    return result ? "SeaShell" : "";
  }

  // check if an IP is internal or external
  public isInternalIP(ip: string): boolean {
    if (ip == null || ip.length == 0)
      return false;
      
    var octets = ip.split(".");
    if (octets.length != 4)
      return false;

    var firstOctet = parseInt(octets[0]);
    if (firstOctet == 10)
      return true;
    else if (firstOctet == 172 && parseInt(octets[1]) >= 16 && parseInt(octets[1]) <= 31)
      return true;
    else if (firstOctet == 192 && parseInt(octets[1]) == 168)
      return true;
    else
      return false;
  }

  public isIP(ip: string): boolean {
    if (ip == null || ip.length == 0)
      return false;
      
    var octets = ip.split(".");
    if (octets.length != 4)
      return false;
    
    // check if all octets are numbers
    for (var i = 0; i < octets.length; i++) {
      var octet = parseInt(octets[i]);
      if (isNaN(octet))
        return false;
    }

    return true;
  }

  public isExternalIP(ip: string): boolean {
    if (ip == null || ip.length == 0)
      return false;
      
    var octets = ip.split(".");
    if (octets.length != 4)
      return false;
    
    return !this.isInternalIP(ip);
  }
  
  public getFlagFromIP(ip: string): FlagData | undefined{
    if (!this.isIP(ip))
      return undefined;

    if (this.isInternalIP(ip))
      return undefined;
    
    return this.flagService.getFlagFromIP(ip);
  }

  ngOnInit(): void {
    this.firewallSource.start();    
  }

  /// check if a string is equal to another string, ignoring case
  public safeCheckString(text:string, content:string): boolean {
    if (text == null || text.length == 0)
      return false;
    
    if (content == null || content.length == 0)
      return false;

    return content.toLowerCase() == text.toLowerCase();
  }

  public logout() {
    var dialogRef = this.dialog.open(YesnoDialogComponent, {
      data: {
        title: "Exit",
        description: "Are you sure you want to exit?"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result==true) {
        this.firewallSource.stop();
        this.router.navigate(['/']);
      }
    });
  }

  public clear() {
    var dialogRef = this.dialog.open(YesnoDialogComponent, {
      data: {
        title: "Clear all",
        description: "Are you sure you want to delete all firewall logs?"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result==true) {
        this.firewallSource.clear();
      }
    });
  }
  
  public pause() {
    this.isPaused = true;
    this.firewallSource.pause();
  }

  public resume() {
    this.isPaused = false;
    this.firewallSource.start();
  }
} 
