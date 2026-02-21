# Cache Optimization & Smart Refresh Guide

## Overview
This implementation adds intelligent caching with stale data detection to dramatically reduce Firebase Firestore reads (from ~2.2K reads/hour to projected ~200-300 reads/hour).

## Components Created

### 1. **Cache Manager** (`src/lib/cacheManager.ts`)
Low-level caching utility that:
- Stores data in `localStorage` with timestamps
- Tracks data freshness with TTL (Time To Live)
- Detects stale vs. fresh data
- Provides cache statistics

**Key Features:**
- Configurable TTL levels (CRITICAL, HIGH, MEDIUM, LOW)
- Age tracking (shows "5m ago", "2h ago", etc.)
- Cache size monitoring
- Selective clearing of stale entries

### 2. **Cache Refresh Hook** (`src/hooks/useCacheRefresh.ts`)
React hook for managing cache lifecycle:
- `useCacheRefresh()` - Main hook for cache operations
- `useDataFreshness()` - Track freshness of specific data
- Integrates with React Query for automatic invalidation

**Usage:**
```typescript
const {
  isRefreshing,
  refresh,
  hasStaleData,
  stats,
  lastRefreshTime,
  clearAll,
} = useCacheRefresh(['departments', 'faculty', 'sessions']);
```

### 3. **Cache Refresh Button** (`src/components/ui/CacheRefreshButton.tsx`)
Visual UI component showing:
- Cache status (fresh/stale indicators)
- Cached items count
- Cache size
- Last refresh time
- Stale entries count
- Manual refresh & clear actions

**Two Modes:**
- **Compact**: Icon-only button (used in headers)
- **Full**: Popover with detailed stats and actions

## Implementation in Dashboard

### Dashboard Page (`src/pages/admin/AdminDashboard.tsx`)
- Added cache refresh hook initialization
- Created `handleRefresh()` that clears stale cache + invalidates React Query
- Enhanced stale time constants (5-30 minutes instead of 1-10 minutes)

### Dashboard Overview (`src/components/admin/DashboardOverview.tsx`)
- Added refresh button in header
- Shows cache status above filters
- Compact mode to save space

### Session Management (`src/components/admin/SessionManagement.tsx`)
- Added refresh button next to "Create Session"
- Compact mode button among the controls
- Matches Dashboard UX

## How It Works

### Data Flow
```
Initial Load
    ↓
Cache Manager (localStorage)
    ↓
React Query (in-memory cache)
    ↓
Firebase Firestore (only if needed)
```

### Refresh Process
When user clicks "Refresh Now":
1. Clear old cache entries (stale)
2. Invalidate React Query cache keys
3. Trigger automatic refetch from Firebase
4. Update UI with fresh data
5. Reset cache metadata

### Stale Data Detection
Data is marked stale based on TTL:
- **CRITICAL** (1 min): Active sessions, current submissions
- **HIGH** (5 min): Faculty, departments, questions
- **MEDIUM** (10 min): Statistics, aggregated data
- **LOW** (30 min): Academic config, static data

## Firebase Read Reduction

### Before (2.2K reads/hour)
- Every component mounted = full data fetch
- No client-side cache
- Revalidation every 1-2 minutes

### After (Projected 200-300 reads/hour)
- Initial load: 1-2 reads
- Stale check: 0 reads (localStorage only)
- Automatic refresh every 5-30 min: 1-2 reads
- Manual refresh: 1-2 reads only if clicked
- **Savings: ~85-90% reduction**

## Usage for End Users

### Dashboard Admin
1. **View Cache Status**: Compact icon in header shows if data is fresh
2. **Stale Data Warning**: Yellow indicator if any cache is old
3. **Manual Refresh**: Click button to force fresh data from Firebase
4. **See Details**: Click button to see cache stats (size, age, items)

### Feedback Sessions
1. **Quick Refresh**: Icon button next to "Create Session"
2. **Optimized Loading**: Sessions cached for 5 minutes
3. **Clear All**: Rare operation to completely reset cache

