/**
 * Cache Refresh Button Component - Shows cache status and refresh functionality
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface CacheStats {
  totalEntries: number;
  staleEntries: string[];
  freshEntries: string[];
  cacheSize: string;
}

interface CacheRefreshButtonProps {
  onRefresh: () => Promise<boolean>;
  onClearAll?: () => void;
  hasStaleData?: boolean;
  isRefreshing?: boolean;
  lastRefreshTime?: number;
  cacheStats?: CacheStats;
  compact?: boolean;
  /** Optional short label to show next to the icon (used in compact mode) */
  label?: string;
}

export const CacheRefreshButton: React.FC<CacheRefreshButtonProps> = ({
  onRefresh,
  onClearAll,
  hasStaleData = false,
  isRefreshing = false,
  lastRefreshTime,
  cacheStats,
  compact = false,
  label,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRefresh = async () => {
    const success = await onRefresh();
    if (success) {
      toast.success('Data refreshed successfully');
    } else {
      toast.error('Failed to refresh data');
    }
  };

  const getRefreshTimeAgo = (): string => {
    if (!lastRefreshTime) return 'Never';
    const diff = Date.now() - lastRefreshTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  if (compact) {
    return (
      <Button
        variant={hasStaleData ? 'outline' : 'ghost'}
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={hasStaleData ? 'border-amber-500 text-amber-600' : ''}
        title={hasStaleData ? 'Cache contains stale data - Click to refresh' : 'Refresh all data'}
        aria-label={label ?? (hasStaleData ? 'Refresh (stale data)' : 'Refresh')}
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${
            hasStaleData ? 'text-amber-600' : ''
          }`}
        />
        {/* optional short label next to icon for compact mode */}
        {label && <span className="ml-2 text-xs font-medium leading-none">{label}</span>}
        {!isRefreshing && hasStaleData && (
          <AlertCircle className="h-3 w-3 ml-1 text-amber-600" />
        )}
      </Button>
    );
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={hasStaleData ? 'destructive' : 'outline'}
            size="sm"
            className={`gap-2 ${
              hasStaleData ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' : ''
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {hasStaleData && (
              <>
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Stale Data Detected</span>
              </>
            )}
            {!hasStaleData && <span className="text-xs">Refresh Cache</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h4 className="font-semibold text-sm text-foreground">Cache Status</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {hasStaleData ? (
                  <span className="text-amber-600 font-medium">
                    ⚠️ Some data is stale and needs refreshing
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">
                    ✓ All data is fresh
                  </span>
                )}
              </p>
            </div>

            {/* Stats */}
            {cacheStats && (
              <div className="bg-muted/50 rounded p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Cached Items:</span>
                  <span className="font-semibold">{cacheStats.totalEntries}</span>
                </div>
                {cacheStats.freshEntries.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Fresh:</span>
                    <span className="font-semibold text-green-600">{cacheStats.freshEntries.length}</span>
                  </div>
                )}
                {cacheStats.staleEntries.length > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600">Stale:</span>
                    <span className="font-semibold text-amber-600">{cacheStats.staleEntries.length}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cache Size:</span>
                  <span className="font-semibold">{cacheStats.cacheSize}</span>
                </div>
                {lastRefreshTime && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last Refresh:</span>
                    <span className="font-semibold">{getRefreshTimeAgo()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
              </Button>

              {onClearAll && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => setShowConfirm(true)}
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Click "Refresh Now" to clear stale data and fetch fresh data from the server.
                This helps optimize Firebase read costs by avoiding unnecessary fetches.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear All Confirmation Dialog */}
      {onClearAll && (
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Cache?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all cached data and force a complete refresh on next load.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onClearAll();
                  setShowConfirm(false);
                  toast.success('Cache cleared completely');
                }}
                className="bg-destructive text-destructive-foreground"
              >
                Clear Cache
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
