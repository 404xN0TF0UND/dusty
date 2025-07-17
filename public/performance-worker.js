// Performance Worker for heavy computations
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'calculateAchievements':
      const achievements = calculateAchievements(data.chores, data.userId);
      self.postMessage({ type: 'achievementsCalculated', data: achievements });
      break;
      
    case 'calculateStats':
      const stats = calculateStats(data.chores, data.userId);
      self.postMessage({ type: 'statsCalculated', data: stats });
      break;
      
    case 'filterChores':
      const filteredChores = filterChores(data.chores, data.filters, data.currentUser);
      self.postMessage({ type: 'choresFiltered', data: filteredChores });
      break;
      
    case 'processBulkOperations':
      const results = processBulkOperations(data.operations, data.chores);
      self.postMessage({ type: 'bulkOperationsProcessed', data: results });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

function calculateAchievements(chores, userId) {
  const userChores = chores.filter(chore => 
    chore.assigneeId === userId || !chore.assigneeId
  );
  
  const completedChores = userChores.filter(chore => chore.completedAt);
  const totalChoresCompleted = completedChores.length;
  
  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreaks(completedChores);
  
  // Calculate unique categories
  const uniqueCategories = new Set(completedChores.map(chore => chore.category)).size;
  
  // Achievement logic
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
  
  if (currentStreak >= 7) {
    achievements.push({
      id: 'week_streak',
      title: 'Week Warrior',
      description: '7-day completion streak',
      icon: '🔥'
    });
  }
  
  if (longestStreak >= 30) {
    achievements.push({
      id: 'month_streak',
      title: 'Consistency King',
      description: '30-day completion streak',
      icon: '👑'
    });
  }
  
  if (uniqueCategories >= 5) {
    achievements.push({
      id: 'versatile',
      title: 'Versatile Worker',
      description: 'Completed chores in 5 different categories',
      icon: '🎨'
    });
  }
  
  return {
    achievements,
    stats: {
      totalChoresCompleted,
      currentStreak,
      longestStreak,
      uniqueCategoriesCompleted: uniqueCategories
    }
  };
}

function calculateStats(chores, userId) {
  const userChores = chores.filter(chore => 
    chore.assigneeId === userId || !chore.assigneeId
  );
  
  const totalChores = userChores.length;
  const completedChores = userChores.filter(chore => chore.completedAt);
  const pendingChores = userChores.filter(chore => !chore.completedAt);
  const overdueChores = userChores.filter(chore => {
    if (chore.completedAt) return false;
    if (!chore.dueDate) return false;
    return new Date() > chore.dueDate;
  });
  
  const completionRate = totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;
  
  // Priority breakdown
  const highPriorityChores = userChores.filter(chore => chore.priority === 'high').length;
  const mediumPriorityChores = userChores.filter(chore => chore.priority === 'medium').length;
  const lowPriorityChores = userChores.filter(chore => chore.priority === 'low').length;
  
  // Category breakdown
  const categoryStats = userChores.reduce((acc, chore) => {
    if (chore.category) {
      acc[chore.category] = (acc[chore.category] || 0) + 1;
    }
    return acc;
  }, {});
  
  return {
    totalChores,
    completedChores: completedChores.length,
    pendingChores: pendingChores.length,
    overdueChores: overdueChores.length,
    completionRate: Math.round(completionRate),
    priorityBreakdown: {
      high: highPriorityChores,
      medium: mediumPriorityChores,
      low: lowPriorityChores
    },
    categoryStats
  };
}

function filterChores(chores, filters, currentUser) {
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

function processBulkOperations(operations, chores) {
  const results = {
    success: [],
    errors: []
  };
  
  for (const operation of operations) {
    try {
      const chore = chores.find(c => c.id === operation.choreId);
      if (!chore) {
        results.errors.push(`Chore ${operation.choreId} not found`);
        continue;
      }
      
      // Process operation based on type
      switch (operation.type) {
        case 'complete':
          if (chore.completedAt) {
            results.errors.push(`Chore "${chore.title}" is already completed`);
          } else {
            results.success.push(`Completed "${chore.title}"`);
          }
          break;
          
        case 'delete':
          results.success.push(`Deleted "${chore.title}"`);
          break;
          
        case 'assign':
          results.success.push(`Assigned "${chore.title}" to ${operation.assigneeName}`);
          break;
          
        case 'update':
          results.success.push(`Updated "${chore.title}"`);
          break;
      }
    } catch (error) {
      results.errors.push(`Error processing chore ${operation.choreId}: ${error.message}`);
    }
  }
  
  return results;
}

function calculateStreaks(completedChores) {
  if (completedChores.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedChores = completedChores
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate current streak
  for (let i = sortedChores.length - 1; i >= 0; i--) {
    const choreDate = new Date(sortedChores[i].completedAt);
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
  let lastDate = null;
  for (const chore of sortedChores) {
    const choreDate = new Date(chore.completedAt);
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