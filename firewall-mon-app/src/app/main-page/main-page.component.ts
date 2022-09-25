import { Component, OnInit } from '@angular/core';
import { IngestDemoService } from '../ingest-demo.service';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {

  constructor(private ingestDemoService: IngestDemoService) {
  }

  DATA = Array.from({length: 100000}, (v, i) => ({
    id: i + 1,
    name: `Element #${i + 1}`
  }));

  displayedColumns = ['id', 'name'];
  dataSource = new TableVirtualScrollDataSource(this.DATA);

  ngOnInit(): void {
    this.ingestDemoService.Sample = true;
    setInterval(() => {         //replaced function() by ()=>
      
      this.DATA.splice(0,0,{ id:999, name: `Element ${Date.now()}` });
      this.dataSource = new TableVirtualScrollDataSource(this.DATA);

      console.log("ciao"); // just testing if it is working
    }, 1000);
  }

}
