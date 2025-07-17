import { Chore } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'completion' | 'streak' | 'speed' | 'variety' | 'special';
  requirement: number;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface UserProgress {
  totalChoresCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageCompletionTime: number;
  uniqueCategoriesCompleted: number;
  perfectWeeks: number;
  totalPoints: number;
  achievements: Achievement[];
}

export class AchievementService {
  private static achievements: Achievement[] = [
    // Completion Achievements
    {
      id: 'first_chore',
      title: 'First Steps',
      description: 'Complete your first chore',
      icon: '🎯',
      category: 'completion',
      requirement: 1,
      progress: 0,
      completed: false,
      rarity: 'common',
      points: 10
    },
    {
      id: 'chore_master',
      title: 'Chore Master',
      description: 'Complete 10 chores',
      icon: '⭐',
      category: 'completion',
      requirement: 10,
      progress: 0,
      completed: false,
      rarity: 'common',
      points: 25
    },
    {
      id: 'chore_expert',
      title: 'Chore Expert',
      description: 'Complete 50 chores',
      icon: '🏆',
      category: 'completion',
      requirement: 50,
      progress: 0,
      completed: false,
      rarity: 'rare',
      points: 100
    },
    {
      id: 'chore_legend',
      title: 'Chore Legend',
      description: 'Complete 100 chores',
      icon: '👑',
      category: 'completion',
      requirement: 100,
      progress: 0,
      completed: false,
      rarity: 'epic',
      points: 250
    },

    // Streak Achievements
    {
      id: 'streak_3',
      title: 'Getting Started',
      description: 'Complete chores 3 days in a row',
      icon: '🔥',
      category: 'streak',
      requirement: 3,
      progress: 0,
      completed: false,
      rarity: 'common',
      points: 15
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Complete chores 7 days in a row',
      icon: '🔥🔥',
      category: 'streak',
      requirement: 7,
      progress: 0,
      completed: false,
      rarity: 'rare',
      points: 50
    },
    {
      id: 'streak_30',
      title: 'Monthly Master',
      description: 'Complete chores 30 days in a row',
      icon: '🔥🔥🔥',
      category: 'streak',
      requirement: 30,
      progress: 0,
      completed: false,
      rarity: 'epic',
      points: 200
    },
    {
      id: 'streak_100',
      title: 'Century Streak',
      description: 'Complete chores 100 days in a row',
      icon: '🔥🔥🔥🔥',
      category: 'streak',
      requirement: 100,
      progress: 0,
      completed: false,
      rarity: 'legendary',
      points: 500
    },

    // Speed Achievements
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Complete 5 chores in under 1 hour',
      icon: '⚡',
      category: 'speed',
      requirement: 5,
      progress: 0,
      completed: false,
      rarity: 'rare',
      points: 75
    },
    {
      id: 'lightning_fast',
      title: 'Lightning Fast',
      description: 'Complete 10 chores in under 2 hours',
      icon: '⚡⚡',
      category: 'speed',
      requirement: 10,
      progress: 0,
      completed: false,
      rarity: 'epic',
      points: 150
    },

    // Variety Achievements
    {
      id: 'variety_explorer',
      title: 'Variety Explorer',
      description: 'Complete chores in 5 different categories',
      icon: '🌈',
      category: 'variety',
      requirement: 5,
      progress: 0,
      completed: false,
      rarity: 'common',
      points: 30
    },
    {
      id: 'category_master',
      title: 'Category Master',
      description: 'Complete chores in 10 different categories',
      icon: '🎨',
      category: 'variety',
      requirement: 10,
      progress: 0,
      completed: false,
      rarity: 'rare',
      points: 100
    },

