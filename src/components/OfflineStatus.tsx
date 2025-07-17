import React, { useState, useEffect } from 'react';
import { OfflineSyncService } from '../services/offlineSync';
import './OfflineStatus.css';

interface OfflineStatusProps {
  onSyncClick?: () => void;
}

export const OfflineStatus: React.FC<OfflineStatusProps> = ({ onSyncClick }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncSummary, setSyncSummary] = useState<{
    totalChores: number;
    pendingChores: number;
    lastSync: Date | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Load initial sync summary
    loadSyncSummary();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const loadSyncSummary = async () => {
    try {
      const summary = await OfflineSyncService.getOfflineSummary();
      setSyncSummary(summary);
    } catch (error) {
      console.error('Failed to load sync summary:', error);
    }
  };

  const handleSyncClick = async () => {
    if (!isOnline) return;
    
    setIsLoading(true);
    try {
      await OfflineSyncService.syncPendingData();
      await loadSyncSummary(); // Refresh summary after sync
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isOnline && (!syncSummary || syncSummary.pendingChores === 0)) {
    return null; // Don't show indicator when online and no pending sync
  }

  return (
    <div className={`offline-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-indicator">
        <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
        <span className="status-text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {syncSummary && syncSummary.pendingChores > 0 && (
        <div className="sync-info">
          <span className="pending-count">
            {syncSummary.pendingChores} pending
          </span>
          {isOnline && (
            <button
              className="btn btn-primary btn-sm sync-btn"
              onClick={handleSyncClick}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄'} Sync
            </button>
          )}
        </div>
      )}

      {syncSummary && syncSummary.lastSync && (
        <div className="last-sync">
          Last sync: {formatLastSync(syncSummary.lastSync)}
        </div>
      )}

      {!isOnline && (
        <div className="offline-message">
          Working offline - changes will sync when you're back online
        </div>
      )}
    </div>
  );
}; 