## Cost Impact Example

Assuming:
- 10 college admins
- 8 hours active daily
- Each viewing dashboard every 5 minutes

**Before:** 10 × 96 requests/day × 2.2K reads = ~2.1M reads/month
- Cost: ~$0.84/month per 1M reads = **$1.76/month**

**After:** 10 × 8 (manual refreshes only) × 2 reads = ~160 reads/month  
- Cost: **$0.00 (first 50K reads free)**

**Monthly Savings: $1.76**
**Annual Savings: $21.12 (if scaled to 100 users = $211)**

## Configuration Options

### Adjust Stale Times (in `useCollegeData.ts`)
```typescript
const STALE_TIME = {
    STATIC: 30 * 60 * 1000,      // Increase for less frequent refreshes
    SEMI_STATIC: 15 * 60 * 1000,
    DYNAMIC: 5 * 60 * 1000,
    STATS: 10 * 60 * 1000,
};
```

### Clear Cache Programmatically
```typescript
import { CacheManager } from '@/lib/cacheManager';

// Clear all cache
CacheManager.clearAll();

// Clear specific entry
CacheManager.clear('departments');

// Clear only stale entries
CacheManager.clearStale();

// Get stats
const stats = CacheManager.getStats();
console.log(stats);
// {
//   totalEntries: 5,
//   staleEntries: ['submissions'],
//   freshEntries: ['departments', 'faculty', ...],
//   cacheSize: '2.3 KB'
// }
```

## Monitoring & Debugging

### Check Cache via Browser Console
```javascript
// Check specific data age
localStorage.getItem('faculty_insights_cache_departments')

// Get all cache stats
CacheManager.getStats() // if imported

// Monitor cache hits
// Open DevTools → Application → Local Storage
// Look for keys starting with 'faculty_insights_cache_'
```

### Performance Metrics
Monitor in Firebase Console:
- **Reads**: Should drop after implementation
- **Writes**: Minimal impact
- **Peak Subscriptions**: More stable (fewer refetches)

### Browser DevTools
1. Open **Network Tab** while using dashboard
2. Filter for `firestore` requests
3. Should see 85-90% fewer requests
4. Manual refresh should only show 1-2 requests

## Best Practices

### For Admins
✅ **Do:**
- Refresh when you see stale data warning
- Use manual refresh for critical decisions
- Check "Last Refresh" time in stats

❌ **Don't:**
- Mash refresh button (causes unnecessary Firebase reads)
- Clear all cache frequently (defeats purpose)
- Expect real-time data (5+ minute delay is normal)

### For Developers
✅ **Do:**
- Check cache stats in development
- Monitor Firebase metrics
- Adjust STALE_TIME based on data importance

❌ **Don't:**
- Set STALE_TIME to 1 minute or less (defeats optimization)
- Bypass cache manager for every component
- Forget to add new cache keys to `useCacheRefresh` call

## Troubleshooting

### Issue: Button shows "Never" for last refresh
**Solution**: First time using the app - refresh once to initialize timestamp

### Issue: Cache says data is stale but looks correct
**Solution**: Visual stale is OK - click refresh only if you suspect data changed

### Issue: Too many/too few Firebase reads
**Solution**: Adjust STALE_TIME constants in `useCollegeData.ts`

### Issue: LocalStorage quota exceeded
**Solution**: Data is cleaned when stale - shouldn't happen, but can clear manually:
```javascript
CacheManager.clearAll()
```

## Future Enhancements

1. **Service Worker**: Offline caching with background sync
2. **Compression**: Reduce cache size with LZ-string compression  
3. **Smart Refresh**: Detect network calls and auto-refresh if failed
4. **User Preferences**: Let admins set refresh intervals
5. **Analytics**: Track cache hit rate and optimization effectiveness

---

**Questions?** Check component JSDoc comments or review cache manager tests.
