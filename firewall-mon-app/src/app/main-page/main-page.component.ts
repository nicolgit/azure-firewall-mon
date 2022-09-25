import { Component, OnInit } from '@angular/core';
import { IngestDemoService } from '../ingest-demo.service';
import { TableVirtualScrollDataSource } from 'ng-table-virtual-scroll';


const DATA = Array.from({length: 100000}, (v, i) => ({
  id: i + 1,
  name: `Element #${i + 1}`
}));

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {

  constructor(private ingestDemoService: IngestDemoService) {
  }
  
  displayedColumns = ['id', 'name'];
  dataSource = new TableVirtualScrollDataSource(DATA);

  ngOnInit(): void {
    this.ingestDemoService.Sample = true;
  }

}
