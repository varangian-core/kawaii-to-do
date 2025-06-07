import React, { useState } from 'react';
import styled from 'styled-components';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { useBoardStore } from '../../store/boardStore';
import { useUserStore } from '../../store/userStore';
import { Column } from './Column';
import { ToDoCard } from '../ToDo/ToDoCard';
import { Button } from '../common/Button';
import { UserManager } from '../UserManager/UserManager';

const BoardContainer = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  padding: 2rem 0;
  overflow-x: auto;
  min-height: 600px;
  align-items: flex-start;
  position: relative;
  z-index: 1;
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

const DragOverlayContainer = styled.div`
  cursor: grabbing;
  transform: rotate(3deg);
`;

export const KanbanBoard: React.FC = () => {
  const { columns, columnOrder, tasks, moveTask, reorderColumns, addColumn, updateTask } = useBoardStore();
  const { users } = useUserStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'task' | 'column' | 'user' | null>(null);
  const [activeUser, setActiveUser] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeIdStr = active.id as string;
    setActiveId(activeIdStr);
    
    // Determine what we're dragging
    if (active.data.current?.type === 'user') {
      setActiveType('user');
      setActiveUser(active.data.current.user);
    } else if (tasks[activeIdStr]) {
      setActiveType('task');
    } else if (columns[activeIdStr]) {
      setActiveType('column');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveType(null);
      setActiveUser(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Handle user drops on tasks
    if (activeType === 'user' && tasks[overId]) {
      const user = active.data.current?.user;
      if (user) {
        updateTask(overId, { assignedUserId: user.id });
      }
      setActiveId(null);
      setActiveType(null);
      setActiveUser(null);
      return;
    }

    // Handle column reordering
    if (activeType === 'column' && activeId !== overId) {
      const oldIndex = columnOrder.indexOf(activeId);
      const newIndex = columnOrder.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...columnOrder];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, activeId);
        reorderColumns(newOrder);
      }
    }
    
    // Handle task movement
    if (activeType === 'task') {
      const activeTask = tasks[activeId];
      if (!activeTask) return;

      // Find source column
      let sourceColumnId: string | null = null;
      for (const [columnId, column] of Object.entries(columns)) {
        if (column.taskIds.includes(activeId)) {
          sourceColumnId = columnId;
          break;
        }
      }

      if (!sourceColumnId) return;

      // Determine destination column and index
      let destColumnId = sourceColumnId;
      let destIndex = 0;

      // If dropping on a column
      if (columns[overId]) {
        destColumnId = overId;
        destIndex = columns[overId].taskIds.length;
      } 
      // If dropping on a task
      else if (tasks[overId]) {
        // Find which column contains the target task
        for (const [columnId, column] of Object.entries(columns)) {
          const taskIndex = column.taskIds.indexOf(overId);
          if (taskIndex !== -1) {
            destColumnId = columnId;
            // Insert after the target task
            destIndex = taskIndex + 1;
            break;
          }
        }
      }

      if (sourceColumnId && destColumnId) {
        moveTask(activeId, sourceColumnId, destColumnId, destIndex);
      }
    }

    setActiveId(null);
    setActiveType(null);
    setActiveUser(null);
  };

  const handleAddColumn = () => {
    const title = prompt('Enter column title:');
    if (title && title.trim()) {
      addColumn(title.trim());
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 2 }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
            
            <AddColumnButton onClick={handleAddColumn}>
              + Add Column
            </AddColumnButton>
          </BoardContainer>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId && activeType === 'task' && tasks[activeId] && (
            <DragOverlayContainer>
              <ToDoCard task={tasks[activeId]} isDragging={false} />
            </DragOverlayContainer>
          )}
          {activeType === 'user' && activeUser && (
            <DragOverlayContainer>
              <div style={{
                background: activeUser.color,
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}>
                {activeUser.icon && <span style={{ fontSize: '1.2rem' }}>{activeUser.icon}</span>}
                <span>{activeUser.name}</span>
              </div>
            </DragOverlayContainer>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};