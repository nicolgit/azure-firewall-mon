import { Component, OnInit, HostListener, ElementRef, AfterViewInit, ViewChild } from '@angular/core';

import { IFirewallSource, FirewallDataRow, ModelService } from '../services/model.service';
import { DemoSourceService } from '../services/demo-source.service';
import { EventHubSourceService } from '../services/event-hub-source.service';
import { FlagData, FlagsService } from '../services/flags.service';

import { MatDialog} from '@angular/material/dialog';
import { MatSnackBar} from '@angular/material/snack-bar';

import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';
import { Router } from '@angular/router';
import { YesnoDialogComponent } from '../yesno-dialog/yesno-dialog.component';
import { LoggingService } from '../services/logging.service';
import { time } from 'console';
import { formatDate } from '@angular/common';


enum TimestampFormat { GMT, local};

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements AfterViewInit, OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  private firewallSource: IFirewallSource;

  ngAfterViewInit() {
    this.searchInput.nativeElement.focus();
  }

  constructor(
    private model: ModelService,
    private demoSource: DemoSourceService,
    private eventHubService: EventHubSourceService,
    private flagService: FlagsService,
    private router: Router,
    private logging: LoggingService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    ) {
      this.firewallSource = this.model.demoMode ? this.demoSource : this.eventHubService;
      this.firewallSource.onDataArrived = (data) => this.onDataSourceChanged(data);
      this.firewallSource.onRowSkipped = (skipped) => this.onRowSkipped(skipped);
      this.firewallSource.onMessageArrived = (message) => this.onMessageArrived(message);

      this.toggleExpandJsonSpace();
  }

  @HostListener('document:keypress', ['$event'])

  handleKeyboardEvent(event: KeyboardEvent) { 
    if (event.key === 'Enter') {
      this.advSearchVisibility = false;
       this.searchInput.nativeElement.blur();
    }

    // avoid handling keypress events when typing in input fields
    if (event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement || 
      event.target instanceof HTMLSelectElement) {
    return;
  }

    this.advSearchVisibility = !this.advSearchVisibility;

    if (this.advSearchVisibility) {
      this.searchInput.nativeElement.focus();  
    }
  }

  private onDataSourceChanged(data: Array<FirewallDataRow>) {
    this.dataSource = new TableVirtualScrollDataSource(data); 
    this.dataSource.filterPredicate = (data: FirewallDataRow, filter: string) => {
      
        try {
          if (this.timestampFilterMinutes > 0) {
            if (data.time == null || data.time.length == 0)
              return false;

            var now = new Date();
            var date = new Date(data.time);

            var diff = now.getTime() - date.getTime();
            var minutes = diff / 60000;
            if (minutes > this.timestampFilterMinutes)
              return false;
          }

          if (this.timestampFilterMinutes == -1) {
            var currentString =  formatDate(data.time, 'yyyy-MM-ddTHH:mm', 'en_US');
            if (currentString < this.timestampStartDateString || currentString > this.timestampEndDateString)
              return false;
          }

          if (filter == null || filter.length == 0)
            return true;

          var words = filter.toLowerCase().split(" ");
          var foundWords:number = 0;
      
          for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (word.length > 0 && 
              //data.time?.toLowerCase().includes(word) || 
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
    this.dataSource.filter = " " + this.filterText;; // not empty filter string forces filterPredicate to be called
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
    if (row == this.selectedRow)
    {
      this.selectedRow = null;
      this.selectedRowJson = null;
      this.panelOpenState = false;
      return;
    }
    this.selectedRow = row;
    this.panelOpenState = true;
    this.selectedRowJson = this.syntaxHighlight( JSON.stringify(row.dataRow, null, 2) );
    return;
  }

  // format a json string to be more readable with bold and colors
  prettyPrintJson(json: string): string {
    if (json == null || json.length == 0)
      return "";

    
    var result = json.replace(/{/g, '<b>{</b>').replace(/}/g, '<b>}</b>').replace(/:/g, '<b>:</b>').replace(/,/g, '<b>,</b>').replace(/"/g, '<b>"</b>');
    return result;
  }

  // https://stackoverflow.com/questions/4810841/pretty-print-json-using-javascript
  syntaxHighlight(json: string): string {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match: string) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

  filterTextChanged(): void {
    this.dataSource.filter = " " + this.filterText; // not empty filter string forces filterPredicate to be called
    this.dataSource.filteredData.length;
    this.visibleRows = this.dataSource.filteredData.length;
  }

  public displayedColumns = ['time', 'category', 'protocol','source','target', 'action', 'policy', 'targetUrl'];
  public dataSource: TableVirtualScrollDataSource<FirewallDataRow> = new TableVirtualScrollDataSource(new Array<FirewallDataRow>());
  public skippedRows: number = 0;
  public filterText: string = "";
  public totalRows: number = 0;
  public visibleRows: number = 0;
  public advSearchVisibility = false;
  public message: string = "";
  public selectedRow: FirewallDataRow|null = null;
  public selectedRowJson: string|null = null;
  public isPaused: boolean = false;
  public jsontextHeight: string = "";

  public panelOpenState = false;
  public timestampFormat: TimestampFormat = TimestampFormat.GMT;
  public timestampFilterMinutes: number = 0;
  public timestampStartDateString: String = formatDate(new Date(), 'yyyy-MM-ddTHH:mm', 'en_US');
  public timestampEndDateString: String = formatDate(new Date(), 'yyyy-MM-ddTHH:mm', 'en_US');
  

  public setActionBackground(action: string): string {
    
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

  public hasHighlightColor_old(text: string): string {
    if (text == null || text.length == 0)
      return "";

    var result = text.length != this.highlightSelection(text).length;
    return result ? "SeaShell" : "";
  }

  public hasHighlightColor(text: string, rowid: string): string {
    var result = false;

    if (text != null && text.length > 0)
    {
      result = text.length != this.highlightSelection(text).length;
    }

    if (rowid != null && rowid.length> 0)
    {
      if (rowid == this.selectedRow?.rowid)
        return "#faf5c8";
    }
    
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

  public isTimestampLocal() {
    return this.timestampFormat == TimestampFormat.local;
  }

  public isTimestampGMT() {
    return this.timestampFormat == TimestampFormat.GMT;
  }

  public setTimestampLocal() {
    this.timestampFormat = TimestampFormat.local;
  }
  
  public setTimeStampGMT() {
    this.timestampFormat = TimestampFormat.GMT;
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

  public copyJson() {
      navigator.clipboard.writeText( JSON.stringify(this.selectedRow, null, 2));
      this.snackBar.open("JSON copied successfully!","",{duration: 2000});
  }

  public toggleExpandJsonSpace() {
    const values = ["120px", "400px"];

    if (this.jsontextHeight == values[0])
      this.jsontextHeight = values[1];
    else
      this.jsontextHeight = values[0];
  }

  public showTimestamp(timestamp: string): string {
    if (timestamp == null || timestamp.length == 0)
      return "";

    var returnString = "";
    var date = new Date(timestamp);
    if (this.timestampFormat == TimestampFormat.GMT)
      returnString = timestamp;
    else
      returnString = date.toLocaleString() + " (Local)";
  
    if (this.timestampFilterMinutes != 0) {
      returnString = "<b>" + returnString + "</b>";
    }
    return returnString;
  }
} 
