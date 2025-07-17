import React, { useState } from 'react';
import { ChoreFilters as ChoreFiltersType } from '../types';
import './ChoreFilters.css';

interface ChoreFiltersProps {
  filters: ChoreFiltersType;
  onFiltersChange: (filters: ChoreFiltersType) => void;
  categories: string[];
  loading?: boolean;
}

export const ChoreFilters: React.FC<ChoreFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ChoreFiltersType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  return (
    <div className="chore-filters">
      <div className="filters-header">
        <div className="filters-search">
          <input
            type="text"
            placeholder="Search chores..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="search-input"
            disabled={loading}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <button
          className={`filters-toggle ${isExpanded ? 'expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={loading}
        >
          <span className="toggle-icon">⚙️</span>
          <span className="toggle-text">Filters</span>
          {hasActiveFilters && <span className="active-indicator">●</span>}
        </button>
      </div>

      {isExpanded && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? undefined : e.target.value)}
                className="filter-select"
                disabled={loading}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Priority</label>
              <select
                value={filters.priority || 'all'}
                onChange={(e) => handleFilterChange('priority', e.target.value === 'all' ? undefined : e.target.value)}
                className="filter-select"
                disabled={loading}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select
                value={filters.category || 'all'}
                onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value)}
                className="filter-select"
                disabled={loading}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Assignee</label>
              <select
                value={filters.assignee || 'all'}
                onChange={(e) => handleFilterChange('assignee', e.target.value === 'all' ? undefined : e.target.value)}
                className="filter-select"
                disabled={loading}
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filters-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={clearFilters}
                disabled={loading}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 