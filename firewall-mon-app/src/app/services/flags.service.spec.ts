import { TestBed } from '@angular/core/testing';

import { FlagsService } from './flags.service';

describe('FlagsService', () => {
  let service: FlagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlagsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
