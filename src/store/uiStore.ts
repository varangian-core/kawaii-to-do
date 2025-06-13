import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useBoardStore } from './boardStore';

export interface UIState {
  isImagePickerOpen: boolean;
  imagePickerTargetId: string | null;
  isEditMode: boolean;
  selectedUserFilters: string[]; // Global user filters
  columnUserFilters: Record<string, string[]>; // Per-column user filters
  filterMode: 'global' | 'column'; // Whether to use global or per-column filters
  autoDeleteHours: number; // Hours after which tasks in Done column are auto-deleted (0 = disabled)
  
  // Actions
  openImagePicker: (targetTaskId: string) => void;
  closeImagePicker: () => void;
  toggleEditMode: () => void;
  setEditMode: (isEdit: boolean) => void;
  toggleUserFilter: (userId: string) => void;
  clearUserFilters: () => void;
  setUserFilters: (userIds: string[]) => void;
  toggleColumnUserFilter: (columnId: string, userId: string) => void;
  clearColumnFilters: (columnId: string) => void;
  setColumnFilters: (columnId: string, userIds: string[]) => void;
  setFilterMode: (mode: 'global' | 'column') => void;
  applyGlobalFiltersToAllColumns: () => void;
  setAutoDeleteHours: (hours: number) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      isImagePickerOpen: false,
      imagePickerTargetId: null,
      isEditMode: false,
      selectedUserFilters: [],
      columnUserFilters: {},
      filterMode: 'global',
      autoDeleteHours: parseInt(localStorage.getItem('kawaii-todo-auto-delete-hours') || '0'),

      openImagePicker: (targetTaskId: string) => {
        set({
          isImagePickerOpen: true,
          imagePickerTargetId: targetTaskId,
        });
      },

      closeImagePicker: () => {
        set({
          isImagePickerOpen: false,
          imagePickerTargetId: null,
        });
      },

      toggleEditMode: () => {
        set((state) => ({ isEditMode: !state.isEditMode }));
      },

      setEditMode: (isEdit: boolean) => {
        set({ isEditMode: isEdit });
      },

      toggleUserFilter: (userId: string) => {
        set((state) => {
          const newFilters = state.selectedUserFilters.includes(userId)
            ? state.selectedUserFilters.filter(id => id !== userId)
            : [...state.selectedUserFilters, userId];
          return { selectedUserFilters: newFilters };
        });
      },

      clearUserFilters: () => {
        set({ selectedUserFilters: [] });
      },

      setUserFilters: (userIds: string[]) => {
        set({ selectedUserFilters: userIds });
      },

      toggleColumnUserFilter: (columnId: string, userId: string) => {
        set((state) => {
          const currentFilters = state.columnUserFilters[columnId] || [];
          const newFilters = currentFilters.includes(userId)
            ? currentFilters.filter(id => id !== userId)
            : [...currentFilters, userId];
          
          return {
            columnUserFilters: {
              ...state.columnUserFilters,
              [columnId]: newFilters,
            },
          };
        });
      },

      clearColumnFilters: (columnId: string) => {
        set((state) => ({
          columnUserFilters: {
            ...state.columnUserFilters,
            [columnId]: [],
          },
        }));
      },

      setColumnFilters: (columnId: string, userIds: string[]) => {
        set((state) => ({
          columnUserFilters: {
            ...state.columnUserFilters,
            [columnId]: userIds,
          },
        }));
      },

      setFilterMode: (mode: 'global' | 'column') => {
        set({ filterMode: mode });
      },

      applyGlobalFiltersToAllColumns: () => {
        const { selectedUserFilters } = get();
        const boardState = useBoardStore.getState();
        const columnIds = boardState.columnOrder || [];
        
        set(() => {
          const newColumnFilters: Record<string, string[]> = {};
          // Apply global filters to all existing columns
          columnIds.forEach((columnId: string) => {
            newColumnFilters[columnId] = [...selectedUserFilters];
          });
          return {
            columnUserFilters: newColumnFilters,
            filterMode: 'column',
          };
        });
      },

      setAutoDeleteHours: (hours: number) => {
        localStorage.setItem('kawaii-todo-auto-delete-hours', hours.toString());
        set({ autoDeleteHours: hours });
      },
    }),
    {
      name: 'ui-store',
    }
  )
);