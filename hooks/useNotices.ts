import { useState, useEffect, useCallback } from 'react';
import { fetchNotices, Notice, NOTICES_CACHE_KEY } from '../lib/api';
import { getFromCache, saveToCache, isCacheStale } from '../lib/cache';
import offlineManager from '../lib/offlineManager';

const REFRESH_THRESHOLD = 600000; // 10 minutes

interface UseNoticesResult {
  notices: Notice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage notices data with persistent caching
 */
export function useNotices(): UseNoticesResult {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Freshly fetch notices from the server and update cache
   */
  const refreshFromServer = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      
      // Check if offline before attempting fetch
      if (offlineManager.isOffline()) {
        console.log('Notices: Offline, skipping server fetch');
        // If we have cached data, use it
        const cachedData = await getFromCache<Notice[]>(NOTICES_CACHE_KEY);
        if (cachedData && notices.length === 0) {
          setNotices(cachedData);
        }
        return;
      }
      
      const data = await fetchNotices();
      setNotices(data);
      await saveToCache(NOTICES_CACHE_KEY, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notices';
      
      // If we already have notices (from cache), this is a "background" failure
      if (notices.length > 0) {
        // Just log a warning in the background, don't show error to user
        console.warn('Background refresh failed for notices (offline?):', errorMessage);
      } else {
        // Check if we have cached data to fallback to
        const cachedData = await getFromCache<Notice[]>(NOTICES_CACHE_KEY);
        if (cachedData) {
          console.log('Using cached notices after fetch failure');
          setNotices(cachedData);
        } else {
          // No cached data: this IS a hard error
          setError(errorMessage);
          console.error('Error loading initial notices:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [notices.length]);

  /**
   * Initial data load: try cache first, then refresh if stale
   */
  const initData = useCallback(async () => {
    try {
      const cachedData = await getFromCache<Notice[]>(NOTICES_CACHE_KEY);
      
      if (cachedData) {
        setNotices(cachedData);
        setLoading(false);
        
        // Only refresh if online and cache is stale
        if (!offlineManager.isOffline() && await isCacheStale(NOTICES_CACHE_KEY, REFRESH_THRESHOLD)) {
          refreshFromServer(true);
        }
      } else {
        // No cache: only fetch if online
        if (offlineManager.isOffline()) {
          console.log('No cached notices and offline - will retry when online');
          setLoading(false);
        } else {
          await refreshFromServer(false);
        }
      }
    } catch (err) {
      console.error('Error initializing notices data:', err);
      // Only show error if no cached data and online
      const cachedData = await getFromCache<Notice[]>(NOTICES_CACHE_KEY);
      if (!cachedData && !offlineManager.isOffline()) {
        refreshFromServer(false);
      } else {
        setLoading(false);
      }
    }
  }, [refreshFromServer]);

  useEffect(() => {
    initData();
    
    // Set up network change listener to refresh when coming online
    const unsubscribe = offlineManager.subscribeToNetworkChanges(async (status) => {
      if (status.isConnected && status.isInternetReachable) {
        // Just came online, refresh if stale or empty
        const shouldRefresh = notices.length === 0 || await isCacheStale(NOTICES_CACHE_KEY, REFRESH_THRESHOLD);
        if (shouldRefresh) {
          refreshFromServer(true);
        }
      }
    });
    
    return () => unsubscribe();
  }, [initData, refreshFromServer, notices.length]);

  return {
    notices,
    loading,
    error,
    refresh: () => refreshFromServer(false), // Manual refresh is never silent
  };
}
