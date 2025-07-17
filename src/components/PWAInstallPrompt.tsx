import React from 'react';
import './PWAInstallPrompt.css';

interface PWAInstallPromptProps {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ visible, onInstall, onDismiss }) => {
  if (!visible) return null;

  return (
    <div className="pwa-install-overlay">
      <div className="pwa-install-prompt">
        <div className="pwa-install-icon">🤵‍♂️</div>
        <h3>Install Dusty's Chores</h3>
        <p>Get the full butler experience! Install this app for quick access, offline support, and push notifications.</p>
        <div className="pwa-install-actions">
          <button className="btn btn-primary" onClick={onInstall}>Install</button>
          <button className="btn btn-secondary" onClick={onDismiss}>Maybe Later</button>
        </div>
      </div>
    </div>
  );
}; 