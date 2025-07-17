export class PerformanceMonitoringService {
  private static metrics: Map<string, number[]> = new Map();
  private static marks: Map<string, number> = new Map();
  private static observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Start performance monitoring
   */
  static init() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.warn('Long task detected:', entry.duration, 'ms');
            this.recordMetric('long_tasks', entry.duration);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task monitoring not supported');
      }

      // Monitor layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as any;
            if (layoutShift.value > 0.1) {
              console.warn('Layout shift detected:', layoutShift.value);
              this.recordMetric('layout_shifts', layoutShift.value);
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (error) {
        console.warn('Layout shift monitoring not supported');
      }

      // Monitor first input delay
      try {
        const firstInputObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const firstInput = entry as any;
            console.log('First input delay:', firstInput.processingStart - firstInput.startTime, 'ms');
            this.recordMetric('first_input_delay', firstInput.processingStart - firstInput.startTime);
          }
        });
        firstInputObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('first-input', firstInputObserver);
      } catch (error) {
        console.warn('First input monitoring not supported');
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize);
        this.recordMetric('memory_total', memory.totalJSHeapSize);
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
      }, 10000); // Check every 10 seconds
    }

    // Monitor frame rate
    this.monitorFrameRate();
  }

  /**
   * Monitor frame rate
   */
  private static monitorFrameRate() {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric('fps', fps);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  }

  /**
   * Start a performance mark
   */
  static startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End a performance mark and measure duration
   */
  static endMark(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.recordMetric(name, duration);
    this.marks.delete(name);
    
    return duration;
  }

  /**
   * Record a performance metric
   */
  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricArray = this.metrics.get(name)!;
    metricArray.push(value);
    
    // Keep only last 100 values
    if (metricArray.length > 100) {
      metricArray.shift();
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(metricName: string): any {
    const values = this.metrics.get(metricName);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    return {
      count: values.length,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      latest: values[values.length - 1]
    };
  }

  /**
   * Get all performance metrics
   */
  static getAllStats(): any {
    const stats: any = {};
    
    this.metrics.forEach((values, name) => {
      stats[name] = this.getStats(name);
    });
    
    return stats;
  }

  /**
   * Measure function execution time
   */
  static measureFunction<T>(name: string, fn: () => T): T {
    this.startMark(name);
    try {
      const result = fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * Measure async function execution time
   */
  static async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMark(name);
    try {
      const result = await fn();
      this.endMark(name);
      return result;
    } catch (error) {
      this.endMark(name);
      throw error;
    }
  }

  /**
   * Check if performance is degrading
   */
  static checkPerformanceHealth(): any {
    const health: any = {
      warnings: [],
      recommendations: []
    };

    // Check FPS
    const fpsStats = this.getStats('fps');
    if (fpsStats && fpsStats.mean < 30) {
      health.warnings.push('Low frame rate detected');
      health.recommendations.push('Consider reducing animations or optimizing rendering');
    }

    // Check memory usage
    const memoryStats = this.getStats('memory_used');
    if (memoryStats && memoryStats.latest > 50 * 1024 * 1024) { // 50MB
      health.warnings.push('High memory usage detected');
      health.recommendations.push('Consider implementing memory cleanup or virtual scrolling');
    }

    // Check long tasks
    const longTaskStats = this.getStats('long_tasks');
    if (longTaskStats && longTaskStats.count > 5) {
      health.warnings.push('Multiple long tasks detected');
      health.recommendations.push('Consider breaking up heavy computations or using web workers');
    }

    // Check layout shifts
    const layoutShiftStats = this.getStats('layout_shifts');
    if (layoutShiftStats && layoutShiftStats.count > 3) {
      health.warnings.push('Layout shifts detected');
      health.recommendations.push('Consider reserving space for dynamic content');
    }

    return health;
  }

  /**
   * Generate performance report
   */
  static generateReport(): any {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getAllStats(),
      health: this.checkPerformanceHealth(),
      userAgent: navigator.userAgent,
      memory: 'memory' in performance ? (performance as any).memory : null
    };
  }

  /**
   * Clean up performance monitoring
   */
  static cleanup(): void {
    // Disconnect observers
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();

    // Clear metrics
    this.metrics.clear();
    this.marks.clear();
  }
} 