import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// Type definitions for our storage data
interface BoardData {
  tasks: Record<string, any>;
  columns: Record<string, any>;
  columnOrder: string[];
}

interface UserData {
  users: Record<string, any>;
  currentUserId: string | null;
}

// Detect if we're running on Firebase hosting
const isFirebaseHosting = () => {
  return window.location.hostname.includes('firebaseapp.com') || 
         window.location.hostname.includes('web.app');
};

// Storage adapter interface
interface StorageAdapter {
  loadBoardData: () => Promise<BoardData | null>;
  saveBoardData: (data: BoardData) => Promise<void>;
  loadUserData: () => Promise<UserData | null>;
  saveUserData: (data: UserData) => Promise<void>;
  subscribeToBoardChanges?: (callback: (data: BoardData) => void) => () => void;
  subscribeToUserChanges?: (callback: (data: UserData) => void) => () => void;
}

// LocalStorage adapter
const localStorageAdapter: StorageAdapter = {
  loadBoardData: async () => {
    const data = localStorage.getItem('kawaii-todo-board');
    return data ? JSON.parse(data) : null;
  },
  
  saveBoardData: async (data) => {
    localStorage.setItem('kawaii-todo-board', JSON.stringify(data));
  },
  
  loadUserData: async () => {
    const data = localStorage.getItem('kawaii-todo-users');
    return data ? JSON.parse(data) : null;
  },
  
  saveUserData: async (data) => {
    localStorage.setItem('kawaii-todo-users', JSON.stringify(data));
  }
};

// Firestore adapter
const firestoreAdapter: StorageAdapter = {
  loadBoardData: async () => {
    try {
      // Using a fixed document ID for now - could be user-specific later
      const docRef = doc(db, 'boards', 'default-board');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as BoardData;
      }
      return null;
    } catch (error) {
      console.error('Error loading board data from Firestore:', error);
      return null;
    }
  },
  
  saveBoardData: async (data) => {
    try {
      const docRef = doc(db, 'boards', 'default-board');
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Error saving board data to Firestore:', error);
    }
  },
  
  loadUserData: async () => {
    try {
      const docRef = doc(db, 'users', 'default-users');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
      return null;
    }
  },
  
  saveUserData: async (data) => {
    try {
      const docRef = doc(db, 'users', 'default-users');
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
    }
  },
  
  // Real-time listeners for Firestore
  subscribeToBoardChanges: (callback) => {
    const docRef = doc(db, 'boards', 'default-board');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as BoardData);
      }
    });
  },
  
  subscribeToUserChanges: (callback) => {
    const docRef = doc(db, 'users', 'default-users');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserData);
      }
    });
  }
};

// Export the appropriate adapter based on environment
export const storageAdapter: StorageAdapter = isFirebaseHosting() ? firestoreAdapter : localStorageAdapter;
export const isUsingFirebase = isFirebaseHosting;