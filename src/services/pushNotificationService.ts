// Push Notification Service for rich notifications
export class PushNotificationService {
  private static instance: PushNotificationService;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Send a rich push notification
   */
  async sendNotification(notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
    requireInteraction?: boolean;
    silent?: boolean;
  }): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if we have permission
      if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Send message to service worker to show notification
      if (registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          notification
        });
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  /**
   * Send chore completion notification
   */
  async sendChoreCompletionNotification(choreTitle: string, assigneeName: string): Promise<void> {
    await this.sendNotification({
      title: 'Chore Completed! 🎉',
      body: `${assigneeName} completed "${choreTitle}"`,
      icon: '/logo192.png',
      tag: 'chore-completion',
      data: {
        type: 'chore-completion',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'explore',
          title: 'View All Chores',
          icon: '/logo192.png'
        },
        {
          action: 'view_stats',
          title: 'View Stats',
          icon: '/logo192.png'
        }
      ]
    });
  }

  /**
   * Send overdue chore reminder
   */
  async sendOverdueReminder(choreTitle: string, daysOverdue: number): Promise<void> {
    await this.sendNotification({
      title: 'Chore Overdue! ⏰',
      body: `"${choreTitle}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
      icon: '/logo192.png',
      tag: 'overdue-reminder',
      requireInteraction: true,
      data: {
        type: 'overdue-reminder',
        choreTitle,
        daysOverdue
      },
      actions: [
        {
          action: 'explore',
          title: 'View Chores',
          icon: '/logo192.png'
        },
        {
          action: 'complete_chore',
          title: 'Mark Complete',
          icon: '/logo192.png'
        }
      ]
    });
  }

  /**
   * Send daily reminder
   */
  async sendDailyReminder(pendingCount: number): Promise<void> {
    await this.sendNotification({
      title: 'Daily Chore Reminder 📋',
      body: `You have ${pendingCount} chore${pendingCount !== 1 ? 's' : ''} pending today`,
      icon: '/logo192.png',
      tag: 'daily-reminder',
      data: {
        type: 'daily-reminder',
        pendingCount
      },
      actions: [
        {
          action: 'explore',
          title: 'View Chores',
          icon: '/logo192.png'
        },
        {
          action: 'add_chore',
          title: 'Add Chore',
          icon: '/logo192.png'
        }
      ]
    });
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(achievementTitle: string, points: number): Promise<void> {
    await this.sendNotification({
      title: 'Achievement Unlocked! 🏆',
      body: `You earned "${achievementTitle}" (+${points} points)`,
      icon: '/logo192.png',
      tag: 'achievement',
      data: {
        type: 'achievement',
        achievementTitle,
        points
      },
      actions: [
        {
          action: 'explore',
          title: 'View Achievements',
          icon: '/logo192.png'
        },
        {
          action: 'view_stats',
          title: 'View Stats',
          icon: '/logo192.png'
        }
      ]
    });
  }

  /**
   * Send Dusty personality notification
   */
  async sendDustyNotification(message: string, mood: string = 'neutral'): Promise<void> {
    const icons = {
      happy: '😊',
      grumpy: '😤',
      proud: '😌',
      neutral: '😐'
    };

    await this.sendNotification({
      title: `Dusty ${icons[mood as keyof typeof icons] || icons.neutral}`,
      body: message,
      icon: '/logo192.png',
      tag: 'dusty-message',
      data: {
        type: 'dusty-message',
        mood
      },
      actions: [
        {
          action: 'explore',
          title: 'Chat with Dusty',
          icon: '/logo192.png'
        }
      ]
    });
  }
} 