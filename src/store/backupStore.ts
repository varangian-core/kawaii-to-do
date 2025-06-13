import { create } from 'zustand';
import { googleDriveBackup, BackupConfig } from '../services/googleDriveBackup';
import { useBoardStore } from './boardStore';
import { useUserStore } from './userStore';
import { useUIStore } from './uiStore';
import { isValidBoardData, isValidUserData } from '../utils/dataValidation';

interface BackupState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  lastBackupTime: string | null;
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // in hours
  backupError: string | null;

  // Actions
  initializeGoogleDrive: () => Promise<void>;
  authenticate: () => Promise<void>;
  createBackup: () => Promise<void>;
  restoreBackup: () => Promise<void>;
  setAutoBackup: (enabled: boolean, interval?: number) => void;
  signOut: () => void;
}

export const useBackupStore = create<BackupState>((set, get) => ({
  isInitialized: false,
  isAuthenticated: false,
  isBackingUp: false,
  isRestoring: false,
  lastBackupTime: localStorage.getItem('kawaii-todo-last-backup') || null,
  autoBackupEnabled: localStorage.getItem('kawaii-todo-auto-backup') === 'true',
  autoBackupInterval: parseInt(localStorage.getItem('kawaii-todo-backup-interval') || '24'),
  backupError: null,

  initializeGoogleDrive: async () => {
    try {
      await googleDriveBackup.init();
      set({ isInitialized: true, backupError: null });
    } catch (error: any) {
      // Show specific error message if available
      const errorMessage = error?.message || 'Failed to initialize Google Drive';
      set({ backupError: errorMessage });
    }
  },

  authenticate: async () => {
    try {
      await googleDriveBackup.requestAccessToken();
      set({ isAuthenticated: true, backupError: null });
    } catch (error) {
      // Don't log the full error object as it may contain sensitive data
      set({ backupError: 'Authentication failed' });
    }
  },

  createBackup: async () => {
    const state = get();
    if (!state.isAuthenticated) {
      set({ backupError: 'Not authenticated' });
      return;
    }

    set({ isBackingUp: true, backupError: null });

    try {
      // Get current data
      const boardState = useBoardStore.getState();
      const userState = useUserStore.getState();
      const uiState = useUIStore.getState();

      const boardData = {
        tasks: boardState.tasks,
        columns: boardState.columns,
        columnOrder: boardState.columnOrder,
      };

      const userData = {
        users: userState.users,
        currentUserId: userState.currentUserId,
      };

      const config: BackupConfig = {
        autoDeleteHours: uiState.autoDeleteHours,
      };

      // Create backup
      await googleDriveBackup.createFullBackup(boardData, userData, config);

      const timestamp = new Date().toISOString();
      localStorage.setItem('kawaii-todo-last-backup', timestamp);
      
      set({ 
        isBackingUp: false, 
        lastBackupTime: timestamp,
        backupError: null 
      });
    } catch (error) {
      // Don't log the full error object
      set({ 
        isBackingUp: false, 
        backupError: 'Backup failed' 
      });
    }
  },

  restoreBackup: async () => {
    const state = get();
    if (!state.isAuthenticated) {
      set({ backupError: 'Not authenticated' });
      return;
    }

    set({ isRestoring: true, backupError: null });

    try {
      // Get backup data
      const { boardData, userData, config } = await googleDriveBackup.restoreFullBackup();

      let restoredCount = 0;

      // Restore board data if valid
      if (boardData && isValidBoardData(boardData)) {
        useBoardStore.getState().setBoardState(boardData);
        restoredCount++;
      }

      // Restore user data if valid
      if (userData && isValidUserData(userData)) {
        useUserStore.setState(userData);
        restoredCount++;
      }

      // Restore config
      if (config) {
        const uiStore = useUIStore.getState();
        if (config.autoDeleteHours !== undefined) {
          uiStore.setAutoDeleteHours(config.autoDeleteHours);
        }
        restoredCount++;
      }

      if (restoredCount === 0) {
        set({ 
          isRestoring: false, 
          backupError: 'No valid backup data found' 
        });
      } else {
        set({ 
          isRestoring: false, 
          backupError: null 
        });
      }
    } catch (error) {
      // Don't log the full error object
      set({ 
        isRestoring: false, 
        backupError: 'Restore failed' 
      });
    }
  },

  setAutoBackup: (enabled: boolean, interval: number = 24) => {
    localStorage.setItem('kawaii-todo-auto-backup', enabled.toString());
    localStorage.setItem('kawaii-todo-backup-interval', interval.toString());
    set({ 
      autoBackupEnabled: enabled, 
      autoBackupInterval: interval 
    });
  },

  signOut: () => {
    googleDriveBackup.signOut();
    set({ 
      isAuthenticated: false,
      backupError: null 
    });
  },
}));

// Auto-backup interval
let autoBackupInterval: NodeJS.Timeout | null = null;

export function startAutoBackup() {
  const { autoBackupEnabled, autoBackupInterval: interval, isAuthenticated, createBackup } = useBackupStore.getState();
  
  if (!autoBackupEnabled || !isAuthenticated) {
    return;
  }

  // Clear existing interval
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval as unknown as number);
  }

  // Set up new interval
  autoBackupInterval = setInterval(() => {
    createBackup();
  }, interval * 60 * 60 * 1000); // Convert hours to milliseconds
}

export function stopAutoBackup() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval as unknown as number);
    autoBackupInterval = null;
  }
}