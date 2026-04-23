import { useState, useEffect, useCallback } from 'react';
import { fetchBuildings, LocationData, BUILDINGS_CACHE_KEY, extractOfficesFromBuildings, OFFICES_CACHE_KEY, Office, getCurrentVersion, getLocalVersion, saveLocalVersion } from '../lib/api';
import { getFromCache, saveToCache, isCacheStale, saveMapCacheStatus } from '../lib/cache';
import { warmBuildingImageCache } from '../lib/imageCache';
import offlineManager from '../lib/offlineManager';

const REFRESH_THRESHOLD = 86400000; // 24 hours

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
     console.log(`[useBuildings] refreshFromServer called (silent=${isSilent}, currentBuildings=${buildings.length})`);
     try {
       if (!isSilent) setLoading(true);
       setError(null);
       console.log('[useBuildings] Fetching buildings from network...');
       const data = await fetchBuildings();
       console.log(`[useBuildings] Received ${data.length} buildings from server`);
       
       // Compare with current state to detect changes
       if (buildings.length > 0) {
         const newIds = new Set(data.map(b => b.id));
         const oldIds = new Set(buildings.map(b => b.id));
         const added = data.filter(b => !oldIds.has(b.id));
         const removed = buildings.filter(b => !newIds.has(b.id));
         const updated = data.filter(b => {
           const old = buildings.find(ob => ob.id === b.id);
           return old && (old.name !== b.name || old.description !== b.description || JSON.stringify(old.offices) !== JSON.stringify(b.offices));
         });
         if (added.length > 0 || removed.length > 0 || updated.length > 0) {
           console.log(`[useBuildings] Changes detected: +${added.length} added, -${removed.length} removed, ~${updated.length} updated`);
         }
       }
       
       setBuildings(data);
       await saveToCache(BUILDINGS_CACHE_KEY, data);
       
       // Cache offices separately for better offline search
       const offices = extractOfficesFromBuildings(data);
       await saveToCache(OFFICES_CACHE_KEY, offices);
       
       // Mark map as cached
       await saveMapCacheStatus();
       
       // Warm image cache when online
       if (!offlineManager.isOffline()) {
         console.log('[useBuildings] Warming image cache...');
         warmBuildingImageCache(data).catch(err => 
           console.warn('[useBuildings] Failed to warm image cache:', err)
         );
       }
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Failed to load buildings';
       
       // If we already have buildings (from cache), this is a "background" failure
       if (buildings.length > 0) {
         // Just log a warning in the background, don't show error to user
         console.warn('[useBuildings] Background refresh failed (might be offline):', errorMessage);
       } else {
         // No buildings in state: this IS a hard error for the initial view
         setError(errorMessage);
         console.error('[useBuildings] Error loading initial buildings:', err);
       }
     } finally {
       setLoading(false);
     }
   }, [buildings.length]);

   /**
   * Initial data load: check version, use cache if available
   */
  const initData = useCallback(async () => {
    console.log('[useBuildings] Initializing data load...');
    try {
      // Check version first
      const serverVersion = await getCurrentVersion();
      const localVersion = await getLocalVersion();
      console.log(`[useBuildings] Version check: server=${serverVersion}, local=${localVersion}`);

      const cachedData = await getFromCache<LocationData[]>(BUILDINGS_CACHE_KEY);

      if (cachedData) {
        console.log(`[useBuildings] Loaded ${cachedData.length} buildings from cache`);
        setBuildings(cachedData);
        setLoading(false);

        // Also load offices cache when loading buildings from cache
        const cachedOffices = await getFromCache<Office[]>(OFFICES_CACHE_KEY);
        if (cachedOffices) {
          console.log(`[useBuildings] Loaded ${cachedOffices.length} offices from cache`);
        }

        // Only fetch if version changed
        if (serverVersion !== localVersion) {
          console.log('[useBuildings] Version changed, fetching from server');
          await refreshFromServer(false);
          await saveLocalVersion(serverVersion);
        } else {
          console.log('[useBuildings] Version unchanged, using cached data');
        }
      } else {
        console.log('[useBuildings] No cache found, fetching from server');
        // No cache: perform initial direct fetch
        await refreshFromServer(false);
        await saveLocalVersion(serverVersion);
      }
    } catch (err) {
      console.error('[useBuildings] Error initializing buildings data:', err);
      // Fallback to direct fetch
      refreshFromServer(false);
    }
  }, [refreshFromServer]);

   useEffect(() => {
     initData();
   }, [initData]);

   return {
     buildings,
     loading,
     error,
     refresh: () => {
       console.log('[useBuildings] Manual refresh triggered');
       return refreshFromServer(false);
     },
   };
}
