import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { Chore, User } from '../types';

export class FirestoreService {
  private static instance: FirestoreService;

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // ===== CHORES OPERATIONS =====

  /**
   * Get chores with pagination and filtering
   */
  async getChores(options: {
    assigneeId?: string;
    status?: 'pending' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    limit?: number;
    startAfter?: QueryDocumentSnapshot<DocumentData>;
    orderBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<{ chores: Chore[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    const {
      assigneeId,
      status,
      priority,
      category,
      limit: limitCount = 20,
      startAfter: startAfterDoc,
      orderBy: orderByField = 'createdAt',
      orderDirection = 'desc'
    } = options;

    let q = query(collection(db, 'chores'));

    // Apply filters
    if (assigneeId !== undefined) {
      q = query(q, where('assigneeId', '==', assigneeId));
    }

    if (status === 'completed') {
      q = query(q, where('completedAt', '!=', null));
    } else if (status === 'pending') {
      q = query(q, where('completedAt', '==', null));
    }

    if (priority) {
      q = query(q, where('priority', '==', priority));
    }

    if (category) {
      q = query(q, where('category', '==', category));
    }

    // Apply ordering
    q = query(q, orderBy(orderByField, orderDirection));

    // Apply pagination
    q = query(q, limit(limitCount));

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const chores: Chore[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      chores.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined
      } as Chore);
    });

    return {
      chores,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  }

  /**
   * Get chore by ID
   */
  async getChore(choreId: string): Promise<Chore | null> {
    const docRef = doc(db, 'chores', choreId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined
      } as Chore;
    }

    return null;
  }

  /**
   * Add a new chore
   */
  async addChore(choreData: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'chores'), {
      ...choreData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Update a chore
   */
  async updateChore(choreId: string, updates: Partial<Chore>): Promise<void> {
    const docRef = doc(db, 'chores', choreId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Delete a chore
   */
  async deleteChore(choreId: string): Promise<void> {
    const docRef = doc(db, 'chores', choreId);
    await deleteDoc(docRef);
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Batch update multiple chores
   */
  async batchUpdateChores(updates: Array<{ id: string; updates: Partial<Chore> }>): Promise<void> {
    const batch = writeBatch(db);

    updates.forEach(({ id, updates: updateData }) => {
      const docRef = doc(db, 'chores', id);
      batch.update(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  }

  /**
   * Batch delete multiple chores
   */
  async batchDeleteChores(choreIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    choreIds.forEach(id => {
      const docRef = doc(db, 'chores', id);
      batch.delete(docRef);
    });

    await batch.commit();
  }

  /**
   * Batch assign chores to a user
   */
  async batchAssignChores(choreIds: string[], assigneeId: string, assigneeName: string): Promise<void> {
    const batch = writeBatch(db);

    choreIds.forEach(id => {
      const docRef = doc(db, 'chores', id);
      batch.update(docRef, {
        assigneeId,
        assigneeName,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  }

  // ===== USERS OPERATIONS =====

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role
      } as User;
    }

    return null;
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const users: User[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role
      } as User);
    });

    return users;
  }

  /**
   * Create or update user
   */
  async setUser(userId: string, userData: Omit<User, 'id' | 'createdAt'>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update existing user
      await updateDoc(docRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new user
      await updateDoc(docRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  // ===== TRANSACTIONS =====

  /**
   * Complete a chore with transaction (ensures data consistency)
   */
  async completeChore(choreId: string, completedBy: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const choreRef = doc(db, 'chores', choreId);
      const choreDoc = await transaction.get(choreRef);

      if (!choreDoc.exists()) {
        throw new Error('Chore not found');
      }

      const choreData = choreDoc.data();
      if (choreData.completedAt) {
        throw new Error('Chore already completed');
      }

      transaction.update(choreRef, {
        completedAt: serverTimestamp(),
        completedBy,
        updatedAt: serverTimestamp()
      });
    });
  }

  // ===== STATISTICS =====

  /**
   * Get chore statistics
   */
  async getChoreStats(userId?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const choresQuery = userId 
      ? query(collection(db, 'chores'), where('assigneeId', '==', userId))
      : query(collection(db, 'chores'));

    const snapshot = await getDocs(choresQuery);
    const now = new Date();

    const stats = {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      byPriority: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;

      if (data.completedAt) {
        stats.completed++;
      } else {
        stats.pending++;
        
        // Check if overdue
        if (data.dueDate && data.dueDate.toDate() < now) {
          stats.overdue++;
        }
      }

      // Count by priority
      const priority = data.priority || 'medium';
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // Count by category
      const category = data.category || 'other';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  }

  // ===== DATA VALIDATION =====

  /**
   * Validate chore data before saving
   */
  validateChoreData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (data.title && data.title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
      errors.push('Priority must be low, medium, or high');
    }

    if (data.category && typeof data.category !== 'string') {
      errors.push('Category must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate user data before saving
   */
  validateUserData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.displayName || typeof data.displayName !== 'string' || data.displayName.trim().length === 0) {
      errors.push('Display name is required');
    }

    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (data.role && !['admin', 'member'].includes(data.role)) {
      errors.push('Role must be admin or member');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 