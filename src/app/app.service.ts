import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { GET, POST, RestClient } from '@elemental-concept/grappa';
import { Cacheable, CacheRequest, CacheResponse } from '@elemental-concept/grappa-cache';

@RestClient('http://localhost:8080')
@Cacheable()
@Injectable({ providedIn: 'root' })
export class AppService {
  @CacheResponse()
  @GET('/test')
  test: () => Observable<any>;

  @CacheRequest({ mockReply: 'ok' })
  @POST('/test/{0}')
  testWithParams: (id: string, value: any) => Observable<any>;
}
