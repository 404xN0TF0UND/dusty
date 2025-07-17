import type { FieldValue } from 'firebase/firestore';

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dependencies?: string[]; // Array of chore IDs that must be completed first
  blocksOthers?: boolean; // Whether this chore blocks other chores
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  // avatarUrl?: string;
}

export interface ChoreFormData {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dependencies?: string[];
  blocksOthers?: boolean;
}

export interface ChoreFilters {
  status?: 'all' | 'pending' | 'completed' | 'overdue';
  assignee?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}

export interface DustyMessage {
  text: string;
  type: 'greeting' | 'chore_add' | 'chore_complete' | 'chore_claim' | 'chore_delete' | 'chore_edit' | 'no_chores' | 'overdue_chores' | 'all_completed' | 'error' | 'loading' | 'suggestion';
  timestamp: Date;
} 