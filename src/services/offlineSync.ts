import { Chore, User } from '../types';
import { OfflineStorageService } from './offlineStorage';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { notificationService } from './notificationService';

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncQueue: Array<{ action: string; data: any; timestamp: number }> = [];

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Initialize the offline sync service
   */
  static async init(): Promise<void> {
    const instance = OfflineSyncService.getInstance();
    console.log('OfflineSyncService initialized');
  }

  /**
   * Handle service worker messages
   */
  static async handleServiceWorkerMessage(event: MessageEvent): Promise<void> {
    const { type, data } = event.data;
    
    if (type === 'SYNC_OFFLINE_DATA') {
      const instance = OfflineSyncService.getInstance();
      await instance.processQueuedActions();
    }
  }

  /**
   * Get offline summary
   */
  static async getOfflineSummary(): Promise<{ totalChores: number; pendingChores: number; lastSync: Date | null }> {
    const totalChores = (await OfflineStorageService.getOfflineChores()).length;
    const pendingChores = (await OfflineStorageService.getPendingChores()).length;
    const meta = await OfflineStorageService.getSyncMetadata();
    return {
      totalChores,
      pendingChores,
      lastSync: meta?.lastSync ? new Date(meta.lastSync) : null
    };
  }

  /**
   * Sync pending data
   */
  static async syncPendingData(): Promise<void> {
    const instance = OfflineSyncService.getInstance();
    await instance.processQueuedActions();
  }

  /**
   * Queue an action for background sync
   */
  async queueAction(action: string, data: any): Promise<void> {
    const queueItem = {
      action,
      data,
      timestamp: Date.now()
    };

    this.syncQueue.push(queueItem);
    await OfflineStorageService.storeSyncMetadata({
      lastSync: new Date(),
      pendingCount: this.syncQueue.length
    });
    
    console.log('Queued action for background sync:', action);
  }

  /**
   * Process queued actions when back online
   */
  async processQueuedActions(): Promise<void> {
    // For demonstration, just clear the queue and update metadata
    if (this.syncQueue.length === 0) {
      console.log('No queued actions to process');
      return;
    }

    console.log('Processing queued actions:', this.syncQueue.length);
    this.syncQueue = [];
    await OfflineStorageService.storeSyncMetadata({
      lastSync: new Date(),
      pendingCount: 0
    });
  }

  /**
   * Process a single queued action
   */
  private async processAction(item: { action: string; data: any; timestamp: number }): Promise<void> {
    switch (item.action) {
      case 'ADD_CHORE':
        await this.syncAddChore(item.data);
        break;
      case 'COMPLETE_CHORE':
        await this.syncCompleteChore(item.data);
        break;
      case 'UPDATE_CHORE':
        await this.syncUpdateChore(item.data);
        break;
      case 'DELETE_CHORE':
        await this.syncDeleteChore(item.data);
        break;
      default:
        console.warn('Unknown action type:', item.action);
    }
  }

  /**
   * Sync add chore action
   */
  private async syncAddChore(data: any): Promise<void> {
    // This would integrate with your Firestore service
    console.log('Syncing add chore:', data);
    // Implementation would depend on your Firestore setup
  }

  /**
   * Sync complete chore action
   */
  private async syncCompleteChore(data: any): Promise<void> {
    console.log('Syncing complete chore:', data);
    // Implementation would depend on your Firestore setup
  }

  /**
   * Sync update chore action
   */
  private async syncUpdateChore(data: any): Promise<void> {
    console.log('Syncing update chore:', data);
    // Implementation would depend on your Firestore setup
  }

  /**
   * Sync delete chore action
   */
  private async syncDeleteChore(data: any): Promise<void> {
    console.log('Syncing delete chore:', data);
    // Implementation would depend on your Firestore setup
  }

  /**
   * Get sync queue status
   */
  async getSyncStatus(): Promise<{ pending: number; lastSync: Date | null }> {
    const meta = await OfflineStorageService.getSyncMetadata();
    return {
      pending: meta?.pendingCount || 0,
      lastSync: meta?.lastSync ? new Date(meta.lastSync) : null
    };
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await OfflineStorageService.storeSyncMetadata({
      lastSync: new Date(),
      pendingCount: 0
    });
    console.log('Sync queue cleared');
  }
} 