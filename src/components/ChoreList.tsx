import React, { useState, useMemo } from 'react';
import { Chore, User } from '../types';
import { ChoreDependencyService } from '../services/choreDependencies';
import './ChoreList.css';
import { useAuth } from '../contexts/AuthContext';

interface ChoreListProps {
  chores: Chore[];
  currentUser: User;
  onComplete: (choreId: string) => void;
  onClaim: (choreId: string) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
  loading?: boolean;
  selectedChoreIds?: string[];
  onChoreSelect?: (choreId: string, selected: boolean) => void;
  bulkSelectionMode?: boolean;
}

const PriorityBadge: React.FC<{ priority: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: 'High', className: 'priority-high', icon: '🔥' };
      case 'medium':
        return { label: 'Medium', className: 'priority-medium', icon: '⚡' };
      case 'low':
        return { label: 'Low', className: 'priority-low', icon: '💤' };
      default:
        return { label: 'Low', className: 'priority-low', icon: '💤' };
    }
  };

  const config = getPriorityConfig(priority);
  
  return (
    <span className={`priority-badge ${config.className}`}>
      <span className="priority-icon">{config.icon}</span>
      {config.label}
    </span>
  );
};

const StatusBadge: React.FC<{ chore: Chore }> = ({ chore }) => {
  const now = new Date();
  const isOverdue = chore.dueDate && !chore.completedAt && now > chore.dueDate;
  const isCompleted = !!chore.completedAt;
  const isUnassigned = !chore.assigneeId;

  if (isCompleted) {
    return (
      <span className="status-badge status-completed">
        <span className="status-icon">✅</span>
        Completed
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="status-badge status-overdue">
        <span className="status-icon">🚨</span>
        Overdue
      </span>
    );
  }

  if (isUnassigned) {
    return (
      <span className="status-badge status-unassigned">
        <span className="status-icon">📋</span>
        Unassigned
      </span>
    );
  }

  return (
    <span className="status-badge status-pending">
      <span className="status-icon">⏳</span>
      Pending
    </span>
  );
};

const CategoryBadge: React.FC<{ category?: string }> = ({ category }) => {
  if (!category) return null;

  const getCategoryConfig = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return { icon: '🧹', color: 'category-cleaning' };
      case 'laundry':
        return { icon: '👕', color: 'category-laundry' };
      case 'cooking':
        return { icon: '🍳', color: 'category-cooking' };
      case 'shopping':
        return { icon: '🛒', color: 'category-shopping' };
      case 'maintenance':
        return { icon: '🔧', color: 'category-maintenance' };
      case 'garden':
        return { icon: '🌱', color: 'category-garden' };
      default:
        return { icon: '📝', color: 'category-other' };
    }
  };

  const config = getCategoryConfig(category);

  return (
    <span className={`category-badge ${config.color}`}>
      <span className="category-icon">{config.icon}</span>
      {category}
    </span>
  );
};

const DependencyBadge: React.FC<{ 
  chore: Chore; 
  allChores: Chore[];
  isBlocked?: boolean;
}> = ({ chore, allChores, isBlocked = false }) => {
  if (!chore.dependencies || chore.dependencies.length === 0) {
    return null;
  }

  const dependencies = ChoreDependencyService.getDependencies(chore, allChores);
  const completedDependencies = dependencies.filter(d => d.completedAt);
  const pendingDependencies = dependencies.filter(d => !d.completedAt);

  if (isBlocked) {
    return (
      <span className="dependency-badge dependency-blocked">
        <span className="dependency-icon">🔒</span>
        {pendingDependencies.length} pending
      </span>
    );
  }

  return (
    <span className="dependency-badge dependency-available">
      <span className="dependency-icon">🔗</span>
      {completedDependencies.length}/{dependencies.length} deps
    </span>
  );
};

function safeFormatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'object' && 'toDate' in date) return date.toDate().toLocaleDateString();
  if (date instanceof Date) return date.toLocaleDateString();
  return '—';
}

