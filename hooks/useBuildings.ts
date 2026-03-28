import { useState, useEffect, useCallback } from 'react';
import { fetchBuildings, LocationData, BUILDINGS_CACHE_KEY } from '../lib/api';
import { getFromCache, saveToCache, isCacheStale } from '../lib/cache';

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
    
    return () => clearInterval(intervalId);
  }, [initData, refreshFromServer]);

  return {
    buildings,
    loading,
    error,
    refresh: () => refreshFromServer(false), // Manual refresh is never silent
  };
}
