import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export interface ToDo {
  id: string;
  content: string;
  backgroundImageUrl?: string;
  assignedUserIds?: string[]; // Changed from single user to array of users
  progress?: number; // 0-100
  movedToDoneAt?: number; // Timestamp when task was moved to Done column
  icons?: string[]; // Array of icon identifiers
  lastUpdated?: number; // Timestamp for last update (used for recurring tasks)
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardState {
  tasks: Record<string, ToDo>;
  columns: Record<string, Column>;
  columnOrder: string[];
  
  // Actions
  addTask: (columnId: string, content: string, backgroundImageUrl?: string) => string;
  updateTask: (taskId: string, updates: Partial<ToDo>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => void;
  addColumn: (title: string) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (newColumnOrder: string[]) => void;
  setBoardState: (state: Partial<BoardState>) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultColumns: Column[] = [
  { id: 'column-1', title: 'To Do', taskIds: [] },
  { id: 'column-2', title: 'In Progress', taskIds: [] },
  { id: 'column-3', title: 'Done', taskIds: [] },
];

const initialState = {
  tasks: {},
  columns: defaultColumns.reduce((acc, col) => ({ ...acc, [col.id]: col }), {}),
  columnOrder: defaultColumns.map(col => col.id),
};

export const useBoardStore = create<BoardState>()(
  subscribeWithSelector(
    devtools(
      (set) => ({
        ...initialState,

        addTask: (columnId: string, content: string, backgroundImageUrl?: string) => {
          const taskId = generateId();
          const newTask: ToDo = {
            id: taskId,
            content,
            progress: 0,
            assignedUserIds: [],
            lastUpdated: Date.now(),
            ...(backgroundImageUrl && { backgroundImageUrl }),
          };

          set((state) => ({
            tasks: {
              ...state.tasks,
              [taskId]: newTask,
            },
            columns: {
              ...state.columns,
              [columnId]: {
                ...state.columns[columnId],
                taskIds: [...state.columns[columnId].taskIds, taskId],
              },
            },
          }));
          
          return taskId;
        },

        updateTask: (taskId: string, updates: Partial<ToDo>) => {
          set((state) => ({
            tasks: {
              ...state.tasks,
              [taskId]: {
                ...state.tasks[taskId],
                ...updates,
                lastUpdated: Date.now(),
              },
            },
          }));
        },

        deleteTask: (taskId: string) => {
          set((state) => {
            // Ensure the task exists before attempting to delete
            if (!state.tasks[taskId]) {
              console.warn(`Task ${taskId} not found`);
              return state;
            }

            const newTasks = { ...state.tasks };
            delete newTasks[taskId];

            const newColumns = { ...state.columns };
            Object.keys(newColumns).forEach((columnId) => {
              newColumns[columnId] = {
                ...newColumns[columnId],
                taskIds: newColumns[columnId].taskIds.filter((id) => id !== taskId),
              };
            });

            console.log(`Deleted task ${taskId}`);
            return {
              tasks: newTasks,
              columns: newColumns,
            };
          });
        },

        moveTask: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => {
          set((state) => {
            console.log('[BoardStore] Moving task:', { taskId, from: sourceColumnId, to: destColumnId, index: destIndex });
            const sourceColumn = state.columns[sourceColumnId];
            const destColumn = state.columns[destColumnId];

            if (!sourceColumn || !destColumn) return state;

            const sourceTaskIds = [...sourceColumn.taskIds];
            const destTaskIds = sourceColumnId === destColumnId ? sourceTaskIds : [...destColumn.taskIds];

            // Remove from source
            const sourceIndex = sourceTaskIds.indexOf(taskId);
            if (sourceIndex === -1) return state;
            sourceTaskIds.splice(sourceIndex, 1);

            // Add to destination
            destTaskIds.splice(destIndex, 0, taskId);

            // Update task with timestamps
            const updatedTasks = { ...state.tasks };
            const isMovingToDone = destColumn.title.toLowerCase() === 'done' && sourceColumnId !== destColumnId;
            
            updatedTasks[taskId] = {
              ...updatedTasks[taskId],
              lastUpdated: Date.now(),
              ...(isMovingToDone && { movedToDoneAt: Date.now() }),
            };

            return {
              tasks: updatedTasks,
              columns: {
                ...state.columns,
                [sourceColumnId]: {
                  ...sourceColumn,
                  taskIds: sourceTaskIds,
                },
                ...(sourceColumnId !== destColumnId && {
                  [destColumnId]: {
                    ...destColumn,
                    taskIds: destTaskIds,
                  },
                }),
              },
            };
          });
        },

        addColumn: (title: string) => {
          const columnId = generateId();
          const newColumn: Column = {
            id: columnId,
            title,
            taskIds: [],
          };

          set((state) => ({
            columns: {
              ...state.columns,
              [columnId]: newColumn,
            },
            columnOrder: [...state.columnOrder, columnId],
          }));
        },

        updateColumn: (columnId: string, updates: Partial<Column>) => {
          set((state) => ({
            columns: {
              ...state.columns,
              [columnId]: {
                ...state.columns[columnId],
                ...updates,
              },
            },
          }));
        },

        deleteColumn: (columnId: string) => {
          set((state) => {
            const column = state.columns[columnId];
            if (!column) return state;

            // Delete all tasks in the column
            const newTasks = { ...state.tasks };
            column.taskIds.forEach((taskId) => {
              delete newTasks[taskId];
            });

            // Delete the column
            const newColumns = { ...state.columns };
            delete newColumns[columnId];

            return {
              tasks: newTasks,
              columns: newColumns,
              columnOrder: state.columnOrder.filter((id) => id !== columnId),
            };
          });
        },

        reorderColumns: (newColumnOrder: string[]) => {
          set({ columnOrder: newColumnOrder });
        },

        setBoardState: (newState: Partial<BoardState>) => {
          console.log('[BoardStore] Setting board state with new data');
          set(newState);
        },
      }),
      {
        name: 'board-store',
      }
    )
  )
);