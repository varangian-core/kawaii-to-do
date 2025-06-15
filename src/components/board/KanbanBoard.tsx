import React, { useState } from 'react';
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
import { AddColumnModal } from '../common/AddColumnModal';

const BoardWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    height: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    margin: 0 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

const BoardContainer = styled(motion.div)`
  display: inline-flex;
  gap: 1.5rem;
  padding: 1.5rem;
  min-height: calc(100vh - 200px);
  align-items: stretch;
  position: relative;
  z-index: 1;
  min-width: max-content;
  
  @media (max-width: 768px) {
    gap: 1rem;
    padding: 1rem;
    min-height: calc(100vh - 250px);
  }
`;

const AddColumnButton = styled(Button)`
  min-width: 280px;
  height: fit-content;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed #ccc;
  color: #666;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #999;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    min-width: 200px;
    padding: 0.75rem;
    font-size: 0.9rem;
  }
`;

export const KanbanBoard: React.FC = () => {
  const { columns, columnOrder, tasks, addColumn } = useBoardStore();
  const { isEditMode } = useUIStore();
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);

  const handleAddColumn = (title: string) => {
    addColumn(title);
    setShowAddColumnModal(false);
  };

  return (
    <>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <UserManager />
        
        <BoardWrapper>
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
                <AddColumnButton onClick={() => setShowAddColumnModal(true)}>
                  + Add Column
                </AddColumnButton>
              )}
            </BoardContainer>
          </SortableContext>
        </BoardWrapper>
      </div>
      
      <AddColumnModal
        isOpen={showAddColumnModal}
        onClose={() => setShowAddColumnModal(false)}
        onAdd={handleAddColumn}
      />
    </>
  );
};