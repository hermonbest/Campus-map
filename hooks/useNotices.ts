import { useState, useEffect, useCallback } from 'react';
import { fetchNotices, Notice, NOTICES_CACHE_KEY, getCurrentVersion, getLocalVersion, saveLocalVersion } from '../lib/api';
import { getFromCache, saveToCache } from '../lib/cache';

const REFRESH_THRESHOLD = 3600000; // 1 hour

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
        console.warn('Background refresh failed for notices:', errorMessage);
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
   * Initial data load: check version, use cache if available
   */
  const initData = useCallback(async () => {
    console.log('[useNotices] Initializing data load...');
    try {
      // Check version first
      const serverVersion = await getCurrentVersion();
      const localVersion = await getLocalVersion();
      console.log(`[useNotices] Version check: server=${serverVersion}, local=${localVersion}`);

      const cachedData = await getFromCache<Notice[]>(NOTICES_CACHE_KEY);

      if (cachedData) {
        console.log(`[useNotices] Loaded ${cachedData.length} notices from cache`);
        setNotices(cachedData);
        setLoading(false);

        // Only fetch if version changed
        if (serverVersion !== localVersion) {
          console.log('[useNotices] Version changed, fetching from server');
          await refreshFromServer(false);
          await saveLocalVersion(serverVersion);
        } else {
          console.log('[useNotices] Version unchanged, using cached data');
        }
      } else {
        console.log('[useNotices] No cache found, fetching from server');
        // No cache: perform initial direct fetch
        await refreshFromServer(false);
        await saveLocalVersion(serverVersion);
      }
    } catch (err) {
      console.error('[useNotices] Error initializing notices data:', err);
      // Fallback to direct fetch
      refreshFromServer(false);
    }
  }, [refreshFromServer]);

  useEffect(() => {
    initData();
  }, [initData]);

  return {
    notices,
    loading,
    error,
    refresh: () => refreshFromServer(false), // Manual refresh is never silent
  };
}
