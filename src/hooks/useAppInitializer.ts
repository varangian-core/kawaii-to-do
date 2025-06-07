import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useUserStore } from '../store/userStore';

const BOARD_STORAGE_KEY = 'kawaii-todo-board';
const USER_STORAGE_KEY = 'kawaii-todo-users';

export function useAppInitializer() {
  const setBoardState = useBoardStore((state) => state.setBoardState);
  const isInitialized = useRef(false);

  const initializeApp = useCallback(() => {
    if (isInitialized.current) return;
    
    try {
      // Load saved board state
      const savedBoardData = localStorage.getItem(BOARD_STORAGE_KEY);
      if (savedBoardData) {
        const parsedData = JSON.parse(savedBoardData);
        if (parsedData && Object.keys(parsedData).length > 0) {
          setBoardState(parsedData);
        }
      }
      
      // Load saved user state
      const savedUserData = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUserData) {
        const parsedUserData = JSON.parse(savedUserData);
        if (parsedUserData && parsedUserData.users) {
          useUserStore.setState(parsedUserData);
        }
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, [setBoardState]);

  // Set up subscription for persistence
  useEffect(() => {
    const unsubscribe = useBoardStore.subscribe(
      (state) => {
        if (isInitialized.current) {
          const dataToSave = {
            tasks: state.tasks,
            columns: state.columns,
            columnOrder: state.columnOrder,
          };
          localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(dataToSave));
        }
      }
    );
    
    // Subscribe to user store changes
    const unsubscribeUsers = useUserStore.subscribe(
      (state) => {
        if (isInitialized.current) {
          const userDataToSave = {
            users: state.users,
            currentUserId: state.currentUserId,
          };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDataToSave));
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  return { initializeApp };
}