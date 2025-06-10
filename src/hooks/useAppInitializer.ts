import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useUserStore } from '../store/userStore';
import { useUIStore } from '../store/uiStore';
import { storageAdapter, isUsingFirebase } from '../lib/storageAdapter';

export function useAppInitializer() {
  const setBoardState = useBoardStore((state) => state.setBoardState);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const initializeApp = useCallback(async () => {
    if (isInitialized.current) return;
    
    try {
      // Load saved board state
      const boardData = await storageAdapter.loadBoardData();
      if (boardData && Object.keys(boardData).length > 0) {
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
        setBoardState(boardData);
      }
      
      // Load saved user state
      const userData = await storageAdapter.loadUserData();
      if (userData && userData.users) {
        useUserStore.setState(userData);
      }
      
      isInitialized.current = true;
      
      // Set up real-time listeners if using Firebase
      if (isUsingFirebase() && storageAdapter.subscribeToBoardChanges) {
        // Subscribe to board changes
        storageAdapter.subscribeToBoardChanges((data) => {
          // Migrate old assignedUserId to assignedUserIds array
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
        });
        
        // Subscribe to user changes
        if (storageAdapter.subscribeToUserChanges) {
          storageAdapter.subscribeToUserChanges((data) => {
            useUserStore.setState(data);
          });
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, [setBoardState]);

  // Set up subscription for persistence
  useEffect(() => {
    const unsubscribe = useBoardStore.subscribe(
      (state) => {
        if (isInitialized.current) {
          // Debounce saves to avoid too many writes
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
            const dataToSave = {
              tasks: state.tasks,
              columns: state.columns,
              columnOrder: state.columnOrder,
            };
            storageAdapter.saveBoardData(dataToSave);
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