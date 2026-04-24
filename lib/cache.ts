import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CACHE_KEYS = {
  MAP_URL: '@campus_map_url',
  BUILDINGS: '@campus_buildings',
  OFFICES: '@campus_offices',
  NODES: '@campus_nodes',
  EDGES: '@campus_edges',
  APP_VERSION: '@campus_app_version',
  LAST_SYNC: '@campus_last_sync',
};

export interface CachedData {
  buildings: any[];
  offices: any[];
  nodes: any[];
  edges: any[];
  appVersion: number;
  lastSync: string;
}

/**
 * Cache the map image URL
 * Note: React Native's Image component handles caching automatically
 */
export async function cacheMapImage(mapUrl: string): Promise<void> {
  try {
    console.log('Caching map URL...');
    await AsyncStorage.setItem(CACHE_KEYS.MAP_URL, mapUrl);
    console.log('Map URL cached successfully');
  } catch (error) {
    console.error('Error caching map URL:', error);
    throw error;
  }
}

/**
 * Get cached map image URL
 */
export async function getCachedMapImage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CACHE_KEYS.MAP_URL);
  } catch (error) {
    console.error('Error getting cached map URL:', error);
    return null;
  }
}

/**
 * Fetch and cache all data from Supabase
 */
export async function cacheAllData(): Promise<CachedData> {
  try {
    console.log('Fetching all data from Supabase...');
    
    // Fetch all data in parallel
    const [buildingsResult, officesResult, nodesResult, edgesResult, versionResult] = await Promise.all([
      supabase.from('buildings').select('*'),
      supabase.from('offices').select('*'),
      supabase.from('nav_nodes').select('*'),
      supabase.from('nav_edges').select('*'),
      supabase.from('app_version').select('*').single(),
    ]);

    if (buildingsResult.error) throw buildingsResult.error;
    if (officesResult.error) throw officesResult.error;
    if (nodesResult.error) throw nodesResult.error;
    if (edgesResult.error) throw edgesResult.error;
    if (versionResult.error) throw versionResult.error;

    const data: CachedData = {
      buildings: buildingsResult.data || [],
      offices: officesResult.data || [],
      nodes: nodesResult.data || [],
      edges: edgesResult.data || [],
      appVersion: versionResult.data?.version || 1,
      lastSync: new Date().toISOString(),
    };

    // Cache all data
    await AsyncStorage.setItem(CACHE_KEYS.BUILDINGS, JSON.stringify(data.buildings));
    await AsyncStorage.setItem(CACHE_KEYS.OFFICES, JSON.stringify(data.offices));
    await AsyncStorage.setItem(CACHE_KEYS.NODES, JSON.stringify(data.nodes));
    await AsyncStorage.setItem(CACHE_KEYS.EDGES, JSON.stringify(data.edges));
    await AsyncStorage.setItem(CACHE_KEYS.APP_VERSION, String(data.appVersion));
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, data.lastSync);

    console.log('All data cached successfully');
    return data;
  } catch (error) {
    console.error('Error caching all data:', error);
    throw error;
  }
}

/**
 * Get all cached data
 */
export async function getCachedData(): Promise<CachedData | null> {
  try {
    const [buildingsStr, officesStr, nodesStr, edgesStr, versionStr, lastSyncStr] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.BUILDINGS),
      AsyncStorage.getItem(CACHE_KEYS.OFFICES),
      AsyncStorage.getItem(CACHE_KEYS.NODES),
      AsyncStorage.getItem(CACHE_KEYS.EDGES),
      AsyncStorage.getItem(CACHE_KEYS.APP_VERSION),
      AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC),
    ]);

    if (!buildingsStr || !officesStr || !nodesStr || !edgesStr || !versionStr || !lastSyncStr) {
      return null;
    }

    return {
      buildings: JSON.parse(buildingsStr),
      offices: JSON.parse(officesStr),
      nodes: JSON.parse(nodesStr),
      edges: JSON.parse(edgesStr),
      appVersion: parseInt(versionStr, 10),
      lastSync: lastSyncStr,
    };
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Check if cached version matches server version
 */
export async function checkVersion(): Promise<{ needsUpdate: boolean; serverVersion: number; cachedVersion: number }> {
  try {
    // Get server version
    const { data: versionData, error } = await supabase
      .from('app_version')
      .select('*')
      .single();

    if (error) throw error;

    const serverVersion = versionData?.version || 1;
    const cachedVersionStr = await AsyncStorage.getItem(CACHE_KEYS.APP_VERSION);
    const cachedVersion = cachedVersionStr ? parseInt(cachedVersionStr, 10) : 0;

    return {
      needsUpdate: serverVersion > cachedVersion,
      serverVersion,
      cachedVersion,
    };
  } catch (error) {
    console.error('Error checking version:', error);
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
    console.log('Clearing cache...');
    
    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      CACHE_KEYS.MAP_URL,
      CACHE_KEYS.BUILDINGS,
      CACHE_KEYS.OFFICES,
      CACHE_KEYS.NODES,
      CACHE_KEYS.EDGES,
      CACHE_KEYS.APP_VERSION,
      CACHE_KEYS.LAST_SYNC,
    ]);

    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
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
    const cacheKey = `@campus_${key}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error caching ${key}:`, error);
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
    if (!dataStr) return null;
    return JSON.parse(dataStr);
  } catch (error) {
    console.error(`Error getting cached ${key}:`, error);
    return null;
  }
}