export const ChoreList: React.FC<ChoreListProps> = React.memo(({
  chores,
  currentUser,
  onComplete,
  onClaim,
  onEdit,
  onDelete,
  loading = false,
  selectedChoreIds = [],
  onChoreSelect,
  bulkSelectionMode = false
}) => {
  const [expandedChore, setExpandedChore] = useState<string | null>(null);
  const { signOutUser } = useAuth();

  // Memoize expensive calculations
  const chorePermissions = useMemo(() => {
    return chores.map(chore => ({
      id: chore.id,
      canComplete: !chore.completedAt && 
        (currentUser.role === 'admin' || chore.assigneeId === currentUser.id) &&
        ChoreDependencyService.canCompleteChore(chore, chores),
      canClaim: !chore.completedAt && !chore.assigneeId && currentUser.role === 'member',
      canEdit: currentUser.role === 'admin' || chore.assigneeId === currentUser.id,
      canDelete: currentUser.role === 'admin'
    }));
  }, [chores, currentUser]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const toggleExpanded = (choreId: string) => {
    setExpandedChore(expandedChore === choreId ? null : choreId);
  };

  if (loading) {
    return (
      <div className="chore-list-loading">
        <div className="loading-spinner"></div>
        <p>Dusty is fetching your chores...</p>
      </div>
    );
  }

  if (chores.length === 0) {
    return (
      <div className="chore-list-empty">
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No chores found</h3>
          <p>Either you're incredibly efficient or Dusty hasn't assigned anything yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chore-list">
      {chores.map((chore) => {
        const isSelected = selectedChoreIds.includes(chore.id);
        
        return (
          <div
            key={chore.id}
            className={`chore-item ${chore.completedAt ? 'completed' : ''} ${expandedChore === chore.id ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
          >
                      <div className="chore-header" onClick={() => toggleExpanded(chore.id)}>
              {bulkSelectionMode && onChoreSelect && (
                <div className="chore-selection">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onChoreSelect(chore.id, e.target.checked);
                    }}
                    className="chore-checkbox"
                  />
                </div>
              )}
              <div className="chore-main">
                <div className="chore-title-section">
                  <h3 className="chore-title">{chore.title}</h3>
                  <div className="chore-badges">
                    <PriorityBadge priority={chore.priority} />
                    <StatusBadge chore={chore} />
                    {chore.category && <CategoryBadge category={chore.category} />}
                    <DependencyBadge 
                      chore={chore} 
                      allChores={chores}
                      isBlocked={!ChoreDependencyService.canCompleteChore(chore, chores)}
                    />
                  </div>
                </div>
              
              <div className="chore-meta">
                {chore.assigneeName && (
                  <span className="assignee">👤 {chore.assigneeName}</span>
                )}
                {chore.dueDate && (
                  <span className={`due-date ${chore.dueDate < new Date() && !chore.completedAt ? 'overdue' : ''}`}>
                    📅 {formatDate(chore.dueDate)}
                  </span>
                )}
                {chore.isRecurring && (
                  <span className="recurring">🔄 {chore.recurrencePattern}</span>
                )}
              </div>
            </div>
            
            <div className="chore-actions">
              {chorePermissions.find(perm => perm.id === chore.id)?.canComplete && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(chore.id);
                  }}
                  title="Mark as complete"
                >
                  ✅
                </button>
              )}
              
              {chorePermissions.find(perm => perm.id === chore.id)?.canClaim && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaim(chore.id);
                  }}
                  title="Claim this chore"
                >
                  📋
                </button>
              )}
              
              {chorePermissions.find(perm => perm.id === chore.id)?.canEdit && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(chore);
                  }}
                  title="Edit chore"
                >
                  ✏️
                </button>
              )}
              
              {chorePermissions.find(perm => perm.id === chore.id)?.canDelete && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chore.id);
                  }}
                  title="Delete chore"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
          
          {expandedChore === chore.id && (
            <div className="chore-details">
              {chore.description && (
                <p className="chore-description">{chore.description}</p>
              )}
              
              {/* Dependency Information */}
              {chore.dependencies && chore.dependencies.length > 0 && (
                <div className="dependency-info">
                  <h4>Dependencies:</h4>
                  <div className="dependency-list">
                    {ChoreDependencyService.getDependencies(chore, chores).map(dep => (
                      <div 
                        key={dep.id} 
                        className={`dependency-item ${dep.completedAt ? 'completed' : 'pending'}`}
                      >
                        <span className="dependency-status">
                          {dep.completedAt ? '✅' : '⏳'}
                        </span>
                        <span className="dependency-title">{dep.title}</span>
                        {dep.assigneeName && (
                          <span className="dependency-assignee">({dep.assigneeName})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Chores that depend on this one */}
              {ChoreDependencyService.getDependents(chore.id, chores).length > 0 && (
                <div className="dependents-info">
                  <h4>Unlocks:</h4>
                  <div className="dependents-list">
                    {ChoreDependencyService.getDependents(chore.id, chores).map(dependent => (
                      <div key={dependent.id} className="dependent-item">
                        <span className="dependent-icon">🔓</span>
                        <span className="dependent-title">{dependent.title}</span>
                        {dependent.assigneeName && (
                          <span className="dependent-assignee">({dependent.assigneeName})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="chore-timestamps">
                <small>Created: {safeFormatDate(chore.createdAt)}</small>
                {chore.completedAt && (
                  <small>Completed: {safeFormatDate(chore.completedAt)}</small>
                )}
              </div>
            </div>
          )}
        </div>
      )})}
    </div>
  );
}); 