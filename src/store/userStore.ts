import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface UserState {
  users: Record<string, User>;
  currentUserId: string | null;
  
  // Actions
  addUser: (name: string, color: string, icon?: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  setCurrentUser: (userId: string | null) => void;
}

const generateId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

const defaultIcons = [
  '😊', '🌟', '🦄', '🐱', '🦊', '🐰', '🐨', '🦁', '🐸', '🦋',
  '🌸', '🌺', '🌻', '🌈', '💫', '🎨', '🎯', '🚀', '💡', '❤️'
];

export const useUserStore = create<UserState>()(
  subscribeWithSelector(
    devtools(
      (set) => ({
        users: {},
        currentUserId: null,

        addUser: (name: string, color: string, icon?: string) => {
          const userId = generateId();
          const newUser: User = {
            id: userId,
            name,
            color,
            icon,
          };

          set((state) => ({
            users: {
              ...state.users,
              [userId]: newUser,
            },
            // Set as current user if no current user
            currentUserId: state.currentUserId || userId,
          }));
        },

        updateUser: (userId: string, updates: Partial<User>) => {
          set((state) => ({
            users: {
              ...state.users,
              [userId]: {
                ...state.users[userId],
                ...updates,
              },
            },
          }));
        },

        deleteUser: (userId: string) => {
          set((state) => {
            const newUsers = { ...state.users };
            delete newUsers[userId];

            return {
              users: newUsers,
              // Clear current user if it was deleted
              currentUserId: state.currentUserId === userId ? null : state.currentUserId,
            };
          });
        },

        setCurrentUser: (userId: string | null) => {
          set({ currentUserId: userId });
        },
      }),
      {
        name: 'user-store',
      }
    )
  )
);

// Export helpers
export const getRandomColor = () => defaultColors[Math.floor(Math.random() * defaultColors.length)];
export const getRandomIcon = () => defaultIcons[Math.floor(Math.random() * defaultIcons.length)];