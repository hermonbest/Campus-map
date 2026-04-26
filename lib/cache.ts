import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const CACHE_KEYS = {
  MAP_URL: '@campus_map_url',
  BUILDINGS: '@campus_buildings',
  OFFICES: '@campus_offices',
  NODES: '@campus_nodes',
  EDGES: '@campus_edges',
  NOTICES: '@campus_notices',
  APP_VERSION: '@campus_app_version',
  LAST_SYNC: '@campus_last_sync',
  BUILDING_IMAGES: '@campus_building_images',
  NOTICE_IMAGES: '@campus_notice_images',
  MAP_IMAGE_PATH: '@campus_map_image_path',
};

const IMAGE_CACHE_DIR = (() => {
  // @ts-ignore - expo-file-system types may not include this in all versions
  const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return `${dir}cached_images/`;
})();

export interface CachedData {
  buildings: any[];
  offices: any[];
  nodes: any[];
  edges: any[];
  notices: any[];
  appVersion: number;
  lastSync: string;
}

export interface CacheStatus {
  mapUrl: { cached: boolean; value?: string };
  buildings: { cached: boolean; count: number };
  offices: { cached: boolean; count: number };
  nodes: { cached: boolean; count: number };
  edges: { cached: boolean; count: number };
  notices: { cached: boolean; count: number };
  appVersion: { cached: boolean; value: number };
  lastSync: { cached: boolean; value?: string };
  buildingImages: { cached: boolean; count: number };
  noticeImages: { cached: boolean; count: number };
  mapImage: { cached: boolean; path?: string };
}

/**
 * Cache the map image URL
 * Note: React Native's Image component handles caching automatically
 */
export async function cacheMapImage(mapUrl: string): Promise<void> {
  try {
    console.log('[CACHE] Map URL: Caching...');
    await AsyncStorage.setItem(CACHE_KEYS.MAP_URL, mapUrl);
    console.log('[CACHE] Map URL: CACHED successfully');
  } catch (error) {
    console.error('[CACHE] Map URL: FAILED to cache', error);
    throw error;
  }
}

/**
 * Get cached map image URL
 */
export async function getCachedMapImage(): Promise<string | null> {
  try {
    const url = await AsyncStorage.getItem(CACHE_KEYS.MAP_URL);
    if (url) {
      console.log('[CACHE] Map URL: HIT (cached)');
    } else {
      console.log('[CACHE] Map URL: MISS (not cached)');
    }
    return url;
  } catch (error) {
    console.error('[CACHE] Map URL: ERROR getting cached', error);
    return null;
  }
}

/**
 * Fetch and cache all data from Supabase
 */
export async function cacheAllData(): Promise<CachedData> {
  try {
    console.log('[CACHE] Fetching all data from Supabase...');
    
    // Fetch all data in parallel
    const [buildingsResult, officesResult, nodesResult, edgesResult, noticesResult, versionResult] = await Promise.all([
      supabase.from('buildings').select('*'),
      supabase.from('offices').select('*'),
      supabase.from('nav_nodes').select('*'),
      supabase.from('nav_edges').select('*'),
      supabase.from('notices').select('*').eq('is_active', true).or('end_date.is.null,end_date.gte.' + new Date().toISOString()),
      supabase.from('app_version').select('*').single(),
    ]);

    if (buildingsResult.error) throw buildingsResult.error;
    if (officesResult.error) throw officesResult.error;
    if (nodesResult.error) throw nodesResult.error;
    if (edgesResult.error) throw edgesResult.error;
    if (noticesResult.error) throw noticesResult.error;
    if (versionResult.error) throw versionResult.error;

    const data: CachedData = {
      buildings: buildingsResult.data || [],
      offices: officesResult.data || [],
      nodes: nodesResult.data || [],
      edges: edgesResult.data || [],
      notices: noticesResult.data || [],
      appVersion: versionResult.data?.version || 1,
      lastSync: new Date().toISOString(),
    };

    // Cache all data with logging
    console.log('[CACHE] Buildings: CACHING -', data.buildings.length, 'items');
    await AsyncStorage.setItem(CACHE_KEYS.BUILDINGS, JSON.stringify(data.buildings));
    console.log('[CACHE] Buildings: CACHED -', data.buildings.length, 'items');

    console.log('[CACHE] Offices: CACHING -', data.offices.length, 'items');
    await AsyncStorage.setItem(CACHE_KEYS.OFFICES, JSON.stringify(data.offices));
    console.log('[CACHE] Offices: CACHED -', data.offices.length, 'items');

    console.log('[CACHE] Nodes: CACHING -', data.nodes.length, 'items');
    await AsyncStorage.setItem(CACHE_KEYS.NODES, JSON.stringify(data.nodes));
    console.log('[CACHE] Nodes: CACHED -', data.nodes.length, 'items');

    console.log('[CACHE] Edges: CACHING -', data.edges.length, 'items');
    await AsyncStorage.setItem(CACHE_KEYS.EDGES, JSON.stringify(data.edges));
    console.log('[CACHE] Edges: CACHED -', data.edges.length, 'items');

    console.log('[CACHE] Notices: CACHING -', data.notices.length, 'items');
    await AsyncStorage.setItem(CACHE_KEYS.NOTICES, JSON.stringify(data.notices));
    console.log('[CACHE] Notices: CACHED -', data.notices.length, 'items');

    console.log('[CACHE] App Version: CACHING - v' + data.appVersion);
    await AsyncStorage.setItem(CACHE_KEYS.APP_VERSION, String(data.appVersion));
    console.log('[CACHE] App Version: CACHED - v' + data.appVersion);

    console.log('[CACHE] Last Sync: CACHING -', data.lastSync);
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, data.lastSync);
    console.log('[CACHE] Last Sync: CACHED -', data.lastSync);

    console.log('[CACHE] All data cached successfully');
    return data;
  } catch (error) {
    console.error('[CACHE] FAILED to cache all data:', error);
    throw error;
  }
}

