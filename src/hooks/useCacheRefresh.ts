/**
 * React hook for cache management and fresh data detection
 */

import { useCallback, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CacheManager, getCacheStatus, CACHE_TTL } from '@/lib/cacheManager';

interface CacheStatus {
  isFresh: boolean;
  isStale: boolean;
  age: number | null;
  ageFormatted: string;
}

interface CacheStats {
  totalEntries: number;
  staleEntries: string[];
  freshEntries: string[];
  cacheSize: string;
}

export function useCacheRefresh(cacheKeys: string[] = []) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<Record<string, CacheStatus>>({});
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Update cache status
  useEffect(() => {
    const status: Record<string, CacheStatus> = {};
    cacheKeys.forEach(key => {
      status[key] = getCacheStatus(key);
    });
    setCacheStatus(status);
  }, [cacheKeys]);

  // Check if any cache is stale
  const hasStaleData = Object.values(cacheStatus).some(
    (status: CacheStatus) => status.isStale
  );

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Clear stale cache
      CacheManager.clearStale();

      // Invalidate all React Query caches
      await queryClient.invalidateQueries();

      // Update status
      const newStatus: Record<string, CacheStatus> = {};
      cacheKeys.forEach(key => {
        newStatus[key] = getCacheStatus(key);
      });
      setCacheStatus(newStatus);
      setLastRefreshTime(Date.now());

      return true;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, cacheKeys]);

  // Clear all cache completely
  const clearAll = useCallback(() => {
    CacheManager.clearAll();
    queryClient.clear();
    setCacheStatus({});
    setLastRefreshTime(Date.now());
  }, [queryClient]);

  // Get cache stats
  const stats: CacheStats = CacheManager.getStats();

  return {
    isRefreshing,
    refresh,
    clearAll,
    hasStaleData,
    cacheStatus,
    stats,
    lastRefreshTime,
  };
}

/**
 * Hook to track data freshness for a specific data set
 */
export function useDataFreshness(key: string, ttl: number = CACHE_TTL.HIGH) {
  const [freshness, setFreshness] = useState<CacheStatus>(getCacheStatus(key));

  useEffect(() => {
    setFreshness(getCacheStatus(key));

    // Update freshness status periodically
    const interval = setInterval(() => {
      setFreshness(getCacheStatus(key));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [key]);

  return {
    isFresh: freshness.isFresh,
    isStale: freshness.isStale,
    ageFormatted: freshness.ageFormatted,
    age: freshness.age,
  };
}
