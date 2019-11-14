import { Observable } from 'rxjs';

import { HttpRestClient, ObserveOptions, RestRequest } from '@elemental-concept/grappa';

export class CacheableClient implements HttpRestClient<any> {
  request(request: RestRequest, observe: ObserveOptions, defaultClient?: HttpRestClient<any>): Observable<any> {
    return defaultClient.request(request, observe);
  }
}
