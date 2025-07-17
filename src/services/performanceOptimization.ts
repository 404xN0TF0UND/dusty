import { Chore, User } from '../types';

export class PerformanceOptimizationService {
  private static choreCache = new Map<string, any>();
  private static userCache = new Map<string, any>();
  private static calculationCache = new Map<string, any>();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Debounce function to limit how often a function can be called
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function to limit execution rate
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Memoize expensive calculations with cache invalidation
   */
  static memoize<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    dependencies: any[] = []
  ): ReturnType<T> {
    const cacheKey = `${key}_${JSON.stringify(dependencies)}`;
    const cached = this.calculationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.value;
    }

    const result = fn();
    this.calculationCache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Optimize chore filtering with memoization
   */
  static getFilteredChores(
    chores: Chore[],
    filters: any,
    currentUser: User
  ): Chore[] {
    return this.memoize(
      'filtered_chores',
      () => {
        const now = new Date();
        
        return chores.filter(chore => {
          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const titleMatch = chore.title.toLowerCase().includes(searchLower);
            const descriptionMatch = chore.description?.toLowerCase().includes(searchLower) || false;
            if (!titleMatch && !descriptionMatch) return false;
          }
          
          // Status filter
          if (filters.status) {
            const isCompleted = !!chore.completedAt;
            const isOverdue = chore.dueDate && !chore.completedAt && now > chore.dueDate;
            
            switch (filters.status) {
              case 'completed':
                if (!isCompleted) return false;
                break;
              case 'pending':
                if (isCompleted || isOverdue) return false;
                break;
              case 'overdue':
                if (!isOverdue) return false;
                break;
            }
          }
          
          // Priority filter
          if (filters.priority && chore.priority !== filters.priority) {
            return false;
          }
          
          // Category filter
          if (filters.category && chore.category !== filters.category) {
            return false;
          }
          
          // Role-based filtering
          if (currentUser.role !== 'admin') {
            if (chore.assigneeId !== currentUser.id && chore.assigneeId !== '') {
              return false;
            }
          }
          
          return true;
        });
      },
      [chores, filters, currentUser.id, currentUser.role]
    );
  }

  /**
   * Optimize achievement calculations
   */
  static getAchievementProgress(
    userId: string,
    chores: Chore[]
  ): any {
    return this.memoize(
      'achievement_progress',
      () => {
        const userChores = chores.filter(chore => 
          chore.assigneeId === userId || !chore.assigneeId
        );
        
        const completedChores = userChores.filter(chore => chore.completedAt);
        const totalChoresCompleted = completedChores.length;
        
        // Calculate streaks
        const { currentStreak, longestStreak } = this.calculateStreaks(completedChores);
        
        // Calculate unique categories
        const uniqueCategories = new Set(completedChores.map(chore => chore.category)).size;
        
        return {
          totalChoresCompleted,
          currentStreak,
          longestStreak,
          uniqueCategoriesCompleted: uniqueCategories
        };
      },
      [userId, chores]
    );
  }

  /**
   * Calculate streaks with optimization
   */
  private static calculateStreaks(completedChores: Chore[]): { currentStreak: number; longestStreak: number } {
    if (completedChores.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const sortedChores = completedChores
      .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate current streak
    for (let i = sortedChores.length - 1; i >= 0; i--) {
      const choreDate = new Date(sortedChores[i].completedAt!);
      choreDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - choreDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else if (daysDiff === currentStreak + 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    let lastDate: Date | null = null;
    for (const chore of sortedChores) {
      const choreDate = new Date(chore.completedAt!);
      choreDate.setHours(0, 0, 0, 0);
      
      if (lastDate) {
        const daysDiff = Math.floor((choreDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = choreDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    
    // Clear calculation cache
    this.calculationCache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        this.calculationCache.delete(key);
      }
    });
    
    // Clear chore cache
    this.choreCache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        this.choreCache.delete(key);
      }
    });
    
    // Clear user cache
    this.userCache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        this.userCache.delete(key);
      }
    });
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    this.calculationCache.clear();
    this.choreCache.clear();
    this.userCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): any {
    return {
      calculationCacheSize: this.calculationCache.size,
      choreCacheSize: this.choreCache.size,
      userCacheSize: this.userCache.size,
      totalCacheSize: this.calculationCache.size + this.choreCache.size + this.userCache.size
    };
  }
} 