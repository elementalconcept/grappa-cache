import { HttpErrorResponse } from '@angular/common/http';

import { iif, Observable, of, throwError } from 'rxjs';
import { catchError, mergeMap, take, tap } from 'rxjs/operators';

import { OfflineMonitorService } from '@elemental-concept/offline-monitor';
import { HttpRestClient, ObserveOptions, Registry, RestRequest, UrlParser } from '@elemental-concept/grappa';

import { sha256 } from './sha256';
import { PersistenceManager } from '../public/persistence/persistence-manager';
import { LocalStorage } from '../public/persistence/local-storage';
import { CustomMetadataKey } from './constants';
import { MethodOptions } from './method-options';

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
    const meta: MethodOptions = Registry.getCustomMetadataForDescriptor(
      request.classDescriptor,
      request.methodDescriptor,
      CustomMetadataKey);

    switch (meta.cacheMode) {
      case 'response':
        return this.runCachedResponse(request, observe, defaultClient);

      case 'replayRequest':
        return this.runCachedRequest(request, observe, defaultClient);

      default:
        return defaultClient.request(request, observe);
    }
  }

  private runCachedRequest = (request: RestRequest, observe: ObserveOptions, defaultClient: HttpRestClient<any>) => {
    return of(null);
  };

  private runCachedResponse = (request: RestRequest, observe: ObserveOptions, defaultClient: HttpRestClient<any>) =>
    this.offlineMonitor
      .state
      .pipe(
        take(1),
        mergeMap(online => iif(
          () => online,
          this.cacheResponse(request, observe, defaultClient),
          this.getCache(request))));

  private cacheResponse = (request: RestRequest, observe: ObserveOptions, defaultClient: HttpRestClient<any>) =>
    CacheableClient
      .hashRequest(request)
      .pipe(
        mergeMap(hash => defaultClient
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
