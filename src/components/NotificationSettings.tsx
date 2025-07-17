import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import type { NotificationSettings } from '../services/notificationService';
import './NotificationSettings.css';
import { subscribeUserToPush } from '../services/pushSubscriptionService';
import { useAuth } from '../contexts/AuthContext';

export const NotificationSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    overdueReminders: true,
    dailyReminders: true,
    completionCelebrations: true,
    choreAssignments: true,
    adminCompletions: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSupported, setIsSupported] = useState(true);
  const { currentUser } = useAuth();
  const [pushStatus, setPushStatus] = useState<string>('');

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setIsSupported(false);
      return;
    }

    // Load current settings
    const currentSettings = notificationService.getSettings();
    setSettings(currentSettings);

    // Check permission status
    setPermissionStatus(Notification.permission);
  }, []);

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings };
    
    if (key === 'quietHours') {
      newSettings.quietHours = { ...newSettings.quietHours, ...value };
    } else {
      (newSettings as any)[key] = value;
    }
    
    setSettings(newSettings);
    notificationService.updateSettings(newSettings);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  const testNotification = async () => {
    await notificationService.sendWelcomeNotification('Test User');
  };

  const handleEnablePush = async () => {
    if (!currentUser) {
      setPushStatus('User not authenticated.');
      return;
    }
    try {
      await subscribeUserToPush(currentUser.id);
      setPushStatus('Push notifications enabled!');
    } catch (err) {
      setPushStatus('Failed to enable push notifications.');
    }
  };

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <h3>Notification Settings</h3>
        <div className="notification-warning">
          <p>⚠️ Notifications are not supported in this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>Notification Settings</h3>
      
      <div className="permission-section">
        <h4>Browser Permission</h4>
        <div className="permission-status">
          <span className={`status-badge ${permissionStatus}`}>
            {permissionStatus === 'granted' ? '✅ Granted' : 
             permissionStatus === 'denied' ? '❌ Denied' : '⏳ Default'}
          </span>
          {permissionStatus !== 'granted' && (
            <button 
              className="btn btn-primary"
              onClick={requestPermission}
            >
              Request Permission
            </button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h4>Notification Types</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
            />
            Enable Notifications
          </label>
          <p className="setting-description">
            Master switch for all notifications
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.overdueReminders}
              onChange={(e) => handleSettingChange('overdueReminders', e.target.checked)}
              disabled={!settings.enabled}
            />
            Overdue Reminders
          </label>
          <p className="setting-description">
            Get notified when chores are overdue
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.dailyReminders}
              onChange={(e) => handleSettingChange('dailyReminders', e.target.checked)}
              disabled={!settings.enabled}
            />
            Daily Reminders
          </label>
          <p className="setting-description">
            Daily reminders about pending chores
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.completionCelebrations}
              onChange={(e) => handleSettingChange('completionCelebrations', e.target.checked)}
              disabled={!settings.enabled}
            />
            Completion Celebrations
          </label>
          <p className="setting-description">
            Celebrate when you complete chores
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.choreAssignments}
              onChange={(e) => handleSettingChange('choreAssignments', e.target.checked)}
              disabled={!settings.enabled}
            />
            Chore Assignments
          </label>
          <p className="setting-description">
            Get notified when chores are assigned to you
          </p>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.adminCompletions}
              onChange={(e) => handleSettingChange('adminCompletions', e.target.checked)}
              disabled={!settings.enabled}
            />
            Admin Completion Alerts
          </label>
          <p className="setting-description">
            Admins get notified when chores are completed
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h4>Quiet Hours</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.quietHours.enabled}
              onChange={(e) => handleSettingChange('quietHours', { enabled: e.target.checked })}
              disabled={!settings.enabled}
            />
            Enable Quiet Hours
          </label>
          <p className="setting-description">
            Pause notifications during specific hours
          </p>
        </div>

        {settings.quietHours.enabled && (
          <div className="quiet-hours-config">
            <div className="time-input">
              <label>Start Time:</label>
              <input
                type="time"
                value={settings.quietHours.start}
                onChange={(e) => handleSettingChange('quietHours', { start: e.target.value })}
              />
            </div>
            <div className="time-input">
              <label>End Time:</label>
              <input
                type="time"
                value={settings.quietHours.end}
                onChange={(e) => handleSettingChange('quietHours', { end: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="test-section">
        <h4>Test Notifications</h4>
        <button 
          className="btn btn-secondary"
          onClick={testNotification}
          disabled={!settings.enabled || permissionStatus !== 'granted'}
        >
          Send Test Notification
        </button>
        <p className="setting-description">
          Test how notifications will appear
        </p>
      </div>

      <div className="settings-section">
        <h4>Push Notifications</h4>
        <button className="btn btn-primary" onClick={handleEnablePush} disabled={!currentUser}>
          Enable Push Notifications
        </button>
        {pushStatus && <div className="push-status-message">{pushStatus}</div>}
      </div>
    </div>
  );
}; 