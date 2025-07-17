export class WebWorkerService {
  private static worker: Worker | null = null;
  private static callbacks: Map<string, (data: any) => void> = new Map();
  private static messageId = 0;
  private static isInitialized = false;

  /**
   * Initialize the web worker
   */
  static init(): void {
    if (typeof Worker !== 'undefined' && !this.isInitialized) {
      try {
        this.worker = new Worker('/performance-worker.js');
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = (error) => {
          console.warn('Worker error:', error);
          this.worker = null;
        };
        this.isInitialized = true;
        console.log('Performance worker initialized');
      } catch (error: any) {
        console.warn('Failed to initialize performance worker:', error);
        this.worker = null;
      }
    }
  }

  /**
   * Handle messages from the worker
   */
  private static handleWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    const callback = this.callbacks.get(type);
    
    if (callback) {
      callback(data);
      this.callbacks.delete(type);
    }
  }

  /**
   * Send message to worker and return a promise
   */
  private static sendMessage(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const messageId = `msg_${this.messageId++}`;
      this.callbacks.set(messageId, resolve);

      try {
        this.worker.postMessage({
          type,
          data,
          messageId
        });
      } catch (error: any) {
        this.callbacks.delete(messageId);
        reject(error);
      }
    });
  }

  /**
   * Calculate achievements using web worker
   */
  static async calculateAchievements(chores: any[], userId: string): Promise<any> {
    try {
      if (this.worker) {
        return await this.sendMessage('calculateAchievements', { chores, userId });
      }
    } catch (error: any) {
      console.warn('Falling back to main thread calculation:', error);
    }
    // Fallback to main thread calculation
    return this.calculateAchievementsFallback(chores, userId);
  }

  /**
   * Calculate stats using web worker
   */
  static async calculateStats(chores: any[], userId: string): Promise<any> {
    try {
      if (this.worker) {
        return await this.sendMessage('calculateStats', { chores, userId });
      }
    } catch (error: any) {
      console.warn('Falling back to main thread calculation:', error);
    }
    // Fallback to main thread calculation
    return this.calculateStatsFallback(chores, userId);
  }

  /**
   * Filter chores using web worker
   */
  static async filterChores(chores: any[], filters: any, currentUser: any): Promise<any[]> {
    try {
      if (this.worker) {
        return await this.sendMessage('filterChores', { chores, filters, currentUser });
      }
    } catch (error: any) {
      console.warn('Falling back to main thread filtering:', error);
    }
    // Fallback to main thread filtering
    return this.filterChoresFallback(chores, filters, currentUser);
  }

  /**
   * Process bulk operations using web worker
   */
  static async processBulkOperations(operations: any[], chores: any[]): Promise<any> {
    try {
      if (this.worker) {
        return await this.sendMessage('processBulkOperations', { operations, chores });
      }
    } catch (error: any) {
      console.warn('Falling back to main thread processing:', error);
    }
    // Fallback to main thread processing
    return this.processBulkOperationsFallback(operations, chores);
  }

  /**
   * Fallback achievement calculation on main thread
   */
  private static calculateAchievementsFallback(chores: any[], userId: string): any {
    const userChores = chores.filter(chore => 
      chore.assigneeId === userId || !chore.assigneeId
    );
    
    const completedChores = userChores.filter(chore => chore.completedAt);
    const totalChoresCompleted = completedChores.length;
    
    // Simple achievement logic
    const achievements = [];
    
    if (totalChoresCompleted >= 10) {
      achievements.push({
        id: 'first_ten',
        title: 'Getting Started',
        description: 'Completed 10 chores',
        icon: '🎯'
      });
    }
    
    if (totalChoresCompleted >= 50) {
      achievements.push({
        id: 'fifty_chores',
        title: 'Dedicated Worker',
        description: 'Completed 50 chores',
        icon: '🏆'
      });
    }
    
    return {
      achievements,
      stats: {
        totalChoresCompleted,
        currentStreak: 0,
        longestStreak: 0,
        uniqueCategoriesCompleted: 0
      }
    };
  }

  /**
   * Fallback stats calculation on main thread
   */
  private static calculateStatsFallback(chores: any[], userId: string): any {
    const userChores = chores.filter(chore => 
      chore.assigneeId === userId || !chore.assigneeId
    );
    
    const totalChores = userChores.length;
    const completedChores = userChores.filter(chore => chore.completedAt);
    const completionRate = totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;
    
    return {
      totalChores,
      completedChores: completedChores.length,
      pendingChores: userChores.length - completedChores.length,
      overdueChores: 0,
      completionRate: Math.round(completionRate),
      priorityBreakdown: {
        high: userChores.filter(chore => chore.priority === 'high').length,
        medium: userChores.filter(chore => chore.priority === 'medium').length,
        low: userChores.filter(chore => chore.priority === 'low').length
      },
      categoryStats: {}
    };
  }

  /**
   * Fallback chore filtering on main thread
   */
  private static filterChoresFallback(chores: any[], filters: any, currentUser: any): any[] {
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
  }

  /**
   * Fallback bulk operations processing on main thread
   */
  private static processBulkOperationsFallback(operations: any[], chores: any[]): any {
    const results = {
      success: [],
      errors: []
    };
    
    for (const operation of operations) {
      try {
        const chore = chores.find((c: any) => c.id === operation.choreId);
        if (!chore) {
          (results.errors as string[]).push(`Chore ${operation.choreId} not found`);
          continue;
        }
        (results.success as string[]).push(`Processed "${chore.title}"`);
      } catch (error: any) {
        (results.errors as string[]).push(`Error processing chore ${operation.choreId}: ${error && error.message ? error.message : String(error)}`);
      }
    }
    
    return results;
  }

  /**
   * Check if worker is available
   */
  static isAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * Terminate the worker
   */
  static terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.callbacks.clear();
      console.log('Performance worker terminated');
    }
  }
} 