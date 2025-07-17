import React, { useState } from 'react';
import { Achievement, UserProgress } from '../services/achievementService';
import { User, Chore } from '../types';
import './AchievementDisplay.css';

interface AchievementDisplayProps {
  currentUser: User;
  chores: Chore[];
  onClose: () => void;
}

export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({
  currentUser,
  chores,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);

  // Get user progress
  const { AchievementService } = require('../services/achievementService');
  const progress: UserProgress = AchievementService.getUserProgress(currentUser.id, chores);
  
  const categories = [
    { id: 'all', name: 'All Achievements', icon: '🏆' },
    { id: 'completion', name: 'Completion', icon: '🎯' },
    { id: 'streak', name: 'Streaks', icon: '🔥' },
    { id: 'speed', name: 'Speed', icon: '⚡' },
    { id: 'variety', name: 'Variety', icon: '🌈' },
    { id: 'special', name: 'Special', icon: '✨' }
  ];

  const filteredAchievements = progress.achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const statusMatch = (achievement.completed && showCompleted) || (!achievement.completed && showInProgress);
    return categoryMatch && statusMatch;
  });

  const completedAchievements = progress.achievements.filter(a => a.completed);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6c757d';
      case 'rare': return '#007bff';
      case 'epic': return '#6f42c1';
      case 'legendary': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min((achievement.progress / achievement.requirement) * 100, 100);
  };

  return (
    <div className="achievement-overlay">
      <div className="achievement-backdrop" onClick={onClose} />
      <div className="achievement-container">
        <div className="achievement-header">
          <h2>🏆 Achievement Center</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Progress Summary */}
        <div className="progress-summary">
          <div className="progress-card">
            <div className="progress-icon">🎯</div>
            <div className="progress-info">
              <h3>{progress.totalChoresCompleted}</h3>
              <p>Chores Completed</p>
            </div>
          </div>
          
          <div className="progress-card">
            <div className="progress-icon">🔥</div>
            <div className="progress-info">
              <h3>{progress.currentStreak}</h3>
              <p>Day Streak</p>
            </div>
          </div>
          
          <div className="progress-card">
            <div className="progress-icon">⭐</div>
            <div className="progress-info">
              <h3>{progress.totalPoints}</h3>
              <p>Total Points</p>
            </div>
          </div>
          
          <div className="progress-card">
            <div className="progress-icon">🏆</div>
            <div className="progress-info">
              <h3>{completedAchievements.length}</h3>
              <p>Achievements</p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Filter Toggles */}
        <div className="filter-toggles">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            <span className="toggle-label">✅ Completed</span>
          </label>
          
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showInProgress}
              onChange={(e) => setShowInProgress(e.target.checked)}
            />
            <span className="toggle-label">🔄 In Progress</span>
          </label>
        </div>

        {/* Achievements List */}
        <div className="achievements-list">
          {filteredAchievements.length === 0 ? (
            <div className="no-achievements">
              <div className="no-achievements-icon">🎯</div>
              <h3>No achievements found</h3>
              <p>Try completing some chores to unlock achievements!</p>
            </div>
          ) : (
            filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.completed ? 'completed' : 'in-progress'}`}
              >
                <div className="achievement-icon" style={{ color: getRarityColor(achievement.rarity) }}>
                  {achievement.icon}
                </div>
                
                <div className="achievement-content">
                  <div className="achievement-header">
                    <h3 className="achievement-title">{achievement.title}</h3>
                    <span className="achievement-rarity" style={{ color: getRarityColor(achievement.rarity) }}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="achievement-description">{achievement.description}</p>
                  
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${getProgressPercentage(achievement)}%`,
                          backgroundColor: getRarityColor(achievement.rarity)
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {achievement.progress} / {achievement.requirement}
                    </span>
                  </div>
                  
                  {achievement.completed && (
                    <div className="achievement-completed">
                      <span className="completed-badge">✅ Completed!</span>
                      <span className="points-earned">+{achievement.points} points</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Achievement Stats */}
        <div className="achievement-stats">
          <h3>📊 Your Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Longest Streak</span>
              <span className="stat-value">{progress.longestStreak} days</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg. Completion Time</span>
              <span className="stat-value">{progress.averageCompletionTime}h</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Categories Explored</span>
              <span className="stat-value">{progress.uniqueCategoriesCompleted}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Perfect Weeks</span>
              <span className="stat-value">{progress.perfectWeeks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 