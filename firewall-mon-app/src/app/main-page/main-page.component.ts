import { Component, OnInit } from '@angular/core';
import { IngestDemoService } from '../ingest-demo.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {

  constructor(private ingestDemoService: IngestDemoService) {
  }
    
  
  ngOnInit(): void {
    this.ingestDemoService.Sample = true;
  }
}
