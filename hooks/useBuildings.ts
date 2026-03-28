import { useState, useEffect, useCallback } from 'react';
import { fetchBuildings, LocationData } from '../lib/api';

interface UseBuildingsResult {
  buildings: LocationData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage buildings data from the web-admin API
 */
export function useBuildings(): UseBuildingsResult {
  const [buildings, setBuildings] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBuildings();
      setBuildings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load buildings';
      setError(errorMessage);
      console.error('Error loading buildings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  return {
    buildings,
    loading,
    error,
    refresh: loadBuildings,
  };
}
