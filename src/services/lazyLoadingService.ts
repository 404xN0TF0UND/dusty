import { BundleAnalyzer } from '../utils/bundleAnalyzer';

export class LazyLoadingService {
  private static componentLoadTimes: Map<string, number[]> = new Map();
  private static preloadQueue: Set<string> = new Set();
  private static isPreloading = false;

  /**
   * Track component load performance
   */
  static trackComponentLoad(componentName: string, loadTime: number) {
    if (!this.componentLoadTimes.has(componentName)) {
      this.componentLoadTimes.set(componentName, []);
    }
    
    const times = this.componentLoadTimes.get(componentName)!;
    times.push(loadTime);
    
    // Keep only last 10 measurements
    if (times.length > 10) {
      times.shift();
    }
    
    // Log performance metrics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`📦 ${componentName}: ${loadTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`);
    
    // Alert if load time is too slow
    if (loadTime > 2000) {
      console.warn(`⚠️ ${componentName} is loading slowly: ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Preload component in background
   */
  static async preloadComponent(componentName: string): Promise<void> {
    if (this.preloadQueue.has(componentName)) {
      return; // Already queued
    }

    this.preloadQueue.add(componentName);
    
    try {
      const startTime = performance.now();
      
      // Dynamic import based on component name
      switch (componentName) {
        case 'ChoreStats':
          await import('../components/ChoreStats');
          break;
        case 'ChoreTemplates':
          await import('../components/ChoreTemplates');
          break;
        case 'PerformanceDashboard':
          await import('../components/PerformanceDashboard');
          break;
        case 'AchievementDisplay':
          await import('../components/AchievementDisplay');
          break;
        case 'DustyChat':
          await import('../components/DustyChat');
          break;
        case 'NotificationSettings':
          await import('../components/NotificationSettings');
          break;
        default:
          console.warn(`Unknown component for preloading: ${componentName}`);
          return;
      }
      
      const loadTime = performance.now() - startTime;
      this.trackComponentLoad(componentName, loadTime);
      
      console.log(`✅ Preloaded ${componentName} in ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      console.error(`❌ Failed to preload ${componentName}:`, error);
    } finally {
      this.preloadQueue.delete(componentName);
    }
  }

  /**
   * Preload multiple components
   */
  static async preloadComponents(componentNames: string[]): Promise<void> {
    if (this.isPreloading) {
      return; // Already preloading
    }

    this.isPreloading = true;
    
    try {
      const promises = componentNames.map(name => this.preloadComponent(name));
      await Promise.all(promises);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Get component performance statistics
   */
  static getComponentStats(componentName: string) {
    const times = this.componentLoadTimes.get(componentName);
    if (!times || times.length === 0) {
      return null;
    }

    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    
    return {
      componentName,
      loadCount: times.length,
      averageLoadTime: avg,
      minLoadTime: sorted[0],
      maxLoadTime: sorted[sorted.length - 1],
      medianLoadTime: sorted[Math.floor(sorted.length / 2)]
    };
  }

  /**
   * Get all component statistics
   */
  static getAllComponentStats() {
    const stats: any = {};
    
    const componentNames = Array.from(this.componentLoadTimes.keys());
    for (const componentName of componentNames) {
      const componentStats = this.getComponentStats(componentName);
      if (componentStats) {
        stats[componentName] = componentStats;
      }
    }
    
    return stats;
  }

  /**
   * Generate performance report
   */
  static generateReport() {
    const componentStats = this.getAllComponentStats();
    const bundleStats = BundleAnalyzer.getBundleStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      componentStats,
      bundleStats,
      recommendations: this.generateRecommendations(componentStats, bundleStats)
    };
    
    console.log('📊 Lazy Loading Performance Report:', report);
    return report;
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(componentStats: any, bundleStats: any) {
    const recommendations = [];
    
    // Check for slow components
    for (const [componentName, stats] of Object.entries(componentStats)) {
      const componentStat = stats as any;
      if (componentStat.averageLoadTime > 1000) {
        recommendations.push(`Optimize ${componentName} - average load time is ${componentStat.averageLoadTime.toFixed(2)}ms`);
      }
    }
    
    // Check bundle size
    if (bundleStats.totalBundleSize > 500000) {
      recommendations.push('Consider code splitting to reduce bundle size');
    }
    
    // Check for components that are loaded frequently
    const frequentlyLoaded = Object.entries(componentStats)
      .filter(([, stats]: [string, any]) => stats.loadCount > 5)
      .map(([name]) => name);
    
    if (frequentlyLoaded.length > 0) {
      recommendations.push(`Consider eager loading for frequently used components: ${frequentlyLoaded.join(', ')}`);
    }
    
    return recommendations;
  }

  /**
   * Clear all tracking data
   */
  static clear() {
    this.componentLoadTimes.clear();
    this.preloadQueue.clear();
    this.isPreloading = false;
  }
} 