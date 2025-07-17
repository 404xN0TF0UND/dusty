import React, { useState } from 'react';
import { User } from '../types';
import { BulkOperationsService } from '../services/bulkOperations';
import './BulkOperationsToolbar.css';

interface BulkOperationsToolbarProps {
  selectedChoreIds: string[];
  totalChores: number;
  currentUser: User;
  users?: User[];
  onBulkComplete: () => void;
  onBulkDelete: () => void;
  onBulkAssign: (assigneeId: string, assigneeName: string) => void;
  onBulkUpdate: (updateData: any) => void;
  onClearSelection: () => void;
  loading?: boolean;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedChoreIds,
  totalChores,
  currentUser,
  users = [],
  onBulkComplete,
  onBulkDelete,
  onBulkAssign,
  onBulkUpdate,
  onClearSelection,
  loading = false
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [updateData, setUpdateData] = useState({
    priority: '',
    category: '',
    dueDate: ''
  });

  const selectedCount = selectedChoreIds.length;
  const selectionPercentage = totalChores > 0 ? Math.round((selectedCount / totalChores) * 100) : 0;

  const handleBulkComplete = () => {
    onBulkComplete();
  };

  const handleBulkDelete = () => {
    onBulkDelete();
  };

  const handleBulkAssign = () => {
    if (selectedAssignee) {
      const assignee = users.find(u => u.id === selectedAssignee);
      if (assignee) {
        onBulkAssign(assignee.id, assignee.displayName);
        setShowAssignModal(false);
        setSelectedAssignee('');
      }
    }
  };

  const handleBulkUpdate = () => {
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== '')
    );
    
    if (Object.keys(cleanData).length > 0) {
      onBulkUpdate(cleanData);
      setShowUpdateModal(false);
      setUpdateData({ priority: '', category: '', dueDate: '' });
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bulk-operations-toolbar">
      <div className="bulk-toolbar-header">
        <div className="selection-info">
          <span className="selection-count">
            {selectedCount} of {totalChores} selected ({selectionPercentage}%)
          </span>
          <button 
            className="btn btn-text btn-sm" 
            onClick={onClearSelection}
            disabled={loading}
          >
            Clear Selection
          </button>
        </div>
      </div>

      <div className="bulk-toolbar-actions">
        <button
          className="btn btn-success btn-sm"
          onClick={handleBulkComplete}
          disabled={loading}
          title="Mark selected chores as complete"
        >
          ✅ Complete All
        </button>

        {currentUser.role === 'admin' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={handleBulkDelete}
            disabled={loading}
            title="Delete selected chores"
          >
            🗑️ Delete All
          </button>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAssignModal(true)}
          disabled={loading}
          title="Assign selected chores"
        >
          👤 Assign
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowUpdateModal(true)}
          disabled={loading}
          title="Update selected chores"
        >
          ✏️ Update
        </button>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="bulk-modal">
          <div className="bulk-modal-backdrop" onClick={() => setShowAssignModal(false)} />
          <div className="bulk-modal-content">
            <h3>Assign Chores</h3>
            <p>Assign {selectedCount} selected chore{selectedCount !== 1 ? 's' : ''} to:</p>
            
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="bulk-select"
            >
              <option value="">Select assignee...</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>

            <div className="bulk-modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleBulkAssign}
                disabled={!selectedAssignee || loading}
              >
                Assign
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAssignModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="bulk-modal">
          <div className="bulk-modal-backdrop" onClick={() => setShowUpdateModal(false)} />
          <div className="bulk-modal-content">
            <h3>Update Chores</h3>
            <p>Update {selectedCount} selected chore{selectedCount !== 1 ? 's' : ''}:</p>
            
            <div className="bulk-update-fields">
              <label>
                Priority
                <select
                  value={updateData.priority}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, priority: e.target.value }))}
                  className="bulk-select"
                >
                  <option value="">Keep current</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label>
                Category
                <input
                  type="text"
                  value={updateData.category}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Keep current"
                  className="bulk-input"
                />
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  value={updateData.dueDate}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="bulk-input"
                />
              </label>
            </div>

            <div className="bulk-modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleBulkUpdate}
                disabled={loading}
              >
                Update
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowUpdateModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 