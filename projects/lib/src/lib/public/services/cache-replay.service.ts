import { Injectable } from '@angular/core';

import { of } from 'rxjs';

import { PersistenceManager } from '../persistence/persistence-manager';
import { LocalStorage } from '../persistence/local-storage';
import { RequestCacheKey } from '../../internal/constants';
import { RequestCacheRecord } from '../../internal/request-cache-record';
import { CacheableClient } from '../../internal/cacheable-client';

@Injectable({ providedIn: 'root' })
export class CacheReplayService {
  // TODO We should use Angular DI instead in the future
  private readonly persistence: PersistenceManager = new LocalStorage();
  private readonly client = new CacheableClient();

  constructor() {
  }

  get cachePresent(): boolean {
    const cache = this.getCache();
    return cache !== null && cache.length > 0;
  }

  replay = () => {
    const cache = this.getCache();

    if (cache === null) {
      return of(0);
    }

    return this.client.replay(cache);
  };

  getCache = (): RequestCacheRecord[] | null => {
    const cache = this.persistence.get(RequestCacheKey);

    if (cache !== null) {
      try {
        return (JSON.parse(cache) as RequestCacheRecord[]);
      } finally {
      }
    }

    return null;
  };

  replayCacheRecord = (record: RequestCacheRecord) => this.client.bypass(record);
}
