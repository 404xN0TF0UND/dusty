import { db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Chore } from '../types';

export class DataArchivingService {
  private static instance: DataArchivingService;
  private static ARCHIVE_DAYS = 90; // Archive chores completed more than 90 days ago
  private static BATCH_SIZE = 500; // Process in batches to avoid timeouts

  static getInstance(): DataArchivingService {
    if (!DataArchivingService.instance) {
      DataArchivingService.instance = new DataArchivingService();
    }
    return DataArchivingService.instance;
  }

  /**
   * Archive old completed chores
   */
  async archiveOldChores(): Promise<{ archived: number; errors: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DataArchivingService.ARCHIVE_DAYS);

    const q = query(
      collection(db, 'chores'),
      where('completedAt', '!=', null),
      where('completedAt', '<', Timestamp.fromDate(cutoffDate)),
      orderBy('completedAt', 'asc'),
      limit(DataArchivingService.BATCH_SIZE)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let archived = 0;
    let errors = 0;

    for (const docSnap of snapshot.docs) {
      try {
        const choreData = docSnap.data();
        
        // Add to archive collection
        await addDoc(collection(db, 'choresArchive'), {
          ...choreData,
          originalId: docSnap.id,
          archivedAt: serverTimestamp(),
          archivedBy: 'system'
        });

        // Delete from main collection
        batch.delete(docSnap.ref);
        archived++;
      } catch (error) {
        console.error('Failed to archive chore:', docSnap.id, error);
        errors++;
      }
    }

    if (archived > 0) {
      await batch.commit();
    }

    return { archived, errors };
  }

  /**
   * Archive specific chore
   */
  async archiveChore(choreId: string, archivedBy: string): Promise<boolean> {
    try {
      const choreRef = doc(db, 'chores', choreId);
      const choreDoc = await getDocs(query(collection(db, 'chores'), where('__name__', '==', choreId)));

      if (choreDoc.empty) {
        return false;
      }

      const choreData = choreDoc.docs[0].data();

      // Add to archive
      await addDoc(collection(db, 'choresArchive'), {
        ...choreData,
        originalId: choreId,
        archivedAt: serverTimestamp(),
        archivedBy
      });

      // Delete from main collection
      await deleteDoc(choreRef);

      return true;
    } catch (error) {
      console.error('Failed to archive chore:', choreId, error);
      return false;
    }
  }

  /**
   * Restore chore from archive
   */
  async restoreChore(originalId: string, restoredBy: string): Promise<boolean> {
    try {
      // Find in archive
      const archiveQuery = query(
        collection(db, 'choresArchive'),
        where('originalId', '==', originalId)
      );
      const archiveSnapshot = await getDocs(archiveQuery);

      if (archiveSnapshot.empty) {
        return false;
      }

      const archivedChore = archiveSnapshot.docs[0];
      const choreData = archivedChore.data();

      // Remove archive-specific fields
      const { originalId: originalIdField, archivedAt, archivedBy: archivedByField, ...restoredData } = choreData;

      // Add back to main collection
      await addDoc(collection(db, 'chores'), {
        ...restoredData,
        restoredAt: serverTimestamp(),
        restoredBy
      });

      // Delete from archive
      await deleteDoc(archivedChore.ref);

      return true;
    } catch (error) {
      console.error('Failed to restore chore:', originalId, error);
      return false;
    }
  }

  /**
   * Get archived chores
   */
  async getArchivedChores(options: {
    limit?: number;
    startAfter?: any;
  } = {}): Promise<{ chores: any[]; lastDoc?: any }> {
    const { limit: limitCount = 20, startAfter: startAfterDoc } = options;

    let q = query(
      collection(db, 'choresArchive'),
      orderBy('archivedAt', 'desc'),
      limit(limitCount)
    );

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const chores: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      chores.push({
        id: doc.id,
        ...data,
        dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined,
        archivedAt: data.archivedAt.toDate()
      });
    });

    return {
      chores,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<{
    totalArchived: number;
    oldestArchived: Date | null;
    newestArchived: Date | null;
  }> {
    const snapshot = await getDocs(collection(db, 'choresArchive'));
    
    let totalArchived = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalArchived++;

      const archivedDate = data.archivedAt.toDate();
      
      if (!oldestDate || archivedDate < oldestDate) {
        oldestDate = archivedDate;
      }
      
      if (!newestDate || archivedDate > newestDate) {
        newestDate = archivedDate;
      }
    });

    return {
      totalArchived,
      oldestArchived: oldestDate,
      newestArchived: newestDate
    };
  }

  /**
   * Clean up old archive entries (optional - for very old data)
   */
  async cleanupOldArchives(daysToKeep: number = 365): Promise<{ deleted: number; errors: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const q = query(
      collection(db, 'choresArchive'),
      where('archivedAt', '<', Timestamp.fromDate(cutoffDate)),
      orderBy('archivedAt', 'asc'),
      limit(DataArchivingService.BATCH_SIZE)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let deleted = 0;
    let errors = 0;

    for (const docSnap of snapshot.docs) {
      try {
        batch.delete(docSnap.ref);
        deleted++;
      } catch (error) {
        console.error('Failed to delete old archive:', docSnap.id, error);
        errors++;
      }
    }

    if (deleted > 0) {
      await batch.commit();
    }

    return { deleted, errors };
  }

  /**
   * Schedule automatic archiving (call this periodically)
   */
  async scheduleArchiving(): Promise<void> {
    try {
      const result = await this.archiveOldChores();
      console.log(`Archiving completed: ${result.archived} archived, ${result.errors} errors`);
    } catch (error) {
      console.error('Scheduled archiving failed:', error);
    }
  }
} 