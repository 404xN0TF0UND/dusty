import { FirestoreService } from './firestoreService';
import { DataArchivingService } from './dataArchivingService';

export class DatabaseOptimizationService {
  private static instance: DatabaseOptimizationService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private queryStats: Map<string, { count: number; avgTime: number; lastUsed: number }> = new Map();

  static getInstance(): DatabaseOptimizationService {
    if (!DatabaseOptimizationService.instance) {
      DatabaseOptimizationService.instance = new DatabaseOptimizationService();
    }
    return DatabaseOptimizationService.instance;
  }

  // ===== CACHING =====

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data with TTL
   */
  private setCachedData(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, cached] of entries) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // ===== QUERY OPTIMIZATION =====

  /**
   * Optimized chore query with caching
   */
  async getChoresOptimized(options: {
    assigneeId?: string;
    status?: 'pending' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    limit?: number;
    useCache?: boolean;
  } = {}): Promise<{ chores: any[]; lastDoc?: any; fromCache: boolean }> {
    const { useCache = true, ...queryOptions } = options;
    
    // Generate cache key
    const cacheKey = `chores:${JSON.stringify(queryOptions)}`;
    
    // Try cache first
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.updateQueryStats(cacheKey, 0); // Cache hit
        return { ...cached, fromCache: true };
      }
    }

    // Execute query
    const startTime = Date.now();
    const result = await FirestoreService.getInstance().getChores(queryOptions);
    const queryTime = Date.now() - startTime;

    // Update stats
    this.updateQueryStats(cacheKey, queryTime);

    // Cache result (only for successful queries)
    if (useCache && result.chores.length > 0) {
      this.setCachedData(cacheKey, result, 2 * 60 * 1000); // 2 minutes TTL
    }

    return { ...result, fromCache: false };
  }

  /**
   * Update query performance statistics
   */
  private updateQueryStats(queryKey: string, queryTime: number): void {
    const stats = this.queryStats.get(queryKey) || { count: 0, avgTime: 0, lastUsed: 0 };
    
    stats.count++;
    stats.avgTime = (stats.avgTime * (stats.count - 1) + queryTime) / stats.count;
    stats.lastUsed = Date.now();
    
    this.queryStats.set(queryKey, stats);
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Optimized batch operations with error handling and retry logic
   */
  async batchOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear related cache entries
        this.clearRelatedCache();
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Batch operation attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Batch operation failed after all retries');
  }

  /**
   * Clear cache entries related to chores
   */
  private clearRelatedCache(): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.startsWith('chores:')) {
        this.cache.delete(key);
      }
    }
  }

  // ===== DATA ARCHIVING =====

  /**
   * Schedule automatic data archiving
   */
  async scheduleDataArchiving(): Promise<void> {
    try {
      await DataArchivingService.getInstance().scheduleArchiving();
      console.log('Data archiving scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule data archiving:', error);
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<any> {
    return await DataArchivingService.getInstance().getArchiveStats();
  }

  // ===== PERFORMANCE MONITORING =====

  /**
   * Get database performance statistics
   */
  getPerformanceStats(): {
    cacheSize: number;
    cacheHitRate: number;
    queryStats: Map<string, any>;
    memoryUsage: number;
  } {
    const queryStatsValues = Array.from(this.queryStats.values());
    const totalQueries = queryStatsValues.reduce((sum, stat) => sum + stat.count, 0);
    const cacheHits = queryStatsValues.filter(stat => stat.avgTime === 0).length;
    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;

    return {
      cacheSize: this.cache.size,
      cacheHitRate,
      queryStats: new Map(this.queryStats),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage estimation
   */
  private getMemoryUsage(): number {
    let totalSize = 0;
    
    // Estimate cache size
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, value] of cacheEntries) {
      totalSize += key.length;
      totalSize += JSON.stringify(value.data).length;
    }
    
    // Estimate query stats size
    const queryStatsEntries = Array.from(this.queryStats.entries());
    for (const [key, value] of queryStatsEntries) {
      totalSize += key.length;
      totalSize += JSON.stringify(value).length;
    }
    
    return totalSize;
  }

  /**
   * Clear all cache and stats
   */
  clearAll(): void {
    this.cache.clear();
    this.queryStats.clear();
    console.log('Database optimization cache and stats cleared');
  }

  /**
   * Optimize database performance
   */
  async optimize(): Promise<{
    cacheCleared: number;
    archiveStats: any;
    performanceStats: any;
  }> {
    // Clear expired cache
    const initialCacheSize = this.cache.size;
    this.clearExpiredCache();
    const cacheCleared = initialCacheSize - this.cache.size;

    // Get archive statistics
    const archiveStats = await this.getArchiveStats();

    // Get performance statistics
    const performanceStats = this.getPerformanceStats();

    return {
      cacheCleared,
      archiveStats,
      performanceStats
    };
  }

  /**
   * Initialize the optimization service
   */
  async init(): Promise<void> {
    // Set up periodic cache cleanup
    setInterval(() => {
      this.clearExpiredCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Set up periodic archiving
    setInterval(() => {
      this.scheduleDataArchiving();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    console.log('Database optimization service initialized');
  }
} 