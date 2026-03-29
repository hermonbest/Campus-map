import { useState, useEffect, useCallback } from 'react';
import { fetchBuildings, LocationData, BUILDINGS_CACHE_KEY, extractOfficesFromBuildings, OFFICES_CACHE_KEY, Office } from '../lib/api';
import { getFromCache, saveToCache, isCacheStale, saveMapCacheStatus } from '../lib/cache';
import { warmBuildingImageCache } from '../lib/imageCache';
import offlineManager from '../lib/offlineManager';

const REFRESH_THRESHOLD = 600000; // 10 minutes

interface UseBuildingsResult {
  buildings: LocationData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage buildings data with persistent caching
 */
export function useBuildings(): UseBuildingsResult {
  const [buildings, setBuildings] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Freshly fetch buildings from the server and update cache
   */
  const refreshFromServer = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const data = await fetchBuildings();
      setBuildings(data);
      await saveToCache(BUILDINGS_CACHE_KEY, data);
      
      // Cache offices separately for better offline search
      const offices = extractOfficesFromBuildings(data);
      await saveToCache(OFFICES_CACHE_KEY, offices);
      
      // Mark map as cached
      await saveMapCacheStatus();
      
      // Warm image cache when online
      if (!offlineManager.isOffline()) {
        warmBuildingImageCache(data).catch(err => 
          console.warn('Failed to warm image cache:', err)
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load buildings';
      
      // If we already have buildings (from cache), this is a "background" failure
      if (buildings.length > 0) {
        // Just log a warning in the background, don't show error to user
        console.warn('Background refresh failed (offline?):', errorMessage);
      } else {
        // No buildings in state: this IS a hard error for the initial view
        setError(errorMessage);
        console.error('Error loading initial buildings:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [buildings.length]);

  /**
   * Initial data load: try cache first, then refresh if stale
   */
  const initData = useCallback(async () => {
    try {
      const cachedData = await getFromCache<LocationData[]>(BUILDINGS_CACHE_KEY);
      
      if (cachedData) {
        setBuildings(cachedData);
        setLoading(false);
        
        // Also load offices cache when loading buildings from cache
        const cachedOffices = await getFromCache<Office[]>(OFFICES_CACHE_KEY);
        if (cachedOffices) {
          console.log(`Loaded ${cachedOffices.length} offices from cache`);
        }
        
        // Refresh silently if cache is stale
        if (await isCacheStale(BUILDINGS_CACHE_KEY, REFRESH_THRESHOLD)) {
          refreshFromServer(true);
        }
      } else {
        // No cache: perform initial direct fetch
        await refreshFromServer(false);
      }
    } catch (err) {
      console.error('Error initializing buildings data:', err);
      // Fallback to direct fetch
      refreshFromServer(false);
    }
  }, [refreshFromServer]);

  useEffect(() => {
    initData();
    
    // Set up periodic background refresh
    const intervalId = setInterval(() => {
      refreshFromServer(true);
    }, REFRESH_THRESHOLD);
    
    // Set up proactive cache warming when coming online
    const unsubscribe = offlineManager.subscribeToNetworkChanges(async (status) => {
      if (status.isConnected && status.isInternetReachable && buildings.length > 0) {
        // When coming back online, refresh cache if stale
        const shouldRefresh = await isCacheStale(BUILDINGS_CACHE_KEY, REFRESH_THRESHOLD);
        if (shouldRefresh) {
          refreshFromServer(true);
        }
      }
    });
    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [initData, refreshFromServer]);

  return {
    buildings,
    loading,
    error,
    refresh: () => refreshFromServer(false), // Manual refresh is never silent
  };
}
