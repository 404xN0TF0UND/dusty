import { Chore, User } from '../types';

// Only include a template for the current user for assignment
export const testUsers: User[] = [
  {
    id: 'user1',
    email: 'user1@example.com',
    displayName: 'You',
    role: 'member',
  },
];

export const testChores: Omit<Chore, 'id'>[] = [
  {
    title: 'Fix Leaky Kitchen Faucet',
    description: 'The kitchen faucet has been dripping for days. Need to replace the washer or call a plumber.',
    assigneeId: '',
    assigneeName: undefined,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    priority: 'high',
    category: 'maintenance',
    isRecurring: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Pay Electricity Bill',
    description: 'Electricity bill is due today. Late payment will incur additional fees.',
    assigneeId: 'currentUser',
    assigneeName: 'You',
    dueDate: new Date(),
    priority: 'high',
    category: 'shopping',
    isRecurring: true,
    recurrencePattern: 'monthly',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  // Add more chores as needed, but use assigneeId: '' or 'currentUser' only
];

export const addTestData = async () => {
  // This function would be called to populate the database with test data
  // In a real app, this would add the chores to Firestore
  console.log('Test data ready to be added to database');
  return testChores;
}; 