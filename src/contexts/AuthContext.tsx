import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  toggleRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up onAuthStateChanged listener');
    
    // Add a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('AuthContext: Timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('AuthContext: onAuthStateChanged fired, user:', firebaseUser);
      
      // Clear the timeout since onAuthStateChanged fired
      clearTimeout(timeoutId);
      
      if (firebaseUser) {
        console.log('AuthContext: User found, checking Firestore...');
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          console.log('AuthContext: User doc exists, setting currentUser');
          setCurrentUser(userDoc.data() as User);
        } else {
          console.log('AuthContext: User doc does not exist, creating new user');
          // Create new user document with role determination
          const isAdmin = firebaseUser.email === 'ronni@example.com' || 
                         firebaseUser.email === 'your-email@gmail.com'; // Add your email here
          
          const newUser = {
            displayName: firebaseUser.displayName || 'Unknown User',
            email: firebaseUser.email || '',
            role: isAdmin ? 'admin' : 'member',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          };
          try {
            console.log('AuthContext: Creating new user doc...');
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            // Fetch the doc again to get resolved timestamps
            const freshDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (freshDoc.exists()) {
              console.log('AuthContext: New user doc created successfully');
              setCurrentUser(freshDoc.data() as User);
            }
          } catch (err: any) {
            console.error('AuthContext: Error creating user doc:', err);
            if (err && err.code) {
              alert('Firestore error: ' + err.code + '\n' + (err.message || ''));
            } else {
              alert('Unknown Firestore error: ' + JSON.stringify(err));
            }
          }
        }
      } else {
        console.log('AuthContext: No user found, setting currentUser to null');
        setCurrentUser(null);
      }
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    });

    console.log('AuthContext: onAuthStateChanged listener set up, returning unsubscribe');
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = {
        displayName,
        email: result.user.email || '',
        role: 'member',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', result.user.uid), newUser);
    } catch (error) {
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const toggleRole = async () => {
    if (!currentUser) return;
    
    try {
      const newRole: 'admin' | 'member' = currentUser.role === 'admin' ? 'member' : 'admin';
      const updatedUser = { ...currentUser, role: newRole };
      await setDoc(doc(db, 'users', currentUser.id), updatedUser);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Error toggling role:', error);
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signUp,
    signOutUser,
    signInWithGoogle,
    toggleRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 