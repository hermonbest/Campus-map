import { useState, useEffect, useCallback } from 'react';
import { fetchNotices, Notice, NOTICES_CACHE_KEY } from '../lib/api';
import { getFromCache, saveToCache, isCacheStale } from '../lib/cache';

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
        // No notices in state: this IS a hard error for the initial view
        setError(errorMessage);
        console.error('Error loading initial notices:', err);
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
        
        // Refresh silently if cache is stale
        if (await isCacheStale(NOTICES_CACHE_KEY, REFRESH_THRESHOLD)) {
          refreshFromServer(true);
        }
      } else {
        // No cache: perform initial direct fetch
        await refreshFromServer(false);
      }
    } catch (err) {
      console.error('Error initializing notices data:', err);
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
    notices,
    loading,
    error,
    refresh: () => refreshFromServer(false), // Manual refresh is never silent
  };
}
