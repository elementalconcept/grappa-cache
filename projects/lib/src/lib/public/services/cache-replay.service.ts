import { Injectable } from '@angular/core';

import { defer, from, iif, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

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

  get cachePresent(): Observable<boolean> {
    return this.getCache()
      .pipe(
        map(cache => cache !== null && cache.length > 0));
  }

  replay = () => this.getCache()
    .pipe(
      mergeMap(cache => iif(
        () => cache === null,
        defer(() => of(0)),
        defer(() => this.client.replay(cache))
      )));

  getCache = (): Observable<RequestCacheRecord[] | null> =>
    from(Promise.resolve(this.persistence.get(RequestCacheKey)))
      .pipe(
        map(cache => {
          if (cache !== null) {
            try {
              return (JSON.parse(cache) as RequestCacheRecord[]);
            } finally {
            }
          }

          return null;
        }));

  replayCacheRecord = (record: RequestCacheRecord) => this.client.bypass(record);
}
