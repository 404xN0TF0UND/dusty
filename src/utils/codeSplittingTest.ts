// Code Splitting Test Utility
export class CodeSplittingTest {
  private static loadedComponents: Set<string> = new Set();
  private static testResults: Map<string, boolean> = new Map();

  /**
   * Test if a component can be dynamically imported
   */
  static async testComponentLoad(componentName: string): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Test dynamic import
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
          throw new Error(`Unknown component: ${componentName}`);
      }
      
      const loadTime = performance.now() - startTime;
      this.loadedComponents.add(componentName);
      this.testResults.set(componentName, true);
      
      console.log(`✅ ${componentName} loaded successfully in ${loadTime.toFixed(2)}ms`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load ${componentName}:`, error);
      this.testResults.set(componentName, false);
      return false;
    }
  }

  /**
   * Test all lazy components
   */
  static async testAllComponents(): Promise<{ success: boolean; results: any }> {
    const components = [
      'ChoreStats',
      'ChoreTemplates', 
      'PerformanceDashboard',
      'AchievementDisplay',
      'DustyChat',
      'NotificationSettings'
    ];

    const results = await Promise.allSettled(
      components.map(comp => this.testComponentLoad(comp))
    );

    const testResults = components.map((comp, index) => ({
      component: comp,
      success: results[index].status === 'fulfilled' && (results[index] as PromiseFulfilledResult<boolean>).value,
      loaded: this.loadedComponents.has(comp)
    }));

    const success = testResults.every(result => result.success);
    
    console.log('📊 Code Splitting Test Results:', {
      success,
      totalComponents: components.length,
      loadedComponents: this.loadedComponents.size,
      results: testResults
    });

    return { success, results: testResults };
  }

  /**
   * Get test results
   */
  static getTestResults() {
    return {
      loadedComponents: Array.from(this.loadedComponents),
      testResults: Object.fromEntries(this.testResults),
      totalLoaded: this.loadedComponents.size,
      totalTested: this.testResults.size
    };
  }

  /**
   * Clear test data
   */
  static clear() {
    this.loadedComponents.clear();
    this.testResults.clear();
  }

  /**
   * Run performance test
   */
  static async runPerformanceTest() {
    console.log('🚀 Starting Code Splitting Performance Test...');
    
    const startTime = performance.now();
    const { success, results } = await this.testAllComponents();
    const totalTime = performance.now() - startTime;
    
    const report = {
      success,
      totalTime: totalTime.toFixed(2),
      averageTime: (totalTime / results.length).toFixed(2),
      results,
      recommendations: this.generateRecommendations(results)
    };
    
    console.log('📊 Performance Test Report:', report);
    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  private static generateRecommendations(results: any[]) {
    const recommendations = [];
    
    const failedComponents = results.filter(r => !r.success);
    if (failedComponents.length > 0) {
      recommendations.push(`Fix failed component loads: ${failedComponents.map(r => r.component).join(', ')}`);
    }
    
    const slowComponents = results.filter(r => r.success && r.loadTime > 1000);
    if (slowComponents.length > 0) {
      recommendations.push(`Optimize slow components: ${slowComponents.map(r => r.component).join(', ')}`);
    }
    
    if (results.length < 7) {
      recommendations.push('Test all lazy components to ensure complete coverage');
    }
    
    return recommendations;
  }
} 