/**
 * Get all cached data
 */
export async function getCachedData(): Promise<CachedData | null> {
  try {
    const [buildingsStr, officesStr, nodesStr, edgesStr, noticesStr, versionStr, lastSyncStr] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.BUILDINGS),
      AsyncStorage.getItem(CACHE_KEYS.OFFICES),
      AsyncStorage.getItem(CACHE_KEYS.NODES),
      AsyncStorage.getItem(CACHE_KEYS.EDGES),
      AsyncStorage.getItem(CACHE_KEYS.NOTICES),
      AsyncStorage.getItem(CACHE_KEYS.APP_VERSION),
      AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC),
    ]);

    console.log('[CACHE] Buildings:', buildingsStr ? 'HIT' : 'MISS', buildingsStr ? `(${JSON.parse(buildingsStr).length} items)` : '');
    console.log('[CACHE] Offices:', officesStr ? 'HIT' : 'MISS', officesStr ? `(${JSON.parse(officesStr).length} items)` : '');
    console.log('[CACHE] Nodes:', nodesStr ? 'HIT' : 'MISS', nodesStr ? `(${JSON.parse(nodesStr).length} items)` : '');
    console.log('[CACHE] Edges:', edgesStr ? 'HIT' : 'MISS', edgesStr ? `(${JSON.parse(edgesStr).length} items)` : '');
    console.log('[CACHE] Notices:', noticesStr ? 'HIT' : 'MISS', noticesStr ? `(${JSON.parse(noticesStr).length} items)` : '');
    console.log('[CACHE] App Version:', versionStr ? 'HIT' : 'MISS', versionStr ? `(v${versionStr})` : '');
    console.log('[CACHE] Last Sync:', lastSyncStr ? 'HIT' : 'MISS');

    if (!buildingsStr || !officesStr || !nodesStr || !edgesStr || !noticesStr || !versionStr || !lastSyncStr) {
      console.log('[CACHE] Some data missing - returning null');
      return null;
    }

    return {
      buildings: JSON.parse(buildingsStr),
      offices: JSON.parse(officesStr),
      nodes: JSON.parse(nodesStr),
      edges: JSON.parse(edgesStr),
      notices: JSON.parse(noticesStr),
      appVersion: parseInt(versionStr, 10),
      lastSync: lastSyncStr,
    };
  } catch (error) {
    console.error('[CACHE] ERROR getting cached data:', error);
    return null;
  }
}

/**
 * Check if cached version matches server version
 */
