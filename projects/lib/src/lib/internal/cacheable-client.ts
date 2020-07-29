import { HttpErrorResponse } from '@angular/common/http';

import { from, iif, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, reduce, take, tap } from 'rxjs/operators';

import { OfflineMonitorService } from '@elemental-concept/offline-monitor';
import { HttpRestClient, ObserveOptions, Registry, RestRequest, UrlParser } from '@elemental-concept/grappa';

import { sha256 } from './sha256';
import { PersistenceManager } from '../public/persistence/persistence-manager';
import { CustomMetadataKey, RequestCacheKey } from './constants';
import { MethodOptions } from './method-options';
import { RequestCacheRecord } from './request-cache-record';

export class CacheableClient implements HttpRestClient<any> {
  // TODO We should use Angular DI instead in the future
  private readonly offlineMonitor = new OfflineMonitorService();

  constructor(private readonly persistence: PersistenceManager) {
  }

  private static parseCache(cache: string | null) {
    if (cache === null) {
      return CacheableClient.cacheError();
    }

    try {
      return of(JSON.parse(cache));
    } catch (e) {
      return CacheableClient.cacheError();
    }
  }

  private static cacheError() {
    return throwError(new HttpErrorResponse({
      status: 0,
      statusText: 'Cache is unavailable'
    }));
  }

  // TODO That should be handled by main library
  private static getBaseUrl(request: RestRequest) {
    return typeof request.baseUrl === 'function' ? request.baseUrl() : request.baseUrl;
  }

  private static hashRequest(request: RestRequest) {
    const method = request.method.toUpperCase();
    const body = (method === 'POST' || method === 'PUT') && request.args.length > 0 ? request.args[ request.args.length - 1 ] : undefined;
    const baseUrl = CacheableClient.getBaseUrl(request);

    const key = request.method.toUpperCase()
      + '::'
      + UrlParser.parse(baseUrl, request.endpoint, request.args)
      + '::'
      + JSON.stringify(request.params)
      // TODO Should be optional
      + '::'
      + JSON.stringify(request.headers)
      // TODO Should be optional
      + '::'
      + JSON.stringify(body);

    return sha256(key);
  }

  private static cacheToRequest(cache: RequestCacheRecord): RestRequest {
    return {
      baseUrl: cache.baseUrl,
      endpoint: cache.endpoint,
      method: cache.method,
      headers: cache.headers,
      params: cache.params,
      args: cache.args
    } as RestRequest;
  }

  private static requestToCache(request: RestRequest, observe: ObserveOptions): RequestCacheRecord {
    return {
      baseUrl: CacheableClient.getBaseUrl(request),
      endpoint: request.endpoint,
      method: request.method,
      observe,
      headers: request.headers,
      params: request.params,
      args: request.args,
      processed: false
    } as RequestCacheRecord;
  }

  replay = (cache: RequestCacheRecord[]): Observable<any> =>
    this.offlineMonitor
      .state
      .pipe(
        take(1),
        mergeMap(online => iif(
          () => online,
          from(cache)
            .pipe(
              mergeMap(record => this.bypass(record)
                .pipe(
                  map(() => ({ ...record, processed: true } as RequestCacheRecord)),
                  catchError(() => of(record)))),
              reduce<RequestCacheRecord>((acc, r) => acc.concat(r), [] as RequestCacheRecord[]),
              map(records => records.filter(record => !record.processed)),
              tap(records => this.persistence.put(RequestCacheKey, JSON.stringify(records))),
              map(records => cache.length - records.length)
            ),
          of(0)
        )));

  bypass = (record: RequestCacheRecord): Observable<any> =>
    Registry.defaultClient.request(CacheableClient.cacheToRequest(record), record.observe);

  request(request: RestRequest, observe: ObserveOptions): Observable<any> {
    const meta: MethodOptions = Registry.getCustomMetadataForDescriptor(
      request.classDescriptor,
      request.methodDescriptor,
      CustomMetadataKey);

    if (meta === null) {
      return Registry.defaultClient.request(request, observe);
    }

    switch (meta.cacheMode) {
      case 'response':
        return this.runCachedResponse(request, observe);

      case 'replayRequest':
        return this.runCachedRequest(request, observe, meta.replyWith);

      default:
        return Registry.defaultClient.request(request, observe);
    }
  }

  private runCachedRequest = (request: RestRequest, observe: ObserveOptions, replyWith: any) => {
    return this.offlineMonitor
      .state
      .pipe(
        take(1),
        mergeMap(online => iif(
          () => online,
          Registry.defaultClient
            .request(request, observe)
            .pipe(catchError((e: HttpErrorResponse) => e.status === 0 ? this.saveRequest(request, observe, replyWith) : throwError(e))),
          this.saveRequest(request, observe, replyWith))));
  };

  private saveRequest = (request: RestRequest, observe: ObserveOptions, replyWith: any) =>
    of(replyWith)
      .pipe(tap(() => {
        const storedValue = this.persistence.get(RequestCacheKey);
        const records: RequestCacheRecord[] = storedValue === null ? [] : JSON.parse(storedValue);

        records.push(CacheableClient.requestToCache(request, observe));

        this.persistence.put(RequestCacheKey, JSON.stringify(records));
      }));

  private runCachedResponse = (request: RestRequest, observe: ObserveOptions) =>
    this.offlineMonitor
      .state
      .pipe(
        take(1),
        mergeMap(online => iif(
          () => online,
          this.cacheResponse(request, observe),
          this.getCache(request))));

  private cacheResponse = (request: RestRequest, observe: ObserveOptions) =>
    CacheableClient
      .hashRequest(request)
      .pipe(
        mergeMap(hash => Registry.defaultClient
          .request(request, observe)
          .pipe(
            tap(res => this.persistence.put(hash, JSON.stringify(observe === ObserveOptions.Body ? res : res.body))),
            catchError((e: HttpErrorResponse) => e.status === 0 ? this.getCache(request) : throwError(e)))));

  private getCache = (request: RestRequest) =>
    CacheableClient
      .hashRequest(request)
      .pipe(
        mergeMap(hash => CacheableClient.parseCache(this.persistence.get(hash))));
}
