import React, { useState, useMemo, useCallback } from 'react';
import { Chore, User } from '../types';
import { ChoreDependencyService } from '../services/choreDependencies';
import './VirtualizedChoreList.css';

interface VirtualizedChoreListProps {
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
  itemHeight?: number;
  containerHeight?: number;
}

interface ChoreItemProps {
  chore: Chore;
  currentUser: User;
  onComplete: (choreId: string) => void;
  onClaim: (choreId: string) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
  isSelected?: boolean;
  onSelect?: (choreId: string, selected: boolean) => void;
  bulkSelectionMode?: boolean;
  canComplete: boolean;
  canClaim: boolean;
  canEdit: boolean;
  canDelete: boolean;
  allChores: Chore[]; // Add this prop for dependency lookups
}

const ChoreItem: React.FC<ChoreItemProps> = React.memo(({
  chore,
  currentUser,
  onComplete,
  onClaim,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  bulkSelectionMode = false,
  canComplete,
  canClaim,
  canEdit,
  canDelete,
  allChores
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(chore.id, !isSelected);
    }
  }, [chore.id, isSelected, onSelect]);

  return (
    <div className={`chore-item ${chore.completedAt ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}>
      {bulkSelectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="chore-select-checkbox"
        />
      )}
      
      <div className="chore-content" onClick={toggleExpanded}>
        <div className="chore-header">
          <h3 className="chore-title">{chore.title}</h3>
          <div className="chore-meta">
            {chore.priority && (
              <span className={`priority-badge priority-${chore.priority}`}>
                {chore.priority}
              </span>
            )}
            {chore.category && (
              <span className="category-badge">{chore.category}</span>
            )}
            {chore.dueDate && (
              <span className={`due-date ${new Date() > chore.dueDate && !chore.completedAt ? 'overdue' : ''}`}>
                {formatDate(chore.dueDate)}
              </span>
            )}
          </div>
        </div>
        
        {chore.description && (
          <p className="chore-description">{chore.description}</p>
        )}
        
        <div className="chore-info">
          {chore.assigneeName && (
            <span className="assignee">Assigned to: {chore.assigneeName}</span>
          )}
          {chore.completedAt && (
            <span className="completion-date">
              Completed: {chore.completedAt.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="chore-details">
          {chore.dependencies && chore.dependencies.length > 0 && (
            <div className="dependencies-info">
              <h4>Dependencies:</h4>
              <div className="dependencies-list">
                {chore.dependencies.map(depId => {
                  const depChore = allChores.find(c => c.id === depId);
                  return depChore ? (
                    <div key={depId} className="dependency-item">
                      <span className="dependency-icon">🔗</span>
                      <span className="dependency-title">{depChore.title}</span>
                      {depChore.assigneeName && (
                        <span className="dependency-assignee">({depChore.assigneeName})</span>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
          
          {ChoreDependencyService.getDependents(chore.id, allChores).length > 0 && (
            <div className="dependents-info">
              <h4>Unlocks:</h4>
              <div className="dependents-list">
                {ChoreDependencyService.getDependents(chore.id, allChores).map(dependent => (
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
            <small>Created: {chore.createdAt.toLocaleDateString()}</small>
            {chore.completedAt && (
              <small>Completed: {chore.completedAt.toLocaleDateString()}</small>
            )}
          </div>
        </div>
      )}
      
      <div className="chore-actions">
        {canComplete && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => onComplete(chore.id)}
            title="Mark as complete"
          >
            ✅ Complete
          </button>
        )}
        
        {canClaim && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onClaim(chore.id)}
            title="Claim this chore"
          >
            🤝 Claim
          </button>
        )}
        
        {canEdit && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(chore)}
            title="Edit chore"
          >
            ✏️ Edit
          </button>
        )}
        
        {canDelete && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(chore.id)}
            title="Delete chore"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
});

export const VirtualizedChoreList: React.FC<VirtualizedChoreListProps> = ({
  chores,
  currentUser,
  onComplete,
  onClaim,
  onEdit,
  onDelete,
  loading = false,
  selectedChoreIds = [],
  onChoreSelect,
  bulkSelectionMode = false,
  itemHeight = 120,
  containerHeight = 600
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Memoize chore permissions
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

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, chores.length);

  // Get visible chores
  const visibleChores = useMemo(() => {
    return chores.slice(startIndex, endIndex);
  }, [chores, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = chores.length * itemHeight;
  const offsetY = startIndex * itemHeight;

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
        <div className="empty-icon">🧹</div>
        <h3>No chores found</h3>
        <p>Time to add some chores or adjust your filters!</p>
      </div>
    );
  }

  return (
    <div 
      className="virtualized-chore-list"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div 
        className="virtualized-chore-list-content"
        style={{ height: totalHeight }}
      >
        <div 
          className="virtualized-chore-list-items"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleChores.map((chore, index) => {
            const actualIndex = startIndex + index;
            const permissions = chorePermissions.find(perm => perm.id === chore.id);
            
            return (
              <div
                key={chore.id}
                className="virtualized-chore-item"
                style={{ height: itemHeight }}
              >
                <ChoreItem
                  chore={chore}
                  currentUser={currentUser}
                  onComplete={onComplete}
                  onClaim={onClaim}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isSelected={selectedChoreIds.includes(chore.id)}
                  onSelect={onChoreSelect}
                  bulkSelectionMode={bulkSelectionMode}
                  canComplete={permissions?.canComplete || false}
                  canClaim={permissions?.canClaim || false}
                  canEdit={permissions?.canEdit || false}
                  canDelete={permissions?.canDelete || false}
                  allChores={chores}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 