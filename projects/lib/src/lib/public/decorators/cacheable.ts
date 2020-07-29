import { Initialisable, Registry } from '@elemental-concept/grappa';

import { CacheableClient } from '../../internal/cacheable-client';
import { PersistenceManager } from '../persistence/persistence-manager';
import { LocalStorage } from '../persistence/local-storage';

export function Cacheable(persistenceManager: PersistenceManager = new LocalStorage()) {
  return (constructor: Initialisable) =>
    Registry.registerAlternativeHttpClient(constructor.prototype, new CacheableClient(persistenceManager));
}
