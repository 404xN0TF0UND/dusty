import { dustyPersonality } from './dustyPersonality';

export interface NotificationSettings {
  enabled: boolean;
  overdueReminders: boolean;
  dailyReminders: boolean;
  completionCelebrations: boolean;
  choreAssignments: boolean;
  adminCompletions: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

class NotificationService {
  private settings: NotificationSettings = {
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
  };

  private isInQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes > endMinutes) {
      // Quiet hours span midnight
      return currentTime >= startMinutes || currentTime <= endMinutes;
    } else {
      return currentTime >= startMinutes && currentTime <= endMinutes;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendNotification(data: NotificationData): Promise<void> {
    if (!this.settings.enabled || this.isInQuietHours()) {
      return;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/logo192.png',
      tag: data.tag,
      requireInteraction: data.requireInteraction || false
    };

    // Note: Actions are only supported with service worker notifications
    // For regular browser notifications, we'll skip actions to avoid errors
    // if (data.actions && 'actions' in Notification.prototype) {
    //   (notificationOptions as any).actions = data.actions;
    // }

    const notification = new Notification(data.title, notificationOptions);

    // Auto-close after 10 seconds unless requireInteraction is true
    if (!data.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return new Promise((resolve) => {
      notification.onclose = () => resolve();
    });
  }

  // Helper to send notification via service worker if available
  private async sendServiceWorkerNotification(data: NotificationData & { data?: any }) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        notification: {
          ...data,
          actions: data.actions,
          data: data.data || {},
        }
      });
      return true;
    }
    return false;
  }

  async sendOverdueNotification(overdueCount: number, choreId?: string): Promise<void> {
    const message = await dustyPersonality.getOverdueChoresResponse();
    const notificationData: NotificationData & { data?: any } = {
      title: "Dusty's Chores - Overdue Alert",
      body: message,
      tag: 'overdue',
      requireInteraction: true,
      actions: [
        { action: 'complete_chore', title: 'Complete Now' },
        { action: 'snooze', title: 'Snooze' }
      ],
      data: { choreId }
    };
    if (!(await this.sendServiceWorkerNotification(notificationData))) {
      await this.sendNotification(notificationData);
    }
  }

  async sendDailyReminder(pendingCount: number, choreId?: string): Promise<void> {
    const message = await dustyPersonality.getNoChoresResponse();
    const notificationData: NotificationData & { data?: any } = {
      title: "Dusty's Daily Reminder",
      body: `You have ${pendingCount} pending chores. ${message}`,
      tag: 'daily-reminder',
      actions: [
        { action: 'complete_chore', title: 'Complete Now' },
        { action: 'snooze', title: 'Snooze' }
      ],
      data: { choreId }
    };
    if (!(await this.sendServiceWorkerNotification(notificationData))) {
      await this.sendNotification(notificationData);
    }
  }

  async sendCompletionNotification(choreTitle: string): Promise<void> {
    const message = await dustyPersonality.getChoreCompleteResponse();
    await this.sendNotification({
      title: "Dusty's Chores - Task Completed",
      body: `${choreTitle} completed! ${message}`,
      tag: 'completion',
      icon: '/logo192.png'
    });
  }

  async sendWelcomeNotification(userName: string): Promise<void> {
    const message = await dustyPersonality.getGreeting(userName);
    await this.sendNotification({
      title: "Welcome to Dusty's Chores",
      body: message,
      tag: 'welcome',
      requireInteraction: false
    });
  }

  async sendBulkCompletionNotification(completedCount: number): Promise<void> {
    const message = await dustyPersonality.getAllCompletedResponse();
    await this.sendNotification({
      title: "Dusty's Chores - Bulk Completion",
      body: `${completedCount} chores completed! ${message}`,
      tag: 'bulk-completion',
      icon: '/logo192.png'
    });
  }

  async sendChoreAssignedNotification(choreTitle: string, assigneeName: string): Promise<void> {
    if (!this.settings.choreAssignments) return;
    
    const message = await dustyPersonality.getChoreClaimResponse();
    await this.sendNotification({
      title: "Dusty's Chores - New Assignment",
      body: `"${choreTitle}" has been assigned to ${assigneeName}. ${message}`,
      tag: 'chore-assigned',
      requireInteraction: true
    });
  }

  async sendAdminCompletionNotification(choreTitle: string, completedBy: string): Promise<void> {
    if (!this.settings.adminCompletions) return;
    
    const message = await dustyPersonality.getChoreCompleteResponse();
    await this.sendNotification({
      title: "Dusty's Chores - Admin Alert",
      body: `"${choreTitle}" was completed by ${completedBy}. ${message}`,
      tag: 'admin-completion',
      requireInteraction: false,
      icon: '/logo192.png'
    });
  }

  // Check for overdue chores and send notifications
  async checkOverdueChores(chores: any[]): Promise<void> {
    if (!this.settings.overdueReminders) return;

    const now = new Date();
    const overdueChores = chores.filter(chore => 
      chore.dueDate && 
      !chore.completedAt && 
      new Date(chore.dueDate) < now
    );

    if (overdueChores.length > 0) {
      await this.sendOverdueNotification(overdueChores.length);
    }
  }

  // Send daily reminder at a specific time
  async sendDailyReminderIfNeeded(chores: any[]): Promise<void> {
    if (!this.settings.dailyReminders) return;

    const pendingChores = chores.filter(chore => !chore.completedAt);
    if (pendingChores.length > 0) {
      await this.sendDailyReminder(pendingChores.length);
    }
  }

  // Update settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    // Save to localStorage
    localStorage.setItem('dustyNotificationSettings', JSON.stringify(this.settings));
  }

  // Load settings from localStorage
  loadSettings(): void {
    const saved = localStorage.getItem('dustyNotificationSettings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }

  // Get current settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Initialize the service
  init(): void {
    this.loadSettings();
    this.requestPermission();
  }
}

export const notificationService = new NotificationService(); 