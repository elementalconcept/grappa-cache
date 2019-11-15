import { Initialisable, Registry } from '@elemental-concept/grappa';

import { CacheableClient } from '../../internal/cacheable-client';

export function Cacheable() {
  return (constructor: Initialisable) => Registry.registerAlternativeHttpClient(constructor.prototype, new CacheableClient());
}
