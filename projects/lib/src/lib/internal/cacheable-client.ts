import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

import { iif, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, take, tap } from 'rxjs/operators';

import { OfflineMonitorService } from '@elemental-concept/offline-monitor';
import { HttpRestClient, ObserveOptions, RestRequest, UrlParser } from '@elemental-concept/grappa';

import { sha256 } from './sha256';
import { PersistenceManager } from '../public/persistence/persistence-manager';
import { LocalStorage } from '../public/persistence/local-storage';

export class CacheableClient implements HttpRestClient<any> {
  // TODO We should use Angular DI instead in the future
  private readonly offlineMonitor = new OfflineMonitorService();
  private readonly persistence: PersistenceManager = new LocalStorage();

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

  private static hashRequest(request: RestRequest) {
    const method = request.method.toUpperCase();
    const body = (method === 'POST' || method === 'PUT') && request.args.length > 0 ? request.args[ request.args.length - 1 ] : undefined;
    const baseUrl = typeof request.baseUrl === 'function' ? request.baseUrl() : request.baseUrl;

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

  request(request: RestRequest, observe: ObserveOptions, defaultClient?: HttpRestClient<any>): Observable<any> {
    return CacheableClient.hashRequest(request)
      .pipe(
        mergeMap(hash => this.offlineMonitor
          .state
          .pipe(
            take(1),
            map(online => [ hash, this.persistence.get(hash), online ]))),
        mergeMap(([ hash, cache, online ]: [ string, string, boolean ]) => iif(
          () => online,
          this.cacheResponse(hash, defaultClient.request(request, observe), observe)
            .pipe(catchError((e: HttpErrorResponse) => e.status === 0 ? CacheableClient.parseCache(cache) : throwError(e))),
          CacheableClient.parseCache(cache)))
      );
  }

  // TODO Remove
  private cachedRequest(request: RestRequest, observe: ObserveOptions, defaultClient?: HttpRestClient<any>): Observable<any> {
    return CacheableClient.hashRequest(request)
      .pipe(
        map(hash => [ hash, this.persistence.get(hash) ]),
        mergeMap(([ hash, cache ]) => iif(
          () => cache === null,
          this.cacheResponse(hash, defaultClient.request(request, observe), observe),
          CacheableClient.parseCache(cache)))
      );
  }

  private cacheResponse(hash: string, response: Observable<HttpResponse<any> | any>, observe: ObserveOptions) {
    return response.pipe(tap(res => this.persistence.put(hash, JSON.stringify(observe === ObserveOptions.Body ? res : res.body))));
  }
}
