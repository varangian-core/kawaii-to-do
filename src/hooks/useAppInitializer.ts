import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useUserStore } from '../store/userStore';
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

  return { initializeApp };
}