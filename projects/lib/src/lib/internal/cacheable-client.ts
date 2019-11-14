import { Observable, of } from 'rxjs';

import { HttpRestClient, ObserveOptions, RestRequest, UrlParser } from '@elemental-concept/grappa';
import { sha256 } from './sha256';
import { StorageKeyPrefix } from './constants';
import { map } from 'rxjs/operators';

export class CacheableClient implements HttpRestClient<any> {
  request(request: RestRequest, observe: ObserveOptions, defaultClient?: HttpRestClient<any>): Observable<any> {
    this.hashRequest(request).subscribe(console.log);
    return defaultClient.request(request, observe);
  }

  private hashRequest(request: RestRequest) {
    console.log(request);
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
