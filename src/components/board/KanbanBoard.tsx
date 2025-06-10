import React from 'react';
import styled from 'styled-components';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { useBoardStore } from '../../store/boardStore';
import { useUIStore } from '../../store/uiStore';
import { Column } from './Column';
import { Button } from '../common/Button';
import { UserManager } from '../UserManager/UserManager';

const BoardContainer = styled(motion.div)`
  display: flex;
  gap: 2rem;
  padding: 2rem 1rem;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: calc(100vh - 180px);
  align-items: stretch;
  position: relative;
  z-index: 1;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

const AddColumnButton = styled(Button)`
  min-width: 300px;
  height: fit-content;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed #ccc;
  color: #666;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #999;
  }
`;

export const KanbanBoard: React.FC = () => {
  const { columns, columnOrder, tasks, addColumn } = useBoardStore();
  const { isEditMode } = useUIStore();

  const handleAddColumn = () => {
    const title = prompt('Enter column title:');
    if (title && title.trim()) {
      addColumn(title.trim());
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 2 }}>
      <UserManager />
      
      <SortableContext
        items={columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        <BoardContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            if (!column) return null;

            return (
              <Column
                key={column.id}
                column={column}
                tasks={column.taskIds.map((taskId) => tasks[taskId]).filter(Boolean)}
              />
            );
          })}
          
          {isEditMode && (
            <AddColumnButton onClick={handleAddColumn}>
              + Add Column
            </AddColumnButton>
          )}
        </BoardContainer>
      </SortableContext>
    </div>
  );
};