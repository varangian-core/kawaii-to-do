import { useCallback, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'kawaii-todo-board';

export function useAppInitializer() {
  const setBoardState = useBoardStore((state) => state.setBoardState);
  const isInitialized = useRef(false);
  
  // Get the current board state for persistence
  const boardState = useBoardStore((state) => ({
    tasks: state.tasks,
    columns: state.columns,
    columnOrder: state.columnOrder,
  }));

  // Use localStorage hook for persistence
  const [savedState, setSavedState] = useLocalStorage(STORAGE_KEY, boardState);

  const initializeApp = useCallback(() => {
    if (isInitialized.current) return;
    
    try {
      // Load saved state if it exists
      if (savedState && Object.keys(savedState).length > 0) {
        setBoardState(savedState);
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, [savedState, setBoardState]);

  // Subscribe to board state changes and save to localStorage
  useBoardStore.subscribe(
    (state) => ({
      tasks: state.tasks,
      columns: state.columns,
      columnOrder: state.columnOrder,
    }),
    (newState) => {
      if (isInitialized.current) {
        setSavedState(newState);
      }
    }
  );

  return { initializeApp };
}