import { useCallback, useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';

const STORAGE_KEY = 'kawaii-todo-board';

export function useAppInitializer() {
  const setBoardState = useBoardStore((state) => state.setBoardState);
  const isInitialized = useRef(false);

  const initializeApp = useCallback(() => {
    if (isInitialized.current) return;
    
    try {
      // Load saved state from localStorage
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData && Object.keys(parsedData).length > 0) {
          setBoardState(parsedData);
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
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return { initializeApp };
}