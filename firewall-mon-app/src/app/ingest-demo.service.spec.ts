import { TestBed } from '@angular/core/testing';

import { IngestDemoService } from './ingest-demo.service';

describe('IngestDemoService', () => {
  let service: IngestDemoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IngestDemoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
