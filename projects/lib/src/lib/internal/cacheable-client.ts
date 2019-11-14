import { HttpResponse } from '@angular/common/http';

import { iif, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

import { HttpRestClient, ObserveOptions, RestRequest, UrlParser } from '@elemental-concept/grappa';

import { sha256 } from './sha256';
import { PersistenceManager } from '../public/persistence/persistence-manager';
import { LocalStorage } from '../public/persistence/local-storage';

export class CacheableClient implements HttpRestClient<any> {
  private readonly persistence: PersistenceManager = new LocalStorage();

  request(request: RestRequest, observe: ObserveOptions, defaultClient?: HttpRestClient<any>): Observable<any> {
    return this.hashRequest(request)
      .pipe(
        map(hash => [ hash, this.persistence.get(hash) ]),
        mergeMap(([ hash, cache ]) => iif(
          () => cache === null,
          this.cacheResponse(hash, defaultClient.request(request, observe), observe),
          this.parseCache(cache)))
      );
  }

  private cacheResponse(hash: string, response: Observable<HttpResponse<any> | any>, observe: ObserveOptions) {
    return response.pipe(tap(res => this.persistence.put(hash, JSON.stringify(observe === ObserveOptions.Body ? res : res.body))));
  }

  private parseCache(cache: string) {
    return of(JSON.parse(cache));
  }

  private hashRequest(request: RestRequest) {
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
    // return of(key);
  }
}