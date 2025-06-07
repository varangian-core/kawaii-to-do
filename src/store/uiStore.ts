import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UIState {
  isImagePickerOpen: boolean;
  imagePickerTargetId: string | null;
  
  // Actions
  openImagePicker: (targetTaskId: string) => void;
  closeImagePicker: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isImagePickerOpen: false,
      imagePickerTargetId: null,

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
    }),
    {
      name: 'ui-store',
    }
  )
);