import { Initialisable, Registry } from '@elemental-concept/grappa';

import { CacheableClient } from '../../internal/cacheable-client';
import { PersistenceManager } from '../persistence/persistence-manager';
import { LocalStorage } from '../persistence/local-storage';
import { instances } from '../../internal/constants';

export function Cacheable(persistenceManager: PersistenceManager = new LocalStorage()) {
  return (constructor: Initialisable) => {
    instances.cacheableClient = new CacheableClient(persistenceManager);
    Registry.registerAlternativeHttpClient(constructor.prototype, instances.cacheableClient);
  };
}
