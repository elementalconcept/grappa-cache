import { Injectable } from '@angular/core';

import { defer, iif, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

import { instances } from '../../internal/constants';
import { RequestCacheRecord } from '../../internal/request-cache-record';

@Injectable({ providedIn: 'root' })
export class CacheReplayService {
  // TODO We should use Angular DI instead in the future
  private readonly client = instances.cacheableClient;

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
        () => cache.length === 0,
        defer(() => of(0)),
        defer(() => this.client.replay(cache))
      )));

  getCache = (): Observable<RequestCacheRecord[]> => this.client.getRequestCache();

  replayCacheRecord = (record: RequestCacheRecord) => this.client.bypass(record);
}
