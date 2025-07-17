import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChoreList } from './components/ChoreList';
import { ChoreForm } from './components/ChoreForm';
import { MobileNav } from './components/MobileNav';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DustyBubble } from './components/DustyBubble';
import { ThemeToggle } from './components/ThemeToggle';
import { ChoreFilters } from './components/ChoreFilters';
import { OfflineStatus } from './components/OfflineStatus';
import { VirtualizedChoreList } from './components/VirtualizedChoreList';
import { 
  LazyChoreStats, 
  LazyChoreTemplates, 
  LazyPerformanceDashboard, 
  LazyAchievementDisplay, 
  LazyDustyChat, 
  LazyNotificationSettingsPanel
} from './components/LazyComponents';
import { Chore, DustyMessage, User, ChoreFormData, ChoreFilters as ChoreFiltersType } from './types';
import { db } from './services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  or,
  collection as fsCollection,
  getDocs,
  setDoc,
  doc as fsDoc,
  serverTimestamp as fsServerTimestamp,
  getDoc
} from 'firebase/firestore';
import './App.css';
import { PerformanceMonitoringService } from './services/performanceMonitoring';
import { PerformanceOptimizationService } from './services/performanceOptimization';
import { dustyPersonality } from './services/dustyPersonality';
import { AchievementService, Achievement } from './services/achievementService';
import { notificationService } from './services/notificationService';
import { ChoreDependencyService } from './services/choreDependencies';
import { OfflineSyncService } from './services/offlineSync';
import { testChores } from './services/testData';
import { LazyLoadingService } from './services/lazyLoadingService';
import { ServiceWorkerService } from './services/serviceWorkerService';
import { DatabaseOptimizationService } from './services/databaseOptimizationService';
import { UpdatePrompt } from './components/UpdatePrompt';
import './components/LazyComponents.css';
import './components/PerformanceDashboard.css';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import './components/PWAInstallPrompt.css';
import './components/Toast.css';
import { UserManagementPanel } from './components/UserManagementPanel';
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Add missing helper and component definitions at the top after imports

// Helper to safely format Firestore Timestamp, Date, or FieldValue
function safeFormatDate(date: any): string {
  if (!date) return '—';
  if (typeof date === 'object' && 'toDate' in date) return date.toDate().toLocaleDateString();
  if (date instanceof Date) return date.toLocaleDateString();
  return '—';
}

// Fetch changelog.json
async function fetchChangelog() {
  const res = await fetch('/changelog.json');
  return await res.json();
}

