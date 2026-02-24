import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { auth, db } from '@/lib/firebase';
import { User, usersApi, facultyApi } from '@/lib/storage';

/* eslint-disable react-refresh/only-export-components */

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setActiveRole: (role: 'admin' | 'hod' | 'faculty') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
      if (firebaseUser) {
        // Fetch user data from Firestore
        try {
          console.log('Fetching user data from Firestore for:', firebaseUser.email);
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);

          console.log('Firestore query result: found', querySnapshot.size, 'documents');

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as User;
            console.log('User data retrieved:', { name: userData.name, role: userData.role, collegeId: userData.collegeId });
            const fullUserData = { ...userData, id: userDoc.id, uid: firebaseUser.uid };
            
            // Initialize activeRole if user has multiple roles
            if (fullUserData.roles && fullUserData.roles.length > 0) {
              if (!fullUserData.activeRole) {
                fullUserData.activeRole = fullUserData.roles[0];
              }
            } else {
              fullUserData.activeRole = fullUserData.role as 'admin' | 'hod' | 'faculty';
            }
            
            console.log('Setting user in context:', fullUserData.name || fullUserData.email);
            setUser(fullUserData);
            localStorage.setItem('currentUser', JSON.stringify(fullUserData));
          } else {
            console.error('User authenticated in Firebase but not found in Firestore');
            // Sign out the user since they're not in our system
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('currentUser');
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
          // Sign out on error
          await signOut(auth);
          setUser(null);
          localStorage.removeItem('currentUser');
        }
      } else {
        console.log('No Firebase user, clearing context');
        setUser(null);
        localStorage.removeItem('currentUser');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    setIsLoading(true);
    try {
      // First, authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful for:', userCredential.user.email);

      // Then, fetch user data from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('User authenticated but not found in Firestore');
        await signOut(auth); // Sign out the user since they're not in our system
        return { success: false, error: 'Account not found in our system. Please contact your administrator.' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      // Check if user is active
      if (userData.isActive === false) {
        console.error('User account is disabled');
        await signOut(auth);
        return { success: false, error: 'Your account has been disabled. Please contact your administrator.' };
      }

      // Check if user has required fields
      if (!userData.role && (!userData.roles || userData.roles.length === 0)) {
        console.error('User has no role assigned');
        await signOut(auth);
        return { success: false, error: 'No role assigned to your account. Please contact your administrator.' };
      }

      // Check if user has collegeId (not required for superAdmins)
      if (!userData.collegeId && userData.role !== 'superAdmin') {
        console.error('User has no college assigned');
        await signOut(auth);
        return { success: false, error: 'No college assigned to your account. Please contact your administrator.' };
      }

      console.log('Login successful for user:', userData.name || userData.email);
      return { success: true };

    } catch (error: unknown) {
      const err = error as Error;
      const firebaseErr = error as FirebaseError;
      
      console.error('Login error details:', {
        code: firebaseErr.code,
        message: err.message,
        name: err.name,
        stack: err.stack
      });

      // Handle Firebase Auth errors
      if (firebaseErr.code) {
        switch (firebaseErr.code) {
          case 'auth/user-not-found':
            return { success: false, error: 'No account found with this email address.' };
          case 'auth/wrong-password':
            return { success: false, error: 'Incorrect password. Please try again.' };
          case 'auth/invalid-email':
            return { success: false, error: 'Invalid email address format.' };
          case 'auth/user-disabled':
            return { success: false, error: 'This account has been disabled.' };
          case 'auth/too-many-requests':
            return { success: false, error: 'Too many failed login attempts. Please try again later.' };
          case 'auth/network-request-failed':
            return { success: false, error: 'Network error. Please check your internet connection.' };
          case 'auth/invalid-credential':
            return { success: false, error: 'Invalid login credentials.' };
          case 'auth/operation-not-allowed':
            return { success: false, error: 'Login method not enabled. Please contact support.' };
          case 'auth/requires-recent-login':
            return { success: false, error: 'Please log in again for security reasons.' };
          default:
            return { success: false, error: `Authentication error: ${err.message}` };
        }
      }

      // Handle Firestore errors
      if (err.message && err.message.includes('firestore')) {
        return { success: false, error: 'Database error. Please try again or contact support.' };
      }

      // Handle network errors
      if (err.message && (err.message.includes('network') || err.message.includes('fetch'))) {
        return { success: false, error: 'Network connection error. Please check your internet and try again.' };
      }

      // Generic fallback
      return { success: false, error: 'An unexpected error occurred. Please try again or contact support.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const setActiveRole = useCallback(async (role: 'admin' | 'hod' | 'faculty') => {
    if (!user) return;

    // Verify the user has this role
    const availableRoles = user.roles || [user.role as 'admin' | 'hod' | 'faculty'];
    if (!availableRoles.includes(role)) {
      console.error(`User does not have role: ${role}`);
      return;
    }

    const updatedUser = { ...user, activeRole: role };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
