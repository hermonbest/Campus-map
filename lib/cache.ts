import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@campus-map-cache:';
const MAP_CACHE_KEY = 'map-overlay-cache';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Save data to local storage with a timestamp
 */
export async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    console.error(`Cache Error (Save): ${key}`, error);
  }
}

/**
 * Retrieve data from local storage
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (value !== null) {
      const item: CacheItem<T> = JSON.parse(value);
      return item.data;
    }
    return null;
  } catch (error) {
    console.error(`Cache Error (Get): ${key}`, error);
    return null;
  }
}

/**
 * Check if the cache is older than the TTL (Time-To-Live in milliseconds)
 * Default TTL is 10 minutes (600,000 ms)
 */
export async function isCacheStale(key: string, ttl: number = 600000): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (value === null) return true;
    
    const item: CacheItem<any> = JSON.parse(value);
    const now = Date.now();
    return now - item.timestamp > ttl;
  } catch (error) {
    return true;
  }
}

/**
 * Clear specific cache key
 */
export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error(`Cache Error (Clear): ${key}`, error);
  }
}

/**
 * Save map overlay cache status
 */
export async function saveMapCacheStatus(): Promise<void> {
  try {
    const item: CacheItem<boolean> = {
      data: true,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${MAP_CACHE_KEY}`, JSON.stringify(item));
  } catch (error) {
    console.error('Map Cache Error (Save):', error);
  }
}

/**
 * Check if map overlay is cached
 */
export async function isMapCached(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(`${CACHE_PREFIX}${MAP_CACHE_KEY}`);
    return value !== null;
  } catch (error) {
    console.error('Map Cache Error (Check):', error);
    return false;
  }
}

/**
 * Clear map cache
 */
export async function clearMapCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${MAP_CACHE_KEY}`);
  } catch (error) {
    console.error('Map Cache Error (Clear):', error);
  }
}