// SignInForm component
const SignInForm: React.FC = () => {
  console.log('SignInForm rendered');
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    console.log("Sign in button clicked");
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      console.log("signInWithGoogle completed");
    } catch (err: any) {
      console.error("handleGoogle error:", err);
      setError(err.message || 'Google sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Dusty's Chores</h1>
      <p>Your grumpy butler awaits...</p>
      <button type="button" className="btn btn-secondary" onClick={handleGoogle}>
        Sign In with Google
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

// WhatsNewModal component
const WhatsNewModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [changelog, setChangelog] = useState<any>(null);
  useEffect(() => {
    if (open) {
      fetchChangelog().then(setChangelog);
    }
  }, [open]);
  if (!open || !changelog) return null;
  const latest = changelog[0];
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🚀 What’s New <span style={{ fontSize: '1rem', color: '#888' }}>v{latest.version}</span></h2>
        <div style={{ fontSize: '0.95rem', color: '#aaa', marginBottom: 8 }}>{latest.date}</div>
        <ul>
          {latest.changes.map((c: string, i: number) => <li key={i}>{c}</li>)}
        </ul>
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// --- Main App Logic ---
const AppContent: React.FC = () => {
  const { currentUser, loading, toggleRole, signOutUser } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [dustyMessage, setDustyMessage] = useState<DustyMessage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isFromTemplate, setIsFromTemplate] = useState(false);
  const [currentSection, setCurrentSection] = useState<'home' | 'add' | 'profile' | 'stats' | 'sms'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<Date>(new Date());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [choresLoading, setChoresLoading] = useState(true);
  const [filters, setFilters] = useState<ChoreFiltersType>({});
  const [selectedChoreIds, setSelectedChoreIds] = useState<string[]>([]);
  const [isPerformanceDashboardOpen, setIsPerformanceDashboardOpen] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [achievementNotification, setAchievementNotification] = useState<Achievement | null>(null);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const installPromptEvent = useRef<Event | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserMgmt, setShowUserMgmt] = useState(false);
  // const [avatarUploading, setAvatarUploading] = useState(false);
  // const [avatarError, setAvatarError] = useState<string | null>(null);

  // Show What's New modal on login (once per version)
  useEffect(() => {
    fetchChangelog().then((changelog) => {
      const latestVersion = changelog[0]?.version;
      const seen = localStorage.getItem('whatsnew-version');
      if (latestVersion && seen !== latestVersion) {
        setShowWhatsNew(true);
        localStorage.setItem('whatsnew-version', latestVersion);
      }
    });
  }, []);

  // On login, ensure user is in Firestore users collection
  useEffect(() => {
    if (!currentUser) return;
    const usersRef = fsCollection(db, 'users');
    const userDoc = fsDoc(db, 'users', currentUser.id);
    (async () => {
      // Check if user doc exists
      const userSnap = await getDoc(userDoc);
      if (!userSnap.exists()) {
        await setDoc(userDoc, {
          id: currentUser.id,
          displayName: currentUser.displayName,
          email: currentUser.email,
          role: 'member', // Default to member
          createdAt: fsServerTimestamp(),
          lastLoginAt: fsServerTimestamp(),
          avatarUrl: '/logo192.png' // Fallback to default avatar
        });
      }
      // Fetch all users
      const all = await getDocs(usersRef);
      setAllUsers(all.docs.map(doc => doc.data() as User));
    })();
  }, [currentUser]);

  // Initialize performance monitoring and service worker
  useEffect(() => {
    PerformanceMonitoringService.init();
    
    // Initialize database optimization
    DatabaseOptimizationService.getInstance().init();
    
    // Register service worker
    ServiceWorkerService.getInstance().register().then(() => {
      // Set up update callback
      ServiceWorkerService.getInstance().onUpdateAvailable(() => {
        setIsUpdateAvailable(true);
      });
    });
    
    // Clean up expired cache periodically
    const cacheCleanupInterval = setInterval(() => {
      PerformanceOptimizationService.clearExpiredCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      PerformanceMonitoringService.cleanup();
      clearInterval(cacheCleanupInterval);
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Show toast helper
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  // Real-time Firestore listener with role-based filtering
  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (currentUser.role === 'admin') {
      // Admins see all chores
      q = query(collection(db, 'chores'), orderBy('createdAt', 'desc'));
    } else {
      // Regular users see their own chores + unassigned chores
      q = query(
        collection(db, 'chores'),
        or(
          where('assigneeId', '==', currentUser.id),
          where('assigneeId', '==', '')
        ),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const choresData: Chore[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dueDate: data.dueDate ? 
            (typeof data.dueDate === 'object' && 'toDate' in data.dueDate ? 
              (data.dueDate as any).toDate() : new Date(data.dueDate)) : 
            undefined,
          createdAt: data.createdAt ? data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt) : new Date(),
        } as Chore;
      });
      setChores(choresData);
      setChoresLoading(false);
      
      // Check for overdue chores and send notifications
      notificationService.checkOverdueChores(choresData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Daily reminder system
  useEffect(() => {
    if (!currentUser) return;

    const checkDailyReminder = () => {
      const now = new Date();
      const lastReminder = localStorage.getItem('lastDailyReminder');
      
      if (lastReminder) {
        const lastDate = new Date(lastReminder);
        const daysSinceLastReminder = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastReminder >= 1) {
          notificationService.sendDailyReminderIfNeeded(chores);
          localStorage.setItem('lastDailyReminder', now.toISOString());
        }
      } else {
        // First time user, send reminder tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        localStorage.setItem('lastDailyReminder', tomorrow.toISOString());
      }
    };

    // Check for daily reminder every hour
    const reminderInterval = setInterval(checkDailyReminder, 60 * 60 * 1000);
    
    // Initial check
    checkDailyReminder();

    return () => clearInterval(reminderInterval);
  }, [currentUser, chores]);

  // Smart suggestion system
  useEffect(() => {
    if (!currentUser) return;

    const checkForSmartSuggestion = async () => {
      const now = new Date();
      const timeSinceLastSuggestion = now.getTime() - lastSuggestionTime.getTime();
      const minutesSinceLastSuggestion = timeSinceLastSuggestion / (1000 * 60);
      
      // Suggest every 30 minutes if user has uncompleted chores
      if (minutesSinceLastSuggestion >= 30) {
        const uncompletedChores = chores.filter(chore => 
          !chore.completedAt && 
          (chore.assigneeId === currentUser.id || chore.assigneeId === '')
        );
        
        if (uncompletedChores.length > 0) {
          const suggestion = await dustyPersonality.getContextualSuggestion(currentUser.id);
          setDustyMessage({
            text: suggestion,
            type: 'suggestion',
            timestamp: new Date()
          });
          setLastSuggestionTime(now);
        }
      }
    };

    // Check for suggestions every 5 minutes
    const suggestionInterval = setInterval(checkForSmartSuggestion, 5 * 60 * 1000);
    
    // Initial check after 5 minutes
    const initialCheck = setTimeout(checkForSmartSuggestion, 5 * 60 * 1000);

    return () => {
      clearInterval(suggestionInterval);
      clearTimeout(initialCheck);
    };
  }, [currentUser, chores, lastSuggestionTime]);

  // Initialize offline support
  useEffect(() => {
    if (currentUser) {
      // Initialize offline sync service
      (async () => {
        await OfflineSyncService.init();
      })();
      
      // Register service worker message handler
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        OfflineSyncService.handleServiceWorkerMessage(event);
      };
      
      navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [currentUser]);

  // Listen for service worker notification actions
  useEffect(() => {
    const handleSWMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'COMPLETE_CHORE_FROM_NOTIFICATION' && event.data.choreId) {
        try {
          const ref = doc(db, 'chores', event.data.choreId);
          await updateDoc(ref, {
            completedAt: new Date(),
            updatedAt: new Date(),
          });
          showToast('Chore marked as complete!', 'success');
        } catch (err) {
          showToast('Failed to complete chore.', 'error');
        }
      }
      if (event.data?.type === 'SNOOZE_CHORE_FROM_NOTIFICATION' && event.data.choreId) {
        try {
          const snoozeDays = event.data.snoozeDays || 1;
          const ref = doc(db, 'chores', event.data.choreId);
          // Get current due date
          const chore = chores.find(c => c.id === event.data.choreId);
          let newDueDate = new Date();
          if (chore && chore.dueDate) {
            newDueDate = new Date(chore.dueDate);
            newDueDate.setDate(newDueDate.getDate() + snoozeDays);
          } else {
            newDueDate.setDate(newDueDate.getDate() + snoozeDays);
          }
          await updateDoc(ref, {
            dueDate: newDueDate,
            updatedAt: new Date(),
          });
          showToast(`Chore snoozed for ${snoozeDays} day${snoozeDays > 1 ? 's' : ''}!`, 'info');
        } catch (err) {
          showToast('Failed to snooze chore.', 'error');
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [chores]);

  // Load personality data
  useEffect(() => {
    const loadPersonality = async () => {
      await dustyPersonality.loadPersonality();
      if (currentUser) {
        const greeting = await dustyPersonality.getContextualGreeting(currentUser.id, currentUser.displayName);
        setDustyMessage({
          text: greeting,
          type: 'greeting',
          timestamp: new Date()
        });
        
        // Initialize notifications and send welcome notification
        notificationService.init();
        await notificationService.sendWelcomeNotification(currentUser.displayName);
      }
    };
    loadPersonality();
  }, [currentUser]);

  // Check for new achievements after chore completion
  useEffect(() => {
    if (!currentUser || chores.length === 0) return;

    const newAchievements = AchievementService.checkForNewAchievements(currentUser.id, chores);
    
    if (newAchievements.length > 0) {
      // Show achievement notification
      const achievement = newAchievements[0]; // Show first achievement
      setAchievementNotification(achievement);
    }
  }, [chores, currentUser]);

  // Listen for sync completion (when coming back online)
  useEffect(() => {
    if (!isOnline) return;
    // Check if there were pending actions and now synced
    const checkSync = async () => {
      const summary = await OfflineSyncService.getOfflineSummary();
      if (summary.pendingChores === 0 && summary.lastSync && summary.lastSync > new Date(Date.now() - 60000)) {
        showToast('All changes synced!', 'success');
      }
    };
    checkSync();
  }, [isOnline]);

  // Helper function to clean data for Firestore (remove undefined values)
  const cleanDataForFirestore = (data: any) => {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        cleaned[key] = data[key];
      }
    });
    return cleaned;
  };

  // Add or edit chore in Firestore
  const handleFormSubmit = async (formData: ChoreFormData) => {
    try {
      console.log('Submitting chore data:', formData);
      if (editingChore) {
        // Edit existing chore
        console.log('Editing chore:', editingChore.id);
        const ref = doc(db, 'chores', editingChore.id);
        const updateData = cleanDataForFirestore({
          ...formData,
          updatedAt: serverTimestamp(),
          assigneeName: formData.assigneeId ? allUsers.find(u => u.id === formData.assigneeId)?.displayName : undefined,
          dependencies: formData.dependencies || [],
          blocksOthers: formData.blocksOthers || false,
        });
        await updateDoc(ref, updateData);
        console.log('Chore updated successfully');
        const editResponse = await dustyPersonality.getChoreEditResponse();
        setDustyMessage({
          text: editResponse,
          type: 'chore_edit',
          timestamp: new Date()
        });
      } else {
        // Add new chore
        console.log('Adding new chore to Firestore...');
        const choreData = cleanDataForFirestore({
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          assigneeName: formData.assigneeId ? allUsers.find(u => u.id === formData.assigneeId)?.displayName : undefined,
          dependencies: formData.dependencies || [],
          blocksOthers: formData.blocksOthers || false,
        });
        const docRef = await addDoc(collection(db, 'chores'), choreData);
        console.log('Chore added successfully with ID:', docRef.id);
        const addResponse = await dustyPersonality.getChoreAddResponse();
        setDustyMessage({
          text: addResponse,
          type: 'chore_add',
          timestamp: new Date()
        });
        
        // Send assignment notification if chore is assigned to someone
        if (formData.assigneeId && formData.assigneeId !== currentUser?.id) {
          const assignee = allUsers.find(u => u.id === formData.assigneeId);
          if (assignee) {
            await notificationService.sendChoreAssignedNotification(
              formData.title,
              assignee.displayName
            );
          }
        }
      }
    } catch (err) {
      console.error('Error in handleFormSubmit:', err);
      const errorResponse = await dustyPersonality.getErrorMessage();
      setDustyMessage({
        text: errorResponse,
        type: 'error',
        timestamp: new Date()
      });
    }
    setIsFormOpen(false);
    setEditingChore(null);
  };

  // Optimized event handlers with useCallback
  const handleChoreComplete = useCallback(async (choreId: string) => {
    try {
      const targetChore = chores.find(c => c.id === choreId);
      if (!targetChore) {
        throw new Error('Chore not found');
      }

      // Check if all dependencies are completed
      if (!ChoreDependencyService.canCompleteChore(targetChore, chores)) {
        const dependencies = ChoreDependencyService.getDependencies(targetChore, chores);
        const pendingDeps = dependencies.filter((d: Chore) => !d.completedAt);
        setDustyMessage({
          text: `Cannot complete "${targetChore.title}" - waiting for: ${pendingDeps.map((d: Chore) => d.title).join(', ')}`,
          type: 'error',
          timestamp: new Date()
        });
        return;
      }

      const ref = doc(db, 'chores', choreId);
      await updateDoc(ref, { completedAt: new Date(), updatedAt: serverTimestamp() });
      
      // Update user context
      if (currentUser) {
        const context = dustyPersonality.getUserContext(currentUser.id);
        const completedChores = chores.filter(c => c.completedAt && c.assigneeId === currentUser.id).length + 1;
        const totalChores = chores.filter(c => c.assigneeId === currentUser.id).length;
        
        dustyPersonality.updateUserContext(currentUser.id, {
          completedChores,
          totalChores,
          lastChoreCompleted: targetChore.title,
          lastChoreCompletedAt: new Date(),
          streak: (context?.streak || 0) + 1
        });
        
        // Update Dusty's mood based on productivity
        if (completedChores > totalChores * 0.7) {
          dustyPersonality.updateDustyMood('productive', 'User is being productive');
        }
      }
      
      // Get the chore title for the notification
      const choreTitle = targetChore.title;
      
      const completeResponse = await dustyPersonality.getChoreCompleteResponse();
      setDustyMessage({
        text: completeResponse,
        type: 'chore_complete',
        timestamp: new Date()
      });
      
      // Send completion notification
      await notificationService.sendCompletionNotification(choreTitle);
      
      // Send admin notification if current user is admin
      if (currentUser?.role === 'admin') {
        await notificationService.sendAdminCompletionNotification(
          choreTitle,
          targetChore.assigneeName || 'Unknown'
        );
      }
    } catch (err) {
      const errorResponse = await dustyPersonality.getErrorMessage();
      setDustyMessage({
        text: errorResponse,
        type: 'error',
        timestamp: new Date()
      });
    }
  }, [chores, currentUser]);

  const handleChoreClaim = useCallback(async (choreId: string) => {
    if (!currentUser) return;
    try {
      const ref = doc(db, 'chores', choreId);
      await updateDoc(ref, {
        assigneeId: currentUser.id,
        assigneeName: currentUser.displayName,
        updatedAt: serverTimestamp(),
      });
      const claimResponse = await dustyPersonality.getChoreClaimResponse();
      setDustyMessage({
        text: claimResponse,
        type: 'chore_claim',
        timestamp: new Date()
      });
      
      // Send assignment notification for claimed chore
      const chore = chores.find(c => c.id === choreId);
      if (chore) {
        await notificationService.sendChoreAssignedNotification(
          chore.title,
          currentUser.displayName
        );
      }
    } catch (err) {
      const errorResponse = await dustyPersonality.getErrorMessage();
      setDustyMessage({
        text: errorResponse,
        type: 'error',
        timestamp: new Date()
      });
    }
  }, [currentUser, chores]);

  const handleChoreEdit = (chore: Chore) => {
    setEditingChore(chore);
    setIsFormOpen(true);
  };

  const handleChoreDelete = (choreId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    setConfirmDialog({
      open: true,
      title: 'Delete Chore',
      message: `Are you sure you want to delete "${chore.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'chores', choreId));
          const deleteResponse = await dustyPersonality.getChoreDeleteResponse();
          setDustyMessage({
            text: deleteResponse,
            type: 'chore_delete',
            timestamp: new Date()
          });
        } catch (err) {
          const errorResponse = await dustyPersonality.getErrorMessage();
          setDustyMessage({
            text: errorResponse,
            type: 'error',
            timestamp: new Date()
          });
        }
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
      type: 'danger'
    });
  };

  const handleAddChore = useCallback(() => {
    setIsFormOpen(true);
    setEditingChore(null);
    setIsFromTemplate(false);
  }, []);

  const handleTemplateSelect = (templateData: ChoreFormData) => {
    // Create a chore object from the template data
    const templateChore: Chore = {
      id: '', // Will be set by Firestore
      title: templateData.title,
      description: templateData.description || '',
      category: templateData.category,
      priority: templateData.priority,
      isRecurring: templateData.isRecurring,
      recurrencePattern: templateData.recurrencePattern,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setEditingChore(templateChore);
    setIsFromTemplate(true);
    setIsFormOpen(true);
  };

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingChore(null);
    setIsFromTemplate(false);
  }, []);

  // Bulk operations handlers
  const handleChoreSelect = (choreId: string, selected: boolean) => {
    if (selected) {
      setSelectedChoreIds(prev => [...prev, choreId]);
    } else {
      setSelectedChoreIds(prev => prev.filter(id => id !== choreId));
    }
  };

  const handleSectionChange = (section: 'home' | 'add' | 'profile' | 'stats' | 'sms') => {
    setCurrentSection(section);
    if (section === 'add') {
      handleAddChore();
    }
  };

  // Filter chores based on current filters - optimized with useMemo
  const filteredChores = useMemo(() => {
    if (!currentUser) return [];
    const now = new Date();
    
    return chores.filter(chore => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = chore.title.toLowerCase().includes(searchLower);
        const descriptionMatch = chore.description?.toLowerCase().includes(searchLower) || false;
        if (!titleMatch && !descriptionMatch) return false;
      }
      
      // Status filter
      if (filters.status) {
        const isCompleted = !!chore.completedAt;
        const isOverdue = chore.dueDate && !chore.completedAt && now > chore.dueDate;
        
        switch (filters.status) {
          case 'completed':
            if (!isCompleted) return false;
            break;
          case 'pending':
            if (isCompleted || isOverdue) return false;
            break;
          case 'overdue':
            if (!isOverdue) return false;
            break;
        }
      }
      
      // Priority filter
      if (filters.priority && chore.priority !== filters.priority) {
        return false;
      }
      
      // Category filter
      if (filters.category && chore.category !== filters.category) {
        return false;
      }
      
      // Role-based filtering
      if (currentUser.role !== 'admin') {
        if (chore.assigneeId !== currentUser.id && chore.assigneeId !== '') {
          return false;
        }
      }
      
      return true;
    });
  }, [chores, filters, currentUser?.id, currentUser?.role]);

  // Get unique categories from chores
  const categories = Array.from(new Set(chores.map(chore => chore.category).filter(Boolean) as string[]));

  // Add test data to database
  const addTestData = async () => {
    try {
      const promises = testChores.map(chore => 
        addDoc(collection(db, 'chores'), {
          ...chore,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
      await Promise.all(promises);
      setDustyMessage({
        text: 'Test data added successfully! Now you have plenty of chores to manage.',
        type: 'chore_add',
        timestamp: new Date()
      });
    } catch (err) {
      const errorResponse = await dustyPersonality.getErrorMessage();
      setDustyMessage({
        text: errorResponse,
        type: 'error',
        timestamp: new Date()
      });
    }
  };

  // PWA install prompt logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      installPromptEvent.current = e;
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    const event = installPromptEvent.current as any;
    if (event && event.prompt) {
      event.prompt();
      event.userChoice.then(() => {
        setShowInstallPrompt(false);
        installPromptEvent.current = null;
      });
    }
  };

  if (loading) {
    return <div className="app"><div className="login-container">Loading...</div></div>;
  }
  if (!currentUser) {
    return <SignInForm />;
  }

  return (
    <div className="app">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">You are offline. Changes will sync when you’re back online.</div>
      )}
      <header className="app-header">
        <div className="header-content">
          <h1>Dusty's Chores</h1>
          <div className="user-info">
            <span>
              Welcome, {currentUser.displayName} ({currentUser.email})
              {currentUser.role === 'admin' && <span className="admin-badge">Admin</span>}
            </span>
            <div className="header-actions" style={{ flexWrap: 'wrap' }}>
              <ThemeToggle />
              <button className="btn btn-secondary" onClick={signOutUser} style={{ marginLeft: 12 }}>
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        {currentSection === 'home' && (
          <div className="main-content">
            <ChoreFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              loading={choresLoading}
            />
            
            {chores.length > 50 ? (
              <VirtualizedChoreList
                chores={filteredChores}
                currentUser={currentUser}
                onComplete={handleChoreComplete}
                onClaim={handleChoreClaim}
                onEdit={handleChoreEdit}
                onDelete={handleChoreDelete}
                loading={choresLoading}
                selectedChoreIds={selectedChoreIds}
                onChoreSelect={handleChoreSelect}
                itemHeight={120}
                containerHeight={600}
              />
            ) : (
              <ChoreList
                chores={filteredChores}
                currentUser={currentUser}
                onComplete={handleChoreComplete}
                onClaim={handleChoreClaim}
                onEdit={handleChoreEdit}
                onDelete={handleChoreDelete}
                loading={choresLoading}
                selectedChoreIds={selectedChoreIds}
                onChoreSelect={handleChoreSelect}
              />
            )}
          </div>
        )}
        {currentSection === 'stats' && (
          <LazyChoreStats
            chores={chores}
            currentUser={currentUser}
            loading={choresLoading}
          />
        )}
        
        {currentSection === 'profile' && (
          <div className="profile-section">
            <h2>Profile</h2>
            <div className="profile-content">
              <div className="user-info-card">
                <img
                  src={'/logo192.png'}
                  alt={currentUser.displayName}
                  className="user-mgmt-avatar"
                  style={{ marginBottom: 12 }}
                />
                {/* <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="profile-avatar-upload"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAvatarUploading(true);
                      setAvatarError(null);
                      try {
                        // const storage = getStorage();
                        // const avatarRef = storageRef(storage, `avatars/${currentUser.id}`);
                        // await uploadBytes(avatarRef, e.target.files[0]);
                        // const url = await getDownloadURL(avatarRef);
                        const userRef = fsDoc(db, 'users', currentUser.id);
                        // await updateDoc(userRef, { avatarUrl: url });
                        // // Update local user state
                        // setAllUsers(users => users.map(u => u.id === currentUser.id ? { ...u, avatarUrl: url } : u));
                        // // Optionally, update currentUser if you have a setter
                      } catch (err) {
                        setAvatarError('Failed to upload avatar.');
                      } finally {
                        // setAvatarUploading(false);
                      }
                    }
                  }}
                /> */}
                {/* <label htmlFor="profile-avatar-upload" className="user-mgmt-avatar-btn">
                  {avatarUploading ? 'Uploading...' : 'Change Avatar'}
                </label> */}
                {/* {avatarError && <div className="user-mgmt-error">{avatarError}</div>} */}
                <h3>User Information</h3>
                <p><strong>Name:</strong> {currentUser.displayName}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Role:</strong> {currentUser.role}</p>
                <button className="btn btn-secondary" onClick={() => setShowWhatsNew(true)}>
                  What’s New
                </button>
                
                {/* Only show role toggle to admins */}
                {currentUser.role === 'admin' && (
                  <div className="role-toggle">
                    <h4>Development Tools</h4>
                    <p className="dev-note">Toggle your role for testing purposes:</p>
                    <button 
                      className={`btn ${currentUser.role === 'admin' ? 'btn-danger' : 'btn-success'}`}
                      onClick={toggleRole}
                    >
                      {currentUser.role === 'admin' ? 'Switch to Member' : 'Switch to Admin'}
                    </button>
                    <p className="dev-note">Note: This is for development testing only</p>
                  </div>
                )}
              </div>
              
              <LazyNotificationSettingsPanel />
              
              {/* SMSSettings removed */}
              
              {currentUser.role === 'admin' && (
                <div className="admin-tools">
                  <h3>Admin Tools</h3>
                  <button 
                    className="btn btn-primary" 
                    onClick={addTestData}
                    disabled={choresLoading}
                  >
                    Add Test Data
                  </button>
                  <p className="tool-description">
                    Add sample chores to test all the features. This will populate the database with various chores 
                    including overdue, pending, completed, and unassigned tasks.
                  </p>
                 <button
                   className="btn btn-primary"
                   onClick={() => setIsPerformanceDashboardOpen(true)}
                   onMouseEnter={() => LazyLoadingService.preloadComponent('PerformanceDashboard')}
                   title="Performance Dashboard"
                 >
                   <span role="img" aria-label="Performance">📊</span> Performance Dashboard
                 </button>
                 <button 
                   className="btn btn-primary" 
                   onClick={() => setIsAchievementOpen(true)}
                   onMouseEnter={() => LazyLoadingService.preloadComponent('AchievementDisplay')}
                 >
                   🏆 Achievements
                 </button>
                 <button
                   className="btn btn-primary"
                   onClick={() => setShowUserMgmt(true)}
                   style={{ marginLeft: 8 }}
                 >
                   Manage Users
                 </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <MobileNav
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onAddChore={handleAddChore}
        onAchievementClick={() => setIsAchievementOpen(true)}
        onChatClick={() => setIsChatOpen(true)}
      />

      <ChoreForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingChore}
        users={allUsers}
        isFromTemplate={isFromTemplate}
        allChores={chores}
      />

      <LazyChoreTemplates
        open={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onTemplateSelect={handleTemplateSelect}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        type={confirmDialog.type}
      />

      {dustyMessage && (
        <DustyBubble 
          message={dustyMessage} 
          onAnimationComplete={() => setDustyMessage(null)}
        />
      )}

      {/* Offline Status Indicator */}
      <OfflineStatus />

      {/* Dusty Chat */}
      <LazyDustyChat
        currentUser={currentUser}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chores={chores}
        onAddChore={handleAddChore}
        onCompleteChore={handleChoreComplete}
        onClaimChore={handleChoreClaim}
      />

      {/* Achievement Display */}
      {isAchievementOpen && (
        <LazyAchievementDisplay
          onClose={() => setIsAchievementOpen(false)}
          currentUser={currentUser}
          chores={chores}
        />
      )}

      {/* Achievement notification */}
      {achievementNotification && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <span className="achievement-icon">🏆</span>
            <div className="achievement-text">
              <h4>Achievement Unlocked!</h4>
              <p>{achievementNotification.title}</p>
            </div>
            <button 
              className="close-btn"
              onClick={() => setAchievementNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Performance Dashboard */}
      <LazyPerformanceDashboard
        isOpen={isPerformanceDashboardOpen}
        onClose={() => setIsPerformanceDashboardOpen(false)}
      />

      {/* Update Prompt */}
      <UpdatePrompt
        isVisible={isUpdateAvailable}
        onUpdate={() => setIsUpdateAvailable(false)}
        onDismiss={() => setIsUpdateAvailable(false)}
      />

      <PWAInstallPrompt
        visible={showInstallPrompt}
        onInstall={handleInstall}
        onDismiss={() => setShowInstallPrompt(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <WhatsNewModal open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      {showUserMgmt && (
        <UserManagementPanel onClose={() => setShowUserMgmt(false)} currentUser={currentUser} />
      )}
    </div>
  );
};

// --- App Wrapper with Providers ---
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
