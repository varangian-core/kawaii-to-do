import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  BoardData, 
  UserData, 
  isValidBoardData, 
  isValidUserData, 
  createBackupKey 
} from '../utils/dataValidation';

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

// LocalStorage adapter with validation
const localStorageAdapter: StorageAdapter = {
  loadBoardData: async () => {
    try {
      const data = localStorage.getItem('kawaii-todo-board');
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Validate the loaded data
      if (!isValidBoardData(parsed)) {
        console.warn('Invalid board data in localStorage');
        // Try to load from backup
        const backupKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('kawaii-todo-board-backup-')
        );
        
        if (backupKeys.length > 0) {
          // Sort by timestamp (newest first)
          backupKeys.sort().reverse();
          
          for (const backupKey of backupKeys) {
            const backupData = localStorage.getItem(backupKey);
            if (backupData) {
              const backupParsed = JSON.parse(backupData);
              if (isValidBoardData(backupParsed)) {
                console.log('Restored from backup:', backupKey);
                return backupParsed;
              }
            }
          }
        }
        
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading board data from localStorage:', error);
      return null;
    }
  },
  
  saveBoardData: async (data) => {
    try {
      // Validate before saving
      if (!isValidBoardData(data)) {
        console.error('Attempted to save invalid board data');
        return;
      }
      
      // Create a backup of current data before overwriting
      const currentData = localStorage.getItem('kawaii-todo-board');
      if (currentData) {
        const backupKey = createBackupKey('kawaii-todo-board');
        localStorage.setItem(backupKey, currentData);
        
        // Keep only the 5 most recent backups
        const backupKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('kawaii-todo-board-backup-')
        );
        
        if (backupKeys.length > 5) {
          backupKeys.sort();
          const keysToRemove = backupKeys.slice(0, backupKeys.length - 5);
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      }
      
      localStorage.setItem('kawaii-todo-board', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving board data to localStorage:', error);
    }
  },
  
  loadUserData: async () => {
    try {
      const data = localStorage.getItem('kawaii-todo-users');
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      if (!isValidUserData(parsed)) {
        console.warn('Invalid user data in localStorage');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
      return null;
    }
  },
  
  saveUserData: async (data) => {
    try {
      if (!isValidUserData(data)) {
        console.error('Attempted to save invalid user data');
        return;
      }
      
      localStorage.setItem('kawaii-todo-users', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
    }
  }
};

// Firestore adapter with validation
const firestoreAdapter: StorageAdapter = {
  loadBoardData: async () => {
    try {
      // Using a fixed document ID for now - could be user-specific later
      const docRef = doc(db, 'boards', 'default-board');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Validate the loaded data
        if (!isValidBoardData(data)) {
          console.error('Invalid board data from Firestore');
          
          // Try to load from backup collection
          const backupRef = doc(db, 'backups', 'default-board-latest');
          const backupSnap = await getDoc(backupRef);
          
          if (backupSnap.exists()) {
            const backupData = backupSnap.data();
            if (isValidBoardData(backupData)) {
              console.log('Restored from Firestore backup');
              return backupData;
            }
          }
          
          return null;
        }
        
        return data as BoardData;
      }
      return null;
    } catch (error) {
      console.error('Error loading board data from Firestore:', error);
      return null;
    }
  },
  
  saveBoardData: async (data) => {
    try {
      // Validate before saving
      if (!isValidBoardData(data)) {
        console.error('Attempted to save invalid board data to Firestore');
        return;
      }
      
      // Save backup first
      const backupRef = doc(db, 'backups', 'default-board-latest');
      await setDoc(backupRef, {
        ...data,
        backedUpAt: new Date().toISOString()
      });
      
      // Then save main data
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
        const data = docSnap.data();
        
        if (!isValidUserData(data)) {
          console.error('Invalid user data from Firestore');
          return null;
        }
        
        return data as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
      return null;
    }
  },
  
  saveUserData: async (data) => {
    try {
      if (!isValidUserData(data)) {
        console.error('Attempted to save invalid user data to Firestore');
        return;
      }
      
      const docRef = doc(db, 'users', 'default-users');
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
    }
  },
  
  // Real-time listeners for Firestore with validation
  subscribeToBoardChanges: (callback) => {
    const docRef = doc(db, 'boards', 'default-board');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        // Only call callback if data is valid
        if (isValidBoardData(data)) {
          callback(data as BoardData);
        } else {
          console.warn('Received invalid board data from Firestore real-time update');
        }
      }
    }, (error) => {
      console.error('Error in board changes subscription:', error);
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