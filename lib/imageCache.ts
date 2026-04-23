import { Image as ExpoImage } from 'expo-image';
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const IMAGE_CACHE_PREFIX = '@campus-map-image-cache:';
const CACHE_METADATA_KEY = '@campus-map-image-metadata';

interface CacheMetadata {
  [url: string]: {
    timestamp: number;
    size: number;
    lastAccessed: number;
  };
}

interface ImageSource {
  uri: string;
  cache?: 'default' | 'force-cache' | 'only-if-cached' | 'reload';
}

interface ImageCacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 7 days)
  maxCacheSize?: number; // Maximum cache size in bytes (default: 50MB)
}

const DEFAULT_OPTIONS: ImageCacheOptions = {
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxCacheSize: 50 * 1024 * 1024, // 50MB
};

/**
 * Get cached image source with offline support
 */
export async function getCachedImageSource(
  url: string, 
  options: ImageCacheOptions = {}
): Promise<ImageSource> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Check if image is cached and not expired
    const metadata = await getCacheMetadata();
    const imageMeta = metadata[url];
    
    if (imageMeta && !isExpired(imageMeta.timestamp, opts.ttl!)) {
      // Update last accessed time
      metadata[url].lastAccessed = Date.now();
      await saveCacheMetadata(metadata);
      
      // Return cached image source
      return { uri: url, cache: 'force-cache' };
    }
    
    // Preload and cache the image
    await preloadImage(url);
    
    // Update metadata
    metadata[url] = {
      timestamp: Date.now(),
      size: 0, // expo-image doesn't expose size info
      lastAccessed: Date.now(),
    };
    await saveCacheMetadata(metadata);
    
    // Clean up old cache if needed
    await cleanupOldCache(opts);
    
    return { uri: url, cache: 'force-cache' };
  } catch (error) {
    console.warn('Image cache error, falling back to network:', error);
    return { uri: url };
  }
}

/**
 * Preload an image for offline use
 */
export async function preloadImage(url: string): Promise<void> {
  try {
    await ExpoImage.prefetch(url);
  } catch (error) {
    console.warn('Failed to preload image:', url, error);
  }
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => preloadImage(url).catch(err => 
    console.warn(`Failed to preload ${url}:`, err)
  ));
  await Promise.allSettled(promises);
}

/**
 * Clear specific image from cache
 */
export async function clearImageCache(url: string): Promise<void> {
  try {
    const metadata = await getCacheMetadata();
    delete metadata[url];
    await saveCacheMetadata(metadata);
    
    // Clear from expo-image cache (Note: expo-image doesn't expose clearDiskCache in all versions)
    // This is a best effort approach
    try {
      await ExpoImage.clearDiskCache?.();
    } catch (e) {
      // Ignore if clearDiskCache is not available
    }
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
}

/**
 * Clear all image cache
 */
export async function clearAllImageCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    // Clear from expo-image cache (Note: expo-image doesn't expose clearDiskCache in all versions)
    // This is a best effort approach
    try {
      await ExpoImage.clearDiskCache?.();
    } catch (e) {
      // Ignore if clearDiskCache is not available
    }
  } catch (error) {
    console.error('Failed to clear all image cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalImages: number;
  totalSize: number;
  oldestImage: number | null;
  newestImage: number | null;
}> {
  try {
    const metadata = await getCacheMetadata();
    const urls = Object.keys(metadata);
    
    if (urls.length === 0) {
      return {
        totalImages: 0,
        totalSize: 0,
        oldestImage: null,
        newestImage: null,
      };
    }
    
    const timestamps = urls.map(url => metadata[url].timestamp);
    const oldestImage = Math.min(...timestamps);
    const newestImage = Math.max(...timestamps);
    const totalSize = urls.reduce((sum, url) => sum + metadata[url].size, 0);
    
    return {
      totalImages: urls.length,
      totalSize,
      oldestImage,
      newestImage,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      totalImages: 0,
      totalSize: 0,
      oldestImage: null,
      newestImage: null,
    };
  }
}

/**
 * Check if cache entry is expired
 */
function isExpired(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp > ttl;
}

/**
 * Get cache metadata
 */
async function getCacheMetadata(): Promise<CacheMetadata> {
  try {
    const data = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get cache metadata:', error);
    return {};
  }
}

/**
 * Save cache metadata
 */
async function saveCacheMetadata(metadata: CacheMetadata): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Failed to save cache metadata:', error);
  }
}

/**
 * Clean up old cache entries based on LRU and size limits
 */
async function cleanupOldCache(options: ImageCacheOptions): Promise<void> {
  try {
    const metadata = await getCacheMetadata();
    const urls = Object.keys(metadata);
    
    if (urls.length === 0) return;
    
    // Remove expired entries
    const now = Date.now();
    let cleanedMetadata = { ...metadata };
    
    for (const url of urls) {
      if (isExpired(cleanedMetadata[url].timestamp, options.ttl!)) {
        delete cleanedMetadata[url];
      }
    }
    
    // If still over size limit, remove least recently used
    const remainingUrls = Object.keys(cleanedMetadata);
    if (remainingUrls.length > 0) {
      // Sort by last accessed time (oldest first)
      remainingUrls.sort((a, b) => cleanedMetadata[a].lastAccessed - cleanedMetadata[b].lastAccessed);
      
      // Remove oldest entries until under size limit
      let currentSize = remainingUrls.reduce((sum, url) => sum + cleanedMetadata[url].size, 0);
      let index = 0;
      
      while (currentSize > (options.maxCacheSize || DEFAULT_OPTIONS.maxCacheSize!) && index < remainingUrls.length) {
        const urlToRemove = remainingUrls[index];
        currentSize -= cleanedMetadata[urlToRemove].size;
        delete cleanedMetadata[urlToRemove];
        index++;
      }
    }
    
    await saveCacheMetadata(cleanedMetadata);
  } catch (error) {
    console.error('Failed to cleanup old cache:', error);
  }
}

/**
 * Check if an image is likely cached
 */
export async function isImageCached(url: string): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata();
    const imageMeta = metadata[url];
    return imageMeta !== undefined && !isExpired(imageMeta.timestamp, DEFAULT_OPTIONS.ttl!);
  } catch (error) {
    return false;
  }
}

/**
 * Warm cache with building images
 */
export async function warmBuildingImageCache(buildings: any[]): Promise<void> {
  console.log(`[ImageCache] warmBuildingImageCache called with ${buildings.length} buildings`);
  const imageUrls = buildings
    .filter(building => building.imageUrl)
    .map(building => building.imageUrl)
    .filter((url): url is string => Boolean(url));
  
  if (imageUrls.length > 0) {
    console.log(`[ImageCache] Warming ${imageUrls.length} building images:`, imageUrls);
    await preloadImages(imageUrls);
    console.log(`[ImageCache] Finished warming ${imageUrls.length} images`);
  } else {
    console.log(`[ImageCache] No building images to warm`);
  }
}
