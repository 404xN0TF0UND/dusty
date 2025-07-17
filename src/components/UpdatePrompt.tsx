import React from 'react';
import { ServiceWorkerService } from '../services/serviceWorkerService';
import './UpdatePrompt.css';

interface UpdatePromptProps {
  isVisible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({
  isVisible,
  onUpdate,
  onDismiss
}) => {
  if (!isVisible) return null;

  const handleUpdate = async () => {
    try {
      await ServiceWorkerService.getInstance().applyUpdate();
      onUpdate();
    } catch (error) {
      console.error('Failed to apply update:', error);
      // Fallback: reload the page
      window.location.reload();
    }
  };

  return (
    <div className="update-prompt-overlay">
      <div className="update-prompt">
        <div className="update-icon">🔄</div>
        <div className="update-content">
          <h3>New Version Available</h3>
          <p>Dusty's Chores has been updated with new features and improvements!</p>
          <div className="update-actions">
            <button 
              className="btn btn-primary"
              onClick={handleUpdate}
            >
              Update Now
            </button>
            <button 
              className="btn btn-secondary"
              onClick={onDismiss}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 