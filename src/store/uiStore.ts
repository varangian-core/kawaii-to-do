import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UIState {
  isImagePickerOpen: boolean;
  imagePickerTargetId: string | null;
  isEditMode: boolean;
  
  // Actions
  openImagePicker: (targetTaskId: string) => void;
  closeImagePicker: () => void;
  toggleEditMode: () => void;
  setEditMode: (isEdit: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isImagePickerOpen: false,
      imagePickerTargetId: null,
      isEditMode: false,

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
    }),
    {
      name: 'ui-store',
    }
  )
);