type CacheRecord<T> = { value: T; expires: number };

export function createCache() {
  const store = new Map<string, CacheRecord<unknown>>();

  const get = <T>(key: string): T | null => {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      store.delete(key);
      console.log('🚀 ~ Runtime cached data is expired.');
      return null;
    }
    console.log('🚀 ~ Returning cached data in runtime.');

    return entry.value as T;
  };

  const set = <T>(key: string, value: T, ttlMs: number) => {
    store.set(key, { value, expires: Date.now() + ttlMs });
  };

  const storeSize = () => store.size;
  const allCache = () => JSON.stringify(Array.from(store.entries()));
  const del = (key: string) => store.delete(key);

  const cached = async <T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> => {
    const cachedValue = get<T>(key);
    if (cachedValue !== null) return cachedValue;
    const value = await fn();
    set(key, value, ttlMs);
    return value;
  };

  return { get, set, del, cached, storeSize, allCache };
}
