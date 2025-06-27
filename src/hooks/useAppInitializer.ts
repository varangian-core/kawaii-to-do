import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { storageAdapter, isUsingFirebase } from '../lib/storageAdapter';
import { isValidBoardData, wouldCauseDataLoss, isValidUserData } from '../utils/dataValidation';
import { useBackupStore, startAutoBackup } from '../store/backupStore';

export function useAppInitializer() {
  const setBoardState = useBoardStore((state) => state.setBoardState);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const initializeApp = useCallback(async () => {
    if (isInitialized.current) return;
    
    try {
      // Load saved board state with validation
      console.log('[App] Loading initial board data');
      const boardData = await storageAdapter.loadBoardData();
      if (boardData && isValidBoardData(boardData)) {
        // Migrate old assignedUserId to assignedUserIds array
        if (boardData.tasks) {
          const migratedTasks = { ...boardData.tasks };
          Object.keys(migratedTasks).forEach(taskId => {
            const task = migratedTasks[taskId];
            if ('assignedUserId' in task && !task.assignedUserIds) {
              task.assignedUserIds = task.assignedUserId ? [task.assignedUserId] : [];
              delete task.assignedUserId;
            }
          });
          boardData.tasks = migratedTasks;
        }
        console.log('[App] Setting initial board state');
        setBoardState(boardData);
      } else if (boardData) {
        console.warn('[App] Loaded board data is invalid, skipping initialization');
      } else {
        console.log('[App] No existing board data found');
      }
      
      // Load saved user state with validation
      const userData = await storageAdapter.loadUserData();
      if (userData && isValidUserData(userData)) {
        useUserStore.setState(userData);
      } else if (userData) {
        console.warn('Loaded user data is invalid, skipping initialization');
      }
      
      isInitialized.current = true;
      
      // Initialize backup service if enabled
      const { initializeGoogleDrive, autoBackupEnabled } = useBackupStore.getState();
      initializeGoogleDrive().then(() => {
        if (autoBackupEnabled) {
          startAutoBackup();
        }
      });
      
      // Note: Real-time listeners are now set up in the persistence effect
      // to better handle the flag coordination
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, [setBoardState]);

  // Set up subscription for persistence
  useEffect(() => {
    // Add a flag to prevent saving during incoming Firebase updates
    let isReceivingUpdate = false;
    
    // Store the unsubscribe function for Firebase listener
    let unsubscribeFirebase: (() => void) | null = null;
    
    // Modified Firebase listener that sets flag during updates
    if (isUsingFirebase() && storageAdapter.subscribeToBoardChanges) {
      unsubscribeFirebase = storageAdapter.subscribeToBoardChanges((data) => {
        isReceivingUpdate = true;
        console.log('[App] Receiving Firebase update, temporarily disabling saves');
        
        const currentState = useBoardStore.getState();
        const currentData = {
          tasks: currentState.tasks,
          columns: currentState.columns,
          columnOrder: currentState.columnOrder
        };
        
        if (!wouldCauseDataLoss(currentData, data) && isValidBoardData(data)) {
          // Migrate data if needed
          if (data.tasks) {
            const migratedTasks = { ...data.tasks };
            Object.keys(migratedTasks).forEach(taskId => {
              const task = migratedTasks[taskId];
              if ('assignedUserId' in task && !task.assignedUserIds) {
                task.assignedUserIds = task.assignedUserId ? [task.assignedUserId] : [];
                delete task.assignedUserId;
              }
            });
            data.tasks = migratedTasks;
          }
          setBoardState(data);
        }
        
        // Re-enable saves after a short delay
        setTimeout(() => {
          isReceivingUpdate = false;
          console.log('[App] Re-enabling saves after Firebase update');
        }, 1000);
      });
    }
    
    const unsubscribe = useBoardStore.subscribe(
      (state) => {
        if (isInitialized.current && !isReceivingUpdate) {
          // Debounce saves to avoid too many writes
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            const dataToSave = {
              tasks: state.tasks,
              columns: state.columns,
              columnOrder: state.columnOrder,
            };
            console.log('[App] Saving board data to storage');
            storageAdapter.saveBoardData(dataToSave).catch(error => {
              console.error('[App] Failed to save board data:', error);
            });
          }, 500);
        }
      }
    );
    
    // Subscribe to user store changes
    const unsubscribeUsers = useUserStore.subscribe(
      (state) => {
        if (isInitialized.current) {
          // Debounce saves to avoid too many writes
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            const userDataToSave = {
              users: state.users,
              currentUserId: state.currentUserId,
            };
            storageAdapter.saveUserData(userDataToSave);
          }, 500);
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUsers();
      if (unsubscribeFirebase) {
        unsubscribeFirebase();
      }
      clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Auto-delete functionality
  useEffect(() => {
    const checkAndDeleteOldTasks = () => {
      const { autoDeleteHours } = useUIStore.getState();
      if (autoDeleteHours === 0) return; // Auto-delete disabled

      const { tasks, columns, deleteTask } = useBoardStore.getState();
      const currentTime = Date.now();
      const deleteThreshold = autoDeleteHours * 60 * 60 * 1000; // Convert hours to milliseconds

      // Find the Done column
      const doneColumn = Object.values(columns).find(col => 
        col.title.toLowerCase() === 'done'
      );

      if (!doneColumn) return;

      // Check each task in Done column
      doneColumn.taskIds.forEach(taskId => {
        const task = tasks[taskId];
        if (task && task.movedToDoneAt) {
          // Skip auto-deletion for tasks with the "daily" icon
          if (task.icons?.includes('daily')) {
            return; // Skip this task
          }
          
          const taskAge = currentTime - task.movedToDoneAt;
          if (taskAge > deleteThreshold) {
            console.log(`Auto-deleting task: ${task.content} (aged ${Math.round(taskAge / 1000 / 60 / 60)} hours)`);
            deleteTask(taskId);
          }
        }
      });
    };

    // Check immediately on mount
    checkAndDeleteOldTasks();

    // Set up interval to check every minute
    const intervalId = setInterval(checkAndDeleteOldTasks, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Recurring task functionality
  useEffect(() => {
    const checkAndMoveRecurringTasks = () => {
      const { tasks, columns, moveTask, updateTask } = useBoardStore.getState();
      const currentTime = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Find To Do and Done columns
      const todoColumn = Object.values(columns).find(col => 
        col.title.toLowerCase() === 'to do'
      );
      const doneColumn = Object.values(columns).find(col => 
        col.title.toLowerCase() === 'done'
      );

      if (!todoColumn || !doneColumn) return;

      // Check each task in Done column for daily icon
      doneColumn.taskIds.forEach((taskId) => {
        const task = tasks[taskId];
        if (task && task.icons?.includes('daily') && task.lastUpdated) {
          const timeSinceLastUpdate = currentTime - task.lastUpdated;
          
          // If more than 24 hours have passed, move back to To Do
          if (timeSinceLastUpdate >= twentyFourHours) {
            console.log(`Moving recurring task back to To Do: ${task.content}`);
            // Reset progress to 0 when moving back
            updateTask(taskId, { progress: 0, movedToDoneAt: undefined });
            moveTask(taskId, doneColumn.id, todoColumn.id, todoColumn.taskIds.length);
          }
        }
      });
    };

    // Check immediately on mount
    checkAndMoveRecurringTasks();

    // Set up interval to check every minute
    const intervalId = setInterval(checkAndMoveRecurringTasks, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return { initializeApp };
}