export async function checkVersion(): Promise<{ needsUpdate: boolean; serverVersion: number; cachedVersion: number }> {
  try {
    console.log('[CACHE] Checking version...');
    // Get server version
    const { data: versionData, error } = await supabase
      .from('app_version')
      .select('*')
      .single();

    if (error) throw error;

    const serverVersion = versionData?.version || 1;
    const cachedVersionStr = await AsyncStorage.getItem(CACHE_KEYS.APP_VERSION);
    const cachedVersion = cachedVersionStr ? parseInt(cachedVersionStr, 10) : 0;

    console.log('[CACHE] Version check - Server: v' + serverVersion + ', Cached: v' + cachedVersion);

    return {
      needsUpdate: serverVersion > cachedVersion,
      serverVersion,
      cachedVersion,
    };
  } catch (error) {
    console.error('[CACHE] ERROR checking version:', error);
    return {
      needsUpdate: true,
      serverVersion: 1,
      cachedVersion: 0,
    };
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  try {
    console.log('[CACHE] Clearing all cache...');
    
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      CACHE_KEYS.MAP_URL,
      CACHE_KEYS.BUILDINGS,
      CACHE_KEYS.OFFICES,
      CACHE_KEYS.NODES,
      CACHE_KEYS.EDGES,
      CACHE_KEYS.NOTICES,
      CACHE_KEYS.APP_VERSION,
      CACHE_KEYS.LAST_SYNC,
      CACHE_KEYS.BUILDING_IMAGES,
      CACHE_KEYS.NOTICE_IMAGES,
      CACHE_KEYS.MAP_IMAGE_PATH,
    ]);

    // Clear image cache directory
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
      if (dirInfo.exists && dirInfo.isDirectory) {
        await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
        console.log('[CACHE] Image cache directory cleared');
      }
    } catch (e) {
      console.log('[CACHE] No image cache directory to clear');
    }

    console.log('[CACHE] All cache cleared successfully');
  } catch (error) {
    console.error('[CACHE] ERROR clearing cache:', error);
    throw error;
  }
}

/**
 * Get map URL from Supabase
 */
export async function getMapUrl(): Promise<string> {
  try {
    // For now, use the public URL directly
    // In production, this could be fetched from an API endpoint
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/campus-map-images/map.png`;
  } catch (error) {
    console.error('Error getting map URL:', error);
    throw error;
  }
}

/**
 * Cache individual data type
 */
export async function cacheData(key: string, data: any): Promise<void> {
  try {
    console.log(`[CACHE] ${key}: CACHING`);
    const cacheKey = `@campus_${key}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    console.log(`[CACHE] ${key}: CACHED`);
  } catch (error) {
    console.error(`[CACHE] ${key}: FAILED to cache`, error);
    throw error;
  }
}

/**
 * Get cached individual data type
 */
export async function getCachedItem(key: string): Promise<any | null> {
  try {
    const cacheKey = `@campus_${key}`;
    const dataStr = await AsyncStorage.getItem(cacheKey);
    if (!dataStr) {
      console.log(`[CACHE] ${key}: MISS (not cached)`);
      return null;
    }
    console.log(`[CACHE] ${key}: HIT (cached)`);
    return JSON.parse(dataStr);
  } catch (error) {
    console.error(`[CACHE] ${key}: ERROR getting cached`, error);
    return null;
  }
}

/**
 * Ensure image cache directory exists
 */
async function ensureImageCacheDir(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      console.log('[CACHE] Image cache directory created');
    }
  } catch (error) {
    console.error('[CACHE] ERROR creating image cache directory:', error);
    throw error;
  }
}

/**
 * Generate a safe filename from URL
 */
function getFilenameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const filename = pathname.split('/').pop() || 'image';
  const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg';
  const baseName = filename.replace(`.${ext}`, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseName}.${ext}`;
}

/**
 * Download and cache an image
 */
export async function cacheImage(url: string, type: 'building' | 'notice' | 'map'): Promise<string | null> {
  try {
    if (!url) {
      console.log('[CACHE] Image: No URL provided, skipping');
      return null;
    }

    console.log(`[CACHE] Image (${type}): DOWNLOADING - ${url.substring(0, 50)}...`);
    
    await ensureImageCacheDir();
    
    const filename = getFilenameFromUrl(url);
    const localPath = `${IMAGE_CACHE_DIR}${type}_${filename}`;
    
    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      console.log(`[CACHE] Image (${type}): HIT (already cached) - ${filename}`);
      return localPath;
    }
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(url, localPath);
    
    if (downloadResult.status === 200) {
      console.log(`[CACHE] Image (${type}): CACHED - ${filename}`);
      return localPath;
    } else {
      console.error(`[CACHE] Image (${type}): FAILED to download - status ${downloadResult.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[CACHE] Image (${type}): ERROR -`, error);
    return null;
  }
}

/**
 * Get cached image path
 */
export async function getCachedImage(url: string, type: 'building' | 'notice' | 'map'): Promise<string | null> {
  try {
    if (!url) return null;
    
    const filename = getFilenameFromUrl(url);
    const localPath = `${IMAGE_CACHE_DIR}${type}_${filename}`;
    
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      console.log(`[CACHE] Image (${type}): HIT (cached) - ${filename}`);
      return localPath;
    }
    
    console.log(`[CACHE] Image (${type}): MISS (not cached) - ${filename}`);
    return null;
  } catch (error) {
    console.error(`[CACHE] Image (${type}): ERROR getting cached -`, error);
    return null;
  }
}

/**
 * Cache all building images
 */
export async function cacheBuildingImages(buildings: any[]): Promise<void> {
  try {
    console.log('[CACHE] Building Images: STARTING batch cache');
    
    const imageMap: Record<string, string> = {};
    let cachedCount = 0;
    
    for (const building of buildings) {
      if (building.image_url) {
        const localPath = await cacheImage(building.image_url, 'building');
        if (localPath) {
          imageMap[building.id] = localPath;
          cachedCount++;
        }
      }
    }
    
    await AsyncStorage.setItem(CACHE_KEYS.BUILDING_IMAGES, JSON.stringify(imageMap));
    console.log(`[CACHE] Building Images: CACHED - ${cachedCount}/${buildings.length} images`);
  } catch (error) {
    console.error('[CACHE] Building Images: FAILED to cache batch', error);
    throw error;
  }
}

/**
 * Cache all notice images
 */
export async function cacheNoticeImages(notices: any[]): Promise<void> {
  try {
    console.log('[CACHE] Notice Images: STARTING batch cache');
    
    const imageMap: Record<string, string> = {};
    let cachedCount = 0;
    
    for (const notice of notices) {
      if (notice.image_url) {
        const localPath = await cacheImage(notice.image_url, 'notice');
        if (localPath) {
          imageMap[notice.id] = localPath;
          cachedCount++;
        }
      }
    }
    
    await AsyncStorage.setItem(CACHE_KEYS.NOTICE_IMAGES, JSON.stringify(imageMap));
    console.log(`[CACHE] Notice Images: CACHED - ${cachedCount}/${notices.length} images`);
  } catch (error) {
    console.error('[CACHE] Notice Images: FAILED to cache batch', error);
    throw error;
  }
}

/**
 * Cache the map image file
 */
export async function cacheMapImageFile(mapUrl: string): Promise<string | null> {
  try {
    console.log('[CACHE] Map Image File: DOWNLOADING');
    
    const localPath = await cacheImage(mapUrl, 'map');
    
    if (localPath) {
      await AsyncStorage.setItem(CACHE_KEYS.MAP_IMAGE_PATH, localPath);
      console.log('[CACHE] Map Image File: CACHED');
    }
    
    return localPath;
  } catch (error) {
    console.error('[CACHE] Map Image File: FAILED', error);
    return null;
  }
}

/**
 * Get cached map image file path
 */
export async function getCachedMapImageFile(): Promise<string | null> {
  try {
    const path = await AsyncStorage.getItem(CACHE_KEYS.MAP_IMAGE_PATH);
    if (path) {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        console.log('[CACHE] Map Image File: HIT (cached)');
        return path;
      }
    }
    console.log('[CACHE] Map Image File: MISS (not cached)');
    return null;
  } catch (error) {
    console.error('[CACHE] Map Image File: ERROR getting cached', error);
    return null;
  }
}

/**
 * Get cached building image path
 */
export async function getCachedBuildingImage(buildingId: string): Promise<string | null> {
  try {
    const imageMapStr = await AsyncStorage.getItem(CACHE_KEYS.BUILDING_IMAGES);
    if (!imageMapStr) {
      console.log('[CACHE] Building Image: MISS (no image map cached)');
      return null;
    }
    
    const imageMap = JSON.parse(imageMapStr);
    const path = imageMap[buildingId];
    
    if (path) {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        console.log(`[CACHE] Building Image (${buildingId}): HIT (cached)`);
        return path;
      }
    }
    
    console.log(`[CACHE] Building Image (${buildingId}): MISS (not cached)`);
    return null;
  } catch (error) {
    console.error('[CACHE] Building Image: ERROR getting cached', error);
    return null;
  }
}

/**
 * Get cached notice image path
 */
export async function getCachedNoticeImage(noticeId: string): Promise<string | null> {
  try {
    const imageMapStr = await AsyncStorage.getItem(CACHE_KEYS.NOTICE_IMAGES);
    if (!imageMapStr) {
      console.log('[CACHE] Notice Image: MISS (no image map cached)');
      return null;
    }
    
    const imageMap = JSON.parse(imageMapStr);
    const path = imageMap[noticeId];
    
    if (path) {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        console.log(`[CACHE] Notice Image (${noticeId}): HIT (cached)`);
        return path;
      }
    }
    
    console.log(`[CACHE] Notice Image (${noticeId}): MISS (not cached)`);
    return null;
  } catch (error) {
    console.error('[CACHE] Notice Image: ERROR getting cached', error);
    return null;
  }
}

/**
 * Get complete cache status
 */
export async function getCacheStatus(): Promise<CacheStatus> {
  try {
    console.log('[CACHE] Getting cache status...');
    
    const mapUrl = await AsyncStorage.getItem(CACHE_KEYS.MAP_URL);
    const buildingsStr = await AsyncStorage.getItem(CACHE_KEYS.BUILDINGS);
    const officesStr = await AsyncStorage.getItem(CACHE_KEYS.OFFICES);
    const nodesStr = await AsyncStorage.getItem(CACHE_KEYS.NODES);
    const edgesStr = await AsyncStorage.getItem(CACHE_KEYS.EDGES);
    const noticesStr = await AsyncStorage.getItem(CACHE_KEYS.NOTICES);
    const versionStr = await AsyncStorage.getItem(CACHE_KEYS.APP_VERSION);
    const lastSyncStr = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    const buildingImagesStr = await AsyncStorage.getItem(CACHE_KEYS.BUILDING_IMAGES);
    const noticeImagesStr = await AsyncStorage.getItem(CACHE_KEYS.NOTICE_IMAGES);
    const mapImagePath = await AsyncStorage.getItem(CACHE_KEYS.MAP_IMAGE_PATH);
    
    const status: CacheStatus = {
      mapUrl: { cached: !!mapUrl, value: mapUrl || undefined },
      buildings: { cached: !!buildingsStr, count: buildingsStr ? JSON.parse(buildingsStr).length : 0 },
      offices: { cached: !!officesStr, count: officesStr ? JSON.parse(officesStr).length : 0 },
      nodes: { cached: !!nodesStr, count: nodesStr ? JSON.parse(nodesStr).length : 0 },
      edges: { cached: !!edgesStr, count: edgesStr ? JSON.parse(edgesStr).length : 0 },
      notices: { cached: !!noticesStr, count: noticesStr ? JSON.parse(noticesStr).length : 0 },
      appVersion: { cached: !!versionStr, value: versionStr ? parseInt(versionStr, 10) : 0 },
      lastSync: { cached: !!lastSyncStr, value: lastSyncStr || undefined },
      buildingImages: { cached: !!buildingImagesStr, count: buildingImagesStr ? Object.keys(JSON.parse(buildingImagesStr)).length : 0 },
      noticeImages: { cached: !!noticeImagesStr, count: noticeImagesStr ? Object.keys(JSON.parse(noticeImagesStr)).length : 0 },
      mapImage: { cached: !!mapImagePath, path: mapImagePath || undefined },
    };
    
    console.log('[CACHE] Status Report:');
    console.log(`  Map URL: ${status.mapUrl.cached ? 'CACHED' : 'NOT CACHED'}`);
    console.log(`  Buildings: ${status.buildings.cached ? 'CACHED' : 'NOT CACHED'} (${status.buildings.count} items)`);
    console.log(`  Offices: ${status.offices.cached ? 'CACHED' : 'NOT CACHED'} (${status.offices.count} items)`);
    console.log(`  Nodes: ${status.nodes.cached ? 'CACHED' : 'NOT CACHED'} (${status.nodes.count} items)`);
    console.log(`  Edges: ${status.edges.cached ? 'CACHED' : 'NOT CACHED'} (${status.edges.count} items)`);
    console.log(`  Notices: ${status.notices.cached ? 'CACHED' : 'NOT CACHED'} (${status.notices.count} items)`);
    console.log(`  App Version: ${status.appVersion.cached ? 'CACHED' : 'NOT CACHED'} (v${status.appVersion.value})`);
    console.log(`  Last Sync: ${status.lastSync.cached ? 'CACHED' : 'NOT CACHED'}`);
    console.log(`  Building Images: ${status.buildingImages.cached ? 'CACHED' : 'NOT CACHED'} (${status.buildingImages.count} images)`);
    console.log(`  Notice Images: ${status.noticeImages.cached ? 'CACHED' : 'NOT CACHED'} (${status.noticeImages.count} images)`);
    console.log(`  Map Image File: ${status.mapImage.cached ? 'CACHED' : 'NOT CACHED'}`);
    
    return status;
  } catch (error) {
    console.error('[CACHE] ERROR getting cache status:', error);
    throw error;
  }
}
