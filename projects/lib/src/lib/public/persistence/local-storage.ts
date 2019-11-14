import { PersistenceManager } from './persistence-manager';
import { StorageKeyPrefix } from '../../internal/constants';

export class LocalStorage implements PersistenceManager {
  clear = () => Object.keys(window.localStorage)
    .filter(key => key.indexOf(StorageKeyPrefix) === 0)
    .forEach(this.remove);

  get = (key: string): string | null => window.localStorage.getItem(StorageKeyPrefix + key);

  put = (key: string, value: string) => window.localStorage.setItem(StorageKeyPrefix + key, value);

  remove = (key: string) => window.localStorage.removeItem(StorageKeyPrefix + key);
}
