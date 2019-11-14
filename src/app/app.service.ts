import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { GET, RestClient } from '@elemental-concept/grappa';
import { CacheResponse, Cacheable } from '@elemental-concept/grappa-cache';

@RestClient('http://localhost:8080')
@Cacheable()
@Injectable({ providedIn: 'root' })
export class AppService {
  @CacheResponse()
  @GET('/test')
  test: () => Observable<any>;
}
