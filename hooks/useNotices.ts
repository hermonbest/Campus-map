import { useState, useEffect, useCallback } from 'react';
import { fetchNotices, Notice } from '../lib/api';

interface UseNoticesResult {
  notices: Notice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage notices data from the web-admin API
 */
export function useNotices(): UseNoticesResult {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotices();
      setNotices(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notices';
      setError(errorMessage);
      console.error('Error loading notices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  return {
    notices,
    loading,
    error,
    refresh: loadNotices,
  };
}
