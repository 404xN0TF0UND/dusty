import { Chore, User } from '../types';
import { db } from './firebase';
import { collection, writeBatch, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface BulkOperation {
  type: 'complete' | 'delete' | 'assign' | 'update';
  choreIds: string[];
  data?: any;
}

export class BulkOperationsService {
  /**
   * Complete multiple chores at once
   */
  static async bulkComplete(choreIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date();

    choreIds.forEach(choreId => {
      const choreRef = doc(db, 'chores', choreId);
      batch.update(choreRef, {
        completedAt: now,
        updatedAt: now
      });
    });

    await batch.commit();
  }

  /**
   * Delete multiple chores at once
   */
  static async bulkDelete(choreIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    choreIds.forEach(choreId => {
      const choreRef = doc(db, 'chores', choreId);
      batch.delete(choreRef);
    });

    await batch.commit();
  }

  /**
   * Assign multiple chores to a user
   */
  static async bulkAssign(choreIds: string[], assigneeId: string, assigneeName: string): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date();

    choreIds.forEach(choreId => {
      const choreRef = doc(db, 'chores', choreId);
      batch.update(choreRef, {
        assigneeId,
        assigneeName,
        updatedAt: now
      });
    });

    await batch.commit();
  }

  /**
   * Update multiple chores with the same data
   */
  static async bulkUpdate(choreIds: string[], updateData: Partial<Chore>): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date();

    // Clean undefined values for Firestore
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    choreIds.forEach(choreId => {
      const choreRef = doc(db, 'chores', choreId);
      batch.update(choreRef, {
        ...cleanData,
        updatedAt: now
      });
    });

    await batch.commit();
  }

  /**
   * Get chores that can be bulk operated on
   */
  static getBulkEligibleChores(chores: Chore[], currentUser: User): Chore[] {
    if (currentUser.role === 'admin') {
      return chores;
    }
    
    // Members can only bulk operate on their own chores and unassigned chores
    return chores.filter(chore => 
      chore.assigneeId === currentUser.id || !chore.assigneeId
    );
  }

  /**
   * Check if chores can be completed (all dependencies met)
   */
  static getCompletableChores(chores: Chore[]): Chore[] {
    return chores.filter(chore => {
      if (chore.completedAt) return false;
      
      // Check if all dependencies are completed
      if (chore.dependencies && chore.dependencies.length > 0) {
        const dependencies = chores.filter(dep => chore.dependencies!.includes(dep.id));
        return dependencies.every(dep => dep.completedAt);
      }
      
      return true;
    });
  }

  /**
   * Get statistics for bulk operations
   */
  static getBulkStats(chores: Chore[], selectedIds: string[]) {
    const selectedChores = chores.filter(chore => selectedIds.includes(chore.id));
    
    return {
      total: selectedChores.length,
      completed: selectedChores.filter(chore => chore.completedAt).length,
      pending: selectedChores.filter(chore => !chore.completedAt).length,
      overdue: selectedChores.filter(chore => {
        if (chore.completedAt || !chore.dueDate) return false;
        return new Date() > chore.dueDate;
      }).length,
      unassigned: selectedChores.filter(chore => !chore.assigneeId).length,
      highPriority: selectedChores.filter(chore => chore.priority === 'high').length,
      mediumPriority: selectedChores.filter(chore => chore.priority === 'medium').length,
      lowPriority: selectedChores.filter(chore => chore.priority === 'low').length,
    };
  }
} 