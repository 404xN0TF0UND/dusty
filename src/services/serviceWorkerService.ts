// Service Worker Integration Service
export class ServiceWorkerService {
  private static instance: ServiceWorkerService;
  private updateCallback?: () => void;
  private syncCallback?: (data: any) => void;

  static getInstance(): ServiceWorkerService {
    if (!ServiceWorkerService.instance) {
      ServiceWorkerService.instance = new ServiceWorkerService();
    }
    return ServiceWorkerService.instance;
  }

  /**
   * Register service worker and set up message listeners
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      // Check for waiting service worker
      this.checkForUpdates(registration);

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Check for service worker updates
   */
  private checkForUpdates(registration: ServiceWorkerRegistration) {
    if (registration.waiting) {
      this.notifyUpdateAvailable();
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && registration.waiting) {
            this.notifyUpdateAvailable();
          }
        });
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;

    switch (type) {
      case 'SW_UPDATE_AVAILABLE':
        this.notifyUpdateAvailable();
        break;
      case 'SYNC_OFFLINE_DATA':
        this.handleOfflineDataSync(data);
        break;
      default:
        console.log('Unknown service worker message:', type);
    }
  }

  /**
   * Notify app about available update
   */
  private notifyUpdateAvailable() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  /**
   * Handle offline data sync
   */
  private handleOfflineDataSync(data: any) {
    if (this.syncCallback) {
      this.syncCallback(data);
    }
  }

  /**
   * Set update callback
   */
  onUpdateAvailable(callback: () => void) {
    this.updateCallback = callback;
  }

  /**
   * Set sync callback
   */
  onOfflineDataSync(callback: (data: any) => void) {
    this.syncCallback = callback;
  }

  /**
   * Apply service worker update
   */
  async applyUpdate(): Promise<void> {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in (window.ServiceWorkerRegistration.prototype as any)) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: any): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage(message);
      }
    }
  }
} 