    // Special Achievements
    {
      id: 'perfect_week',
      title: 'Perfect Week',
      description: 'Complete all assigned chores for 7 days',
      icon: '✨',
      category: 'special',
      requirement: 1,
      progress: 0,
      completed: false,
      rarity: 'epic',
      points: 200
    },
    {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Complete 5 chores before 9 AM',
      icon: '🌅',
      category: 'special',
      requirement: 5,
      progress: 0,
      completed: false,
      rarity: 'rare',
      points: 75
    },
    {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Complete 5 chores after 8 PM',
      icon: '🦉',
      category: 'special',
      requirement: 5,
      progress: 0,
      completed: false,
      rarity: 'rare',
      points: 75
    },
    {
      id: 'weekend_warrior',
      title: 'Weekend Warrior',
      description: 'Complete 10 chores on weekends',
      icon: '🏖️',
      category: 'special',
      requirement: 10,
      progress: 0,
      completed: false,
      rarity: 'common',
      points: 50
    }
  ];

  static getUserProgress(userId: string, chores: Chore[]): UserProgress {
    const userChores = chores.filter(chore => 
      chore.assigneeId === userId || !chore.assigneeId
    );
    
    const completedChores = userChores.filter(chore => chore.completedAt);
    const totalChoresCompleted = completedChores.length;
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(completedChores);
    
    // Calculate average completion time
    const averageCompletionTime = this.calculateAverageCompletionTime(completedChores);
    
    // Calculate unique categories
    const uniqueCategories = new Set(completedChores.map(chore => chore.category)).size;
    
    // Calculate perfect weeks
    const perfectWeeks = this.calculatePerfectWeeks(completedChores);
    
    // Get user's achievements
    const userAchievements = this.getUserAchievements(userId, {
      totalChoresCompleted,
      currentStreak,
      longestStreak,
      averageCompletionTime,
      uniqueCategoriesCompleted: uniqueCategories,
      perfectWeeks
    });
    
    const totalPoints = userAchievements.reduce((sum, achievement) => 
      achievement.completed ? sum + achievement.points : sum, 0
    );
    
    return {
      totalChoresCompleted,
      currentStreak,
      longestStreak,
      averageCompletionTime,
      uniqueCategoriesCompleted: uniqueCategories,
      perfectWeeks,
      totalPoints,
      achievements: userAchievements
    };
  }

  private static calculateStreaks(completedChores: Chore[]): { currentStreak: number; longestStreak: number } {
    if (completedChores.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort by completion date
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

  private static calculateAverageCompletionTime(completedChores: Chore[]): number {
    if (completedChores.length === 0) return 0;
    
    const times = completedChores.map(chore => {
      const created = new Date(chore.createdAt);
      const completed = new Date(chore.completedAt!);
      return completed.getTime() - created.getTime();
    });
    
    const averageMs = times.reduce((sum, time) => sum + time, 0) / times.length;
    return Math.round(averageMs / (1000 * 60 * 60)); // Convert to hours
  }

  private static calculatePerfectWeeks(completedChores: Chore[]): number {
    if (completedChores.length === 0) return 0;
    
    // Group chores by week
    const weeklyChores = new Map<string, Chore[]>();
    
    completedChores.forEach(chore => {
      const weekStart = new Date(chore.completedAt!);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyChores.has(weekKey)) {
        weeklyChores.set(weekKey, []);
      }
      weeklyChores.get(weekKey)!.push(chore);
    });
    
    // Count weeks with at least 5 chores (perfect week)
    let perfectWeeks = 0;
    weeklyChores.forEach((chores) => {
      if (chores.length >= 5) {
        perfectWeeks++;
      }
    });
    
    return perfectWeeks;
  }

  private static getUserAchievements(userId: string, progress: {
    totalChoresCompleted: number;
    currentStreak: number;
    longestStreak: number;
    averageCompletionTime: number;
    uniqueCategoriesCompleted: number;
    perfectWeeks: number;
  }): Achievement[] {
    return this.achievements.map(achievement => {
      let progressValue = 0;
      let completed = false;
      
      switch (achievement.id) {
        case 'first_chore':
        case 'chore_master':
        case 'chore_expert':
        case 'chore_legend':
          progressValue = progress.totalChoresCompleted;
          completed = progressValue >= achievement.requirement;
          break;
          
        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
        case 'streak_100':
          progressValue = progress.currentStreak;
          completed = progressValue >= achievement.requirement;
          break;
          
        case 'variety_explorer':
        case 'category_master':
          progressValue = progress.uniqueCategoriesCompleted;
          completed = progressValue >= achievement.requirement;
          break;
          
        case 'perfect_week':
          progressValue = progress.perfectWeeks;
          completed = progressValue >= achievement.requirement;
          break;
          
        default:
          progressValue = 0;
          completed = false;
      }
      
      return {
        ...achievement,
        progress: Math.min(progressValue, achievement.requirement),
        completed,
        completedAt: completed ? new Date() : undefined
      };
    });
  }

  static checkForNewAchievements(userId: string, chores: Chore[]): Achievement[] {
    const progress = this.getUserProgress(userId, chores);
    return progress.achievements.filter(achievement => 
      achievement.completed && !achievement.completedAt
    );
  }

  static getAchievementById(id: string): Achievement | undefined {
    return this.achievements.find(achievement => achievement.id === id);
  }

  static getAllAchievements(): Achievement[] {
    return this.achievements;
  }

  static getAchievementsByCategory(category: string): Achievement[] {
    return this.achievements.filter(achievement => achievement.category === category);
  }
} 