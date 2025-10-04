import { useState, useEffect, useCallback } from 'react';
import { Trade } from './types';

interface UsePollOptions {
  url?: string;
  interval?: number;
  enabled?: boolean;
}

export function usePoll({ url, interval = 30000, enabled = true }: UsePollOptions = {}) {
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      // Handle Flask API response format
      if (result.success && result.trades) {
        setData(result.trades);
      } else {
        setData([]);
        setError(result.message || 'No trades available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    if (!enabled || !url) return;

    // Initial fetch
    fetchData();

    // Set up polling
    const intervalId = setInterval(fetchData, interval);
    return () => clearInterval(intervalId);
  }, [fetchData, interval, enabled]);

  return { data, loading, error, refetch: fetchData };
}
