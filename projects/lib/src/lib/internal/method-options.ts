export type MethodOptions = CacheResponseOptions | CacheRequestOptions;

export interface CacheResponseOptions {
  cacheMode: 'response';
}

export interface CacheRequestOptions {
  cacheMode: 'replayRequest';
  replyWith: any;
}
