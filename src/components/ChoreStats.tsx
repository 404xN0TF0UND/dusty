import React from 'react';
import { Chore, User } from '../types';
import './ChoreStats.css';

interface ChoreStatsProps {
  chores: Chore[];
  currentUser: User;
  loading?: boolean;
}

function safeFormatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'object' && 'toDate' in date) return date.toDate().toLocaleDateString();
  if (date instanceof Date) return date.toLocaleDateString();
  return '—';
}

export const ChoreStats: React.FC<ChoreStatsProps> = ({
  chores,
  currentUser,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="chore-stats-loading">
        <div className="loading-spinner"></div>
        <p>Calculating your productivity...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalChores = chores.length;
  const completedChores = chores.filter(chore => chore.completedAt).length;
  const pendingChores = chores.filter(chore => !chore.completedAt).length;
  const overdueChores = chores.filter(chore => {
    if (chore.completedAt) return false;
    if (!chore.dueDate) return false;
    return new Date() > chore.dueDate;
  }).length;
  
  const unassignedChores = chores.filter(chore => !chore.assigneeId).length;
  const myChores = chores.filter(chore => chore.assigneeId === currentUser.id).length;
  const myCompletedChores = chores.filter(chore => 
    chore.assigneeId === currentUser.id && chore.completedAt
  ).length;

  // Calculate completion rates
  const overallCompletionRate = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;
  const myCompletionRate = myChores > 0 ? Math.round((myCompletedChores / myChores) * 100) : 0;

  // Priority breakdown
  const highPriorityChores = chores.filter(chore => chore.priority === 'high').length;
  const mediumPriorityChores = chores.filter(chore => chore.priority === 'medium').length;
  const lowPriorityChores = chores.filter(chore => chore.priority === 'low').length;

  // Category breakdown
  const categoryStats = chores.reduce((acc, chore) => {
    if (chore.category) {
      acc[chore.category] = (acc[chore.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCompleted = chores.filter(chore => 
    chore.completedAt && chore.completedAt > sevenDaysAgo
  ).length;

  const recentCreated = chores.filter(chore => 
    chore.createdAt > sevenDaysAgo
  ).length;

  // Get Dusty's commentary based on stats
  const getDustyCommentary = () => {
    if (overallCompletionRate >= 80) {
      return "Impressive! You're running a tight ship around here.";
    } else if (overallCompletionRate >= 60) {
      return "Not bad, but there's still work to be done. Chop chop!";
    } else if (overallCompletionRate >= 40) {
      return "Well, at least you're trying. Sort of.";
    } else {
      return "Oh dear. This household is in dire need of some discipline.";
    }
  };

  const getProductivityMood = () => {
    if (overdueChores === 0 && overallCompletionRate >= 70) {
      return { emoji: "🎉", text: "Excellent" };
    } else if (overdueChores <= 2 && overallCompletionRate >= 50) {
      return { emoji: "👍", text: "Good" };
    } else if (overdueChores <= 5) {
      return { emoji: "😐", text: "Fair" };
    } else {
      return { emoji: "😤", text: "Needs Work" };
    }
  };

  const productivityMood = getProductivityMood();

  return (
    <div className="chore-stats">
      <div className="stats-header">
        <h2>📊 Household Statistics</h2>
        <div className="productivity-mood">
          <span className="mood-emoji">{productivityMood.emoji}</span>
          <span className="mood-text">{productivityMood.text}</span>
        </div>
      </div>

      <div className="stats-grid">
        {/* Overview Cards */}
        <div className="stat-card overview">
          <div className="stat-header">
            <h3>Overview</h3>
            <span className="stat-icon">📋</span>
          </div>
          <div className="stat-content">
            <div className="stat-row">
              <span>Total Chores:</span>
              <span className="stat-value">{totalChores}</span>
            </div>
            <div className="stat-row">
              <span>Completed:</span>
              <span className="stat-value success">{completedChores}</span>
            </div>
            <div className="stat-row">
              <span>Pending:</span>
              <span className="stat-value warning">{pendingChores}</span>
            </div>
            <div className="stat-row">
              <span>Overdue:</span>
              <span className="stat-value danger">{overdueChores}</span>
            </div>
          </div>
        </div>

        {/* Completion Rates */}
        <div className="stat-card completion">
          <div className="stat-header">
            <h3>Completion Rates</h3>
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-content">
            <div className="completion-bar">
              <div className="bar-label">Overall</div>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${overallCompletionRate}%` }}
                ></div>
                <span className="bar-text">{overallCompletionRate}%</span>
              </div>
            </div>
            {currentUser.role === 'member' && (
              <div className="completion-bar">
                <div className="bar-label">My Chores</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${myCompletionRate}%` }}
                  ></div>
                  <span className="bar-text">{myCompletionRate}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="stat-card priority">
          <div className="stat-header">
            <h3>Priority Breakdown</h3>
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-content">
            <div className="priority-item">
              <span className="priority-label">High</span>
              <span className="priority-count high">{highPriorityChores}</span>
            </div>
            <div className="priority-item">
              <span className="priority-label">Medium</span>
              <span className="priority-count medium">{mediumPriorityChores}</span>
            </div>
            <div className="priority-item">
              <span className="priority-label">Low</span>
              <span className="priority-count low">{lowPriorityChores}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="stat-card activity">
          <div className="stat-header">
            <h3>Recent Activity</h3>
            <span className="stat-icon">⚡</span>
          </div>
          <div className="stat-content">
            <div className="activity-item">
              <span>Completed (7 days):</span>
              <span className="activity-value">{recentCompleted}</span>
            </div>
            <div className="activity-item">
              <span>Created (7 days):</span>
              <span className="activity-value">{recentCreated}</span>
            </div>
            <div className="activity-item">
              <span>Unassigned:</span>
              <span className="activity-value">{unassignedChores}</span>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="stat-card categories">
            <div className="stat-header">
              <h3>Top Categories</h3>
              <span className="stat-icon">🏷️</span>
            </div>
            <div className="stat-content">
              {topCategories.map(([category, count]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dusty's Commentary */}
        <div className="stat-card commentary">
          <div className="stat-header">
            <h3>Dusty's Take</h3>
            <span className="stat-icon">💭</span>
          </div>
          <div className="stat-content">
            <p className="dusty-comment">{getDustyCommentary()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 