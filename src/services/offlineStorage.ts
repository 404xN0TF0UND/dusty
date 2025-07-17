import { Chore, User } from '../types';

interface OfflineChore extends Chore {
  offlineId?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastModified: Date;
}

interface OfflineData {
  chores: OfflineChore[];
  users: User[];
  lastSync: Date;
}

export class OfflineStorageService {
  private static DB_NAME = 'DustyChoresDB';
  private static DB_VERSION = 1;
  private static CHORES_STORE = 'chores';
  private static USERS_STORE = 'users';
  private static SYNC_STORE = 'sync';

  private static db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  static async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create chores store
        if (!db.objectStoreNames.contains(this.CHORES_STORE)) {
          const choresStore = db.createObjectStore(this.CHORES_STORE, { keyPath: 'id' });
          choresStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          choresStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Create users store
        if (!db.objectStoreNames.contains(this.USERS_STORE)) {
          db.createObjectStore(this.USERS_STORE, { keyPath: 'id' });
        }

        // Create sync store
        if (!db.objectStoreNames.contains(this.SYNC_STORE)) {
          db.createObjectStore(this.SYNC_STORE, { keyPath: 'id' });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  /**
   * Store chore offline
   */
  static async storeChore(chore: Chore, syncStatus: 'pending' | 'synced' = 'pending'): Promise<void> {
    if (!this.db) await this.init();

    const offlineChore: OfflineChore = {
      ...chore,
      syncStatus,
      lastModified: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHORES_STORE], 'readwrite');
      const store = transaction.objectStore(this.CHORES_STORE);
      const request = store.put(offlineChore);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all offline chores
   */
  static async getOfflineChores(): Promise<OfflineChore[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHORES_STORE], 'readonly');
      const store = transaction.objectStore(this.CHORES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending chores that need to be synced
   */
  static async getPendingChores(): Promise<OfflineChore[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHORES_STORE], 'readonly');
      const store = transaction.objectStore(this.CHORES_STORE);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update chore sync status
   */
  static async updateChoreSyncStatus(choreId: string, status: 'synced' | 'failed'): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHORES_STORE], 'readwrite');
      const store = transaction.objectStore(this.CHORES_STORE);
      const getRequest = store.get(choreId);

      getRequest.onsuccess = () => {
        const chore = getRequest.result;
        if (chore) {
          chore.syncStatus = status;
          chore.lastModified = new Date();
          const putRequest = store.put(chore);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete chore from offline storage
   */
  static async deleteOfflineChore(choreId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.CHORES_STORE], 'readwrite');
      const store = transaction.objectStore(this.CHORES_STORE);
      const request = store.delete(choreId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store user data offline
   */
  static async storeUser(user: User): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.USERS_STORE], 'readwrite');
      const store = transaction.objectStore(this.USERS_STORE);
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get offline users
   */
  static async getOfflineUsers(): Promise<User[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.USERS_STORE], 'readonly');
      const store = transaction.objectStore(this.USERS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store sync metadata
   */
  static async storeSyncMetadata(data: { lastSync: Date; pendingCount: number }): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_STORE], 'readwrite');
      const store = transaction.objectStore(this.SYNC_STORE);
      const request = store.put({
        id: 'metadata',
        ...data
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get sync metadata
   */
  static async getSyncMetadata(): Promise<{ lastSync: Date; pendingCount: number } | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_STORE], 'readonly');
      const store = transaction.objectStore(this.SYNC_STORE);
      const request = store.get('metadata');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all offline data
   */
  static async clearAllData(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([
        this.CHORES_STORE, 
        this.USERS_STORE, 
        this.SYNC_STORE
      ], 'readwrite');

      const choresStore = transaction.objectStore(this.CHORES_STORE);
      const usersStore = transaction.objectStore(this.USERS_STORE);
      const syncStore = transaction.objectStore(this.SYNC_STORE);

      const choresRequest = choresStore.clear();
      const usersRequest = usersStore.clear();
      const syncRequest = syncStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get offline data summary
   */
  static async getOfflineSummary(): Promise<{
    totalChores: number;
    pendingChores: number;
    lastSync: Date | null;
  }> {
    const [chores, metadata] = await Promise.all([
      this.getOfflineChores(),
      this.getSyncMetadata()
    ]);

    const pendingChores = chores.filter(chore => chore.syncStatus === 'pending').length;

    return {
      totalChores: chores.length,
      pendingChores,
      lastSync: metadata?.lastSync || null
    };
  }
} 