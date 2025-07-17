// Bundle Analyzer Utility
export class BundleAnalyzer {
  private static bundleSizes: Map<string, number> = new Map();
  private static loadTimes: Map<string, number> = new Map();

  /**
   * Track component load time
   */
  static trackComponentLoad(componentName: string, loadTime: number) {
    this.loadTimes.set(componentName, loadTime);
    console.log(`📦 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Track bundle size (estimated)
   */
  static trackBundleSize(componentName: string, size: number) {
    this.bundleSizes.set(componentName, size);
  }

  /**
   * Get bundle statistics
   */
  static getBundleStats() {
    const stats = {
      totalComponents: this.loadTimes.size,
      averageLoadTime: 0,
      slowestComponent: '',
      slowestLoadTime: 0,
      totalBundleSize: 0
    };

    if (this.loadTimes.size > 0) {
      const loadTimes = Array.from(this.loadTimes.values());
      stats.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      
      const slowest = Array.from(this.loadTimes.entries())
        .reduce((max, [name, time]) => time > max.time ? { name, time } : max, 
          { name: '', time: 0 });
      stats.slowestComponent = slowest.name;
      stats.slowestLoadTime = slowest.time;
    }

    if (this.bundleSizes.size > 0) {
      stats.totalBundleSize = Array.from(this.bundleSizes.values())
        .reduce((a, b) => a + b, 0);
    }

    return stats;
  }

  /**
   * Generate bundle report
   */
  static generateReport() {
    const stats = this.getBundleStats();
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      components: Array.from(this.loadTimes.entries()).map(([name, time]) => ({
        name,
        loadTime: time,
        bundleSize: this.bundleSizes.get(name) || 0
      })),
      recommendations: this.generateRecommendations(stats)
    };

    console.log('📊 Bundle Analysis Report:', report);
    return report;
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(stats: any) {
    const recommendations = [];

    if (stats.averageLoadTime > 1000) {
      recommendations.push('Consider implementing more aggressive code splitting');
    }

    if (stats.slowestLoadTime > 2000) {
      recommendations.push(`Optimize ${stats.slowestComponent} - it's taking too long to load`);
    }

    if (stats.totalBundleSize > 500000) { // 500KB
      recommendations.push('Bundle size is large - consider tree shaking and dead code elimination');
    }

    if (stats.totalComponents > 10) {
      recommendations.push('Consider grouping related components into shared chunks');
    }

    return recommendations;
  }

  /**
   * Clear all tracking data
   */
  static clear() {
    this.bundleSizes.clear();
    this.loadTimes.clear();
  }
}

// Performance monitoring for lazy components
export const trackLazyComponent = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const loadTime = performance.now() - startTime;
    BundleAnalyzer.trackComponentLoad(componentName, loadTime);
  };
}; 