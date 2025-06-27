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
      
      // Ensure proper structure
      const boardData = {
        ...parsed,
        tasks: parsed.tasks || {},
        columns: parsed.columns || {},
        columnOrder: parsed.columnOrder || []
      };
      
      // Validate the loaded data
      if (!isValidBoardData(boardData)) {
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
              // Ensure proper structure for backup data
              const backupBoardData = {
                ...backupParsed,
                tasks: backupParsed.tasks || {},
                columns: backupParsed.columns || {},
                columnOrder: backupParsed.columnOrder || []
              };
              if (isValidBoardData(backupBoardData)) {
                console.log('Restored from backup:', backupKey);
                return backupBoardData;
              }
            }
          }
        }
        
        return null;
      }
      
      return boardData;
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
      
      // Ensure proper structure
      const userData = {
        ...parsed,
        users: parsed.users || {},
        currentUserId: parsed.currentUserId || null
      };
      
      if (!isValidUserData(userData)) {
        console.warn('Invalid user data in localStorage');
        return null;
      }
      
      return userData;
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
      console.log('[Firebase] Loading board data...');
      // Using a fixed document ID for now - could be user-specific later
      const docRef = doc(db, 'boards', 'default-board');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('[Firebase] Board data loaded successfully');
        
        // Ensure data has required structure (add defaults if missing)
        const boardData = {
          ...data, // Include any other properties
          tasks: data.tasks || {},
          columns: data.columns || {},
          columnOrder: data.columnOrder || []
        };
        
        // Validate the loaded data
        if (!isValidBoardData(boardData)) {
          console.error('[Firebase] Invalid board data from Firestore:', boardData);
          return null;
        }
        
        return boardData;
      }
      console.log('[Firebase] No board data found in Firestore');
      return null;
    } catch (error: any) {
      console.error('[Firebase] Error loading board data from Firestore:', error);
      console.error('[Firebase] Error details:', error.code, error.message);
      return null;
    }
  },
  
  saveBoardData: async (data) => {
    try {
      console.log('[Firebase] Saving board data...');
      // Ensure we have valid structure before saving
      const dataToSave = {
        ...data,
        tasks: data.tasks || {},
        columns: data.columns || {},
        columnOrder: data.columnOrder || []
      };
      
      // Validate before saving
      if (!isValidBoardData(dataToSave)) {
        console.error('[Firebase] Attempted to save invalid board data to Firestore:', dataToSave);
        return;
      }
      
      // Save backup first
      const backupRef = doc(db, 'backups', 'default-board-latest');
      await setDoc(backupRef, {
        ...dataToSave,
        backedUpAt: new Date().toISOString()
      });
      
      // Then save main data
      const docRef = doc(db, 'boards', 'default-board');
      await setDoc(docRef, dataToSave);
      console.log('[Firebase] Board data saved successfully');
    } catch (error: any) {
      console.error('[Firebase] Error saving board data to Firestore:', error);
      console.error('[Firebase] Error details:', error.code, error.message);
      // Don't throw - allow app to continue working even if save fails
    }
  },
  
  loadUserData: async () => {
    try {
      const docRef = doc(db, 'users', 'default-users');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Ensure proper structure
        const userData = {
          ...data,
          users: data.users || {},
          currentUserId: data.currentUserId || null
        };
        
        if (!isValidUserData(userData)) {
          console.error('Invalid user data from Firestore');
          return null;
        }
        
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
      return null;
    }
  },
  
  saveUserData: async (data) => {
    try {
      // Ensure proper structure
      const dataToSave = {
        ...data,
        users: data.users || {},
        currentUserId: data.currentUserId || null
      };
      
      if (!isValidUserData(dataToSave)) {
        console.error('Attempted to save invalid user data to Firestore');
        return;
      }
      
      const docRef = doc(db, 'users', 'default-users');
      await setDoc(docRef, dataToSave);
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
    }
  },
  
  // Real-time listeners for Firestore with validation
  subscribeToBoardChanges: (callback) => {
    console.log('[Firebase] Setting up real-time board listener...');
    const docRef = doc(db, 'boards', 'default-board');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('[Firebase] Received board update from Firestore');
        
        // Ensure data has required structure
        const boardData = {
          ...data,
          tasks: data.tasks || {},
          columns: data.columns || {},
          columnOrder: data.columnOrder || []
        };
        
        // Only call callback if data is valid
        if (isValidBoardData(boardData)) {
          callback(boardData);
        } else {
          console.warn('[Firebase] Received invalid board data from Firestore real-time update:', boardData);
        }
      }
    }, (error: any) => {
      console.error('[Firebase] Error in board changes subscription:', error);
      console.error('[Firebase] Error details:', error.code, error.message);
    });
  },
  
  subscribeToUserChanges: (callback) => {
    const docRef = doc(db, 'users', 'default-users');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        // Ensure proper structure
        const userData = {
          ...data,
          users: data.users || {},
          currentUserId: data.currentUserId || null
        };
        
        if (isValidUserData(userData)) {
          callback(userData);
        } else {
          console.warn('[Firebase] Received invalid user data from real-time update');
        }
      }
    }, (error: any) => {
      console.error('[Firebase] Error in user changes subscription:', error);
      console.error('[Firebase] Error details:', error.code, error.message);
    });
  }
};

// Export the appropriate adapter based on environment
export const storageAdapter: StorageAdapter = isFirebaseHosting() ? firestoreAdapter : localStorageAdapter;
export const isUsingFirebase = isFirebaseHosting;