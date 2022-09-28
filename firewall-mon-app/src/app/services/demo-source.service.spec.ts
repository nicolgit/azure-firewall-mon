import { TestBed } from '@angular/core/testing';

import { DemoSourceService } from './demo-source.service';

describe('DemoSourceService', () => {
  let service: DemoSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemoSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
