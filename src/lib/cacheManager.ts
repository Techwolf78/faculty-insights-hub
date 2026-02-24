/**
 * Cache Manager - Optimizes Firestore reads with intelligent caching
 * Tracks data freshness and provides stale data detection
 */

export interface CacheEntry {
  timestamp: number;
  expiresAt: number;
  isStale: boolean;
}

export interface CacheMetadata {
  lastFetch: number;
  nextAllowedFetch: number;
  staleSince?: number;
}

const CACHE_PREFIX = 'faculty_insights_cache_';
const METADATA_KEY = 'cache_metadata';

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  CRITICAL: 1 * 60 * 1000,      // 1 minute - sessions, active submissions
  HIGH: 5 * 60 * 1000,          // 5 minutes - faculty, departments, questions
  MEDIUM: 10 * 60 * 1000,       // 10 minutes - stats, aggregated data
  LOW: 30 * 60 * 1000,          // 30 minutes - academic config, static data
};

// Minimum fetch interval to prevent excessive reads
export const MIN_FETCH_INTERVAL = {
  CRITICAL: 30 * 1000,           // 30 seconds
  HIGH: 2 * 60 * 1000,           // 2 minutes
  MEDIUM: 5 * 60 * 1000,         // 5 minutes
  LOW: 15 * 60 * 1000,           // 15 minutes
};

/**
 * CacheManager class - handles all caching operations
 */
export class CacheManager {
  /**
   * Get cached data with freshness info
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getCached(key: string): { data: any; isFresh: boolean; age: number } | null {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (!stored) return null;

      const { data, timestamp, expiresAt } = JSON.parse(stored);
      const now = Date.now();
      const age = now - timestamp;
      const isFresh = now < expiresAt;

      return { data, isFresh, age };
    } catch (error) {
      console.error(`Error retrieving cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static setCached(key: string, data: any, ttl: number = CACHE_TTL.HIGH): void {
    try {
      const timestamp = Date.now();
      const expiresAt = timestamp + ttl;
      const payload = { data, timestamp, expiresAt };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));

      // Update metadata
      this.updateMetadata(key, timestamp, timestamp + ttl);
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  }

  /**
   * Check if data is stale but still cached
   */
  static isStale(key: string): boolean {
    const cached = this.getCached(key);
    return cached ? !cached.isFresh : false;
  }

  /**
   * Get cache age in seconds
   */
  static getCacheAge(key: string): number | null {
    const cached = this.getCached(key);
    return cached ? Math.floor(cached.age / 1000) : null;
  }

  /**
   * Clear all cache
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(CACHE_PREFIX + METADATA_KEY);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear specific cache entry
   */
  static clear(key: string): void {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error(`Error clearing cache for ${key}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    totalEntries: number;
    staleEntries: string[];
    freshEntries: string[];
    cacheSize: string;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_PREFIX + METADATA_KEY);
      
      let totalSize = 0;
      const staleEntries: string[] = [];
      const freshEntries: string[] = [];

      cacheKeys.forEach(fullKey => {
        const key = fullKey.replace(CACHE_PREFIX, '');
        const cached = this.getCached(key);
        
        if (cached) {
          totalSize += (localStorage.getItem(fullKey)?.length || 0);
          if (cached.isFresh) {
            freshEntries.push(key);
          } else {
            staleEntries.push(key);
          }
        }
      });

      return {
        totalEntries: cacheKeys.length,
        staleEntries,
        freshEntries,
        cacheSize: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        staleEntries: [],
        freshEntries: [],
        cacheSize: '0 B',
      };
    }
  }

  /**
   * Update metadata for fetching intervals
   */
  private static updateMetadata(key: string, lastFetch: number, nextAllowedFetch: number): void {
    try {
      const metadata = this.getMetadata();
      metadata[key] = { lastFetch, nextAllowedFetch };
      localStorage.setItem(CACHE_PREFIX + METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  }

  /**
   * Get metadata
   */
  static getMetadata(): Record<string, CacheMetadata> {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + METADATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error retrieving metadata:', error);
      return {};
    }
  }

  /**
   * Check if enough time has passed to allow new fetch
   */
  static canFetch(key: string, minInterval: number): boolean {
    const metadata = this.getMetadata();
    const entry = metadata[key];
    
    if (!entry) return true; // Never fetched before
    
    const now = Date.now();
    return now >= entry.nextAllowedFetch;
  }

  /**
   * Format bytes to human readable size
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Clear stale entries only
   */
  static clearStale(): void {
    try {
      const stats = this.getStats();
      stats.staleEntries.forEach(key => this.clear(key));
      console.log(`Cleared ${stats.staleEntries.length} stale entries`);
    } catch (error) {
      console.error('Error clearing stale cache:', error);
    }
  }
}

/**
 * Hook-friendly cache check utility
 */
export const getCacheStatus = (key: string): {
  isFresh: boolean;
  isStale: boolean;
  age: number | null;
  ageFormatted: string;
} => {
  const cached = CacheManager.getCached(key);
  
  if (!cached) {
    return {
      isFresh: false,
      isStale: false,
      age: null,
      ageFormatted: 'Never fetched',
    };
  }

  const ageSeconds = Math.floor(cached.age / 1000);
  let ageFormatted = '';
  
  if (ageSeconds < 60) {
    ageFormatted = `${ageSeconds}s ago`;
  } else if (ageSeconds < 3600) {
    ageFormatted = `${Math.floor(ageSeconds / 60)}m ago`;
  } else {
    ageFormatted = `${Math.floor(ageSeconds / 3600)}h ago`;
  }

  return {
    isFresh: cached.isFresh,
    isStale: !cached.isFresh,
    age: cached.age,
    ageFormatted,
  };
};
