import { CacheableClient } from './cacheable-client';

export const StorageKeyPrefix = '@elemental-concept/grappa-cache/';
export const RequestCacheKey = 'requests';

export const CustomMetadataKey = '@elemental-concept/grappa-cache';

export const instances: { cacheableClient: CacheableClient | null } = {
  cacheableClient: null
};
