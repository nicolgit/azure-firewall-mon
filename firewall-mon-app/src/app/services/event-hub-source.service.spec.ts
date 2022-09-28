import { TestBed } from '@angular/core/testing';

import { EventHubSourceService } from './event-hub-source.service';

describe('EventHubSourceService', () => {
  let service: EventHubSourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventHubSourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
