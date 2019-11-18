import { TestBed } from '@angular/core/testing';

import { CacheReplayService } from './cache-replay.service';

describe('CacheReplayService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CacheReplayService = TestBed.get(CacheReplayService);
    expect(service).toBeTruthy();
  });
});
