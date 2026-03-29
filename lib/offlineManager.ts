import { getCachedBuildings, getCachedOffices } from './api';
import { clearAllImageCache, getCacheStats, warmBuildingImageCache } from './imageCache';
import { isCacheStale, clearCache } from './cache';
import { BUILDINGS_CACHE_KEY, OFFICES_CACHE_KEY } from './api';

export interface OfflineStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  lastChecked: number;
}

export interface CacheStatus {
  buildings: {
    isCached: boolean;
    isStale: boolean;
    count: number;
  };
  offices: {
    isCached: boolean;
    isStale: boolean;
    count: number;
  };
  images: {
    totalImages: number;
    totalSize: number;
    oldestImage: number | null;
    newestImage: number | null;
  };
}

class OfflineManager {
  private static instance: OfflineManager;
  private statusListeners: ((status: OfflineStatus) => void)[] = [];
  private currentStatus: OfflineStatus = {
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    lastChecked: Date.now(),
  };

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  constructor() {
    // Simple network check on initialization
    this.checkNetworkStatus();
    // Set up periodic network checks
    setInterval(() => this.checkNetworkStatus(), 30000); // Check every 30 seconds
  }

  /**
   * Simple network status check
   */
  private async checkNetworkStatus() {
    try {
      // Simple fetch to check connectivity with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/get', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const newStatus: OfflineStatus = {
        isConnected: true,
        isInternetReachable: response.ok,
        connectionType: 'unknown',
        lastChecked: Date.now(),
      };

      if (JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus)) {
        this.currentStatus = newStatus;
        this.notifyListeners(newStatus);
      }
    } catch (error) {
      const newStatus: OfflineStatus = {
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'none',
        lastChecked: Date.now(),
      };

      if (JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus)) {
        this.currentStatus = newStatus;
        this.notifyListeners(newStatus);
      }
    }
  }

  /**
   * Get current network status
   */
  async getNetworkStatus(): Promise<OfflineStatus> {
    await this.checkNetworkStatus();
    return this.currentStatus;
  }

  /**
   * Subscribe to network status changes
   */
  subscribeToNetworkChanges(listener: (status: OfflineStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    // Immediately call with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: OfflineStatus) {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Get comprehensive cache status
   */
  async getCacheStatus(): Promise<CacheStatus> {
    const [buildings, offices, imageStats] = await Promise.all([
      this.getBuildingsCacheStatus(),
      this.getOfficesCacheStatus(),
      getCacheStats(),
    ]);

    return {
      buildings,
      offices,
      images: imageStats,
    };
  }

  /**
   * Get buildings cache status
   */
  private async getBuildingsCacheStatus() {
    const buildings = await getCachedBuildings();
    const isStale = await isCacheStale(BUILDINGS_CACHE_KEY);

    return {
      isCached: buildings !== null,
      isStale,
      count: buildings?.length || 0,
    };
  }

  /**
   * Get offices cache status
   */
  private async getOfficesCacheStatus() {
    const offices = await getCachedOffices();
    const isStale = await isCacheStale(OFFICES_CACHE_KEY);

    return {
      isCached: offices !== null,
      isStale,
      count: offices?.length || 0,
    };
  }

  /**
   * Warm up caches when online
   */
  async warmCaches(): Promise<void> {
    const status = await this.getNetworkStatus();
    
    if (!status.isConnected || !status.isInternetReachable) {
      console.log('Skipping cache warming - offline');
      return;
    }

    try {
      console.log('Warming up caches...');
      
      // This would typically be called after data is fetched
      // The actual warming happens in the useBuildings hook
      
      console.log('Cache warming completed');
    } catch (error) {
      console.error('Error warming caches:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    try {
      await Promise.all([
        clearCache(BUILDINGS_CACHE_KEY),
        clearCache(OFFICES_CACHE_KEY),
        clearAllImageCache(),
      ]);
      
      console.log('All caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
      throw error;
    }
  }

  /**
   * Check if app is in offline mode
   */
  isOffline(): boolean {
    return !this.currentStatus.isConnected || this.currentStatus.isInternetReachable === false;
  }

  /**
   * Check if cache should be refreshed
   */
  async shouldRefreshCache(): Promise<boolean> {
    const [buildingsStale, officesStale] = await Promise.all([
      isCacheStale(BUILDINGS_CACHE_KEY),
      isCacheStale(OFFICES_CACHE_KEY),
    ]);

    return buildingsStale || officesStale;
  }

  /**
   * Get offline readiness score (0-100)
   */
  async getOfflineReadinessScore(): Promise<number> {
    const cacheStatus = await this.getCacheStatus();
    let score = 0;

    // Buildings cache (40 points)
    if (cacheStatus.buildings.isCached && !cacheStatus.buildings.isStale) {
      score += 40;
    } else if (cacheStatus.buildings.isCached) {
      score += 20;
    }

    // Offices cache (30 points)
    if (cacheStatus.offices.isCached && !cacheStatus.offices.isStale) {
      score += 30;
    } else if (cacheStatus.offices.isCached) {
      score += 15;
    }

    // Images cache (30 points)
    if (cacheStatus.images.totalImages > 0) {
      const imageScore = Math.min(30, (cacheStatus.images.totalImages / 10) * 30);
      score += imageScore;
    }

    return Math.round(score);
  }

  /**
   * Preload critical data for offline use
   */
  async preloadCriticalData(): Promise<void> {
    try {
      const buildings = await getCachedBuildings();
      if (buildings) {
        await warmBuildingImageCache(buildings);
      }
    } catch (error) {
      console.error('Error preloading critical data:', error);
    }
  }
}

export default OfflineManager.getInstance();
