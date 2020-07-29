export interface PersistenceManager {
  put(key: string, value: string);

  get(key: string): string | null | Promise<string | null>;

  remove(key: string);

  clear();
}
