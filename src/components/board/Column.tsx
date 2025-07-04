import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, ToDo } from '../../store/boardStore';
import { ToDoCard } from '../ToDo/ToDoCard';
import { useBoardStore } from '../../store/boardStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ColumnFilterButton } from '../common/ColumnFilterButton';
import { DeleteColumnModal } from '../common/DeleteColumnModal';

const ColumnContainer = styled(motion.div)<{ isDragging?: boolean }>`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
  width: 320px;
  min-width: 280px;
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
  border: 1px solid rgba(255, 182, 193, 0.3);
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: calc(100vh - 220px);
  opacity: ${props => props.isDragging ? 0.5 : 1};
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  
  @media (max-width: 768px) {
    width: 280px;
    min-width: 250px;
    padding: 0.75rem;
    max-height: calc(100vh - 280px);
  }
  
  @media (max-width: 480px) {
    width: 250px;
    min-width: 220px;
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
  position: relative;
`;

const ColumnTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const TaskCount = styled.span`
  font-size: 0.8rem;
  color: #666;
  background: #f0f0f0;
  padding: 0.15rem 0.4rem;
  border-radius: 8px;
  font-weight: 500;
`;

const TasksContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  min-height: 60px;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

const AddTaskContainer = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
`;

const DeleteButton = styled(Button)`
  background: #ff6b6b;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  
  &:hover {
    background: #ff5252;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 0.3rem;
  align-items: center;
`;

const DuplicateNotification = styled(motion.div)`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff6b6b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  white-space: nowrap;
  z-index: 10;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #ff6b6b;
  }
`;

interface ColumnProps {
  column: ColumnType;
  tasks: ToDo[];
}

export const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const { addTask, deleteColumn, updateColumn, tasks: allTasks } = useBoardStore();
  const { selectedUserFilters, columnUserFilters, filterMode, isEditMode } = useUIStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [showDuplicateNotification, setShowDuplicateNotification] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Auto-dismiss duplicate notification
  useEffect(() => {
    if (showDuplicateNotification) {
      const timer = setTimeout(() => {
        setShowDuplicateNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDuplicateNotification]);

  // Determine which filters to use based on filter mode
  const activeFilters = filterMode === 'column' 
    ? (columnUserFilters[column.id] || [])
    : selectedUserFilters;

  // Filter tasks based on active filters
  const filteredTasks = activeFilters.length > 0
    ? tasks.filter(task => {
        if (!task.assignedUserIds || task.assignedUserIds.length === 0) {
          return false;
        }
        return task.assignedUserIds.some(userId => activeFilters.includes(userId));
      })
    : tasks;

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddTask = () => {
    const trimmedContent = newTaskContent.trim();
    if (trimmedContent) {
      // Check for duplicate task across all columns
      const isDuplicate = Object.values(allTasks).some(
        task => task.content.toLowerCase().trim() === trimmedContent.toLowerCase()
      );
      
      if (isDuplicate) {
        setShowDuplicateNotification(true);
        return;
      }
      
      addTask(column.id, trimmedContent);
      setNewTaskContent('');
      setIsAddingTask(false);
    }
  };

  const handleDeleteColumn = () => {
    deleteColumn(column.id);
    setShowDeleteModal(false);
  };

  const handleUpdateTitle = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      updateColumn(column.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isAddingTask) {
        handleAddTask();
      } else if (isEditingTitle) {
        handleUpdateTitle();
      }
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setIsEditingTitle(false);
      setEditedTitle(column.title);
    }
  };

  return (
    <>
      <ColumnContainer
        ref={(node) => {
          setSortableRef(node);
          setDroppableRef(node);
        }}
        style={style}
        isDragging={isDragging}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
      <ColumnHeader {...attributes} {...listeners}>
        {isEditingTitle ? (
          <Input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{ fontSize: '1.1rem', fontWeight: 600 }}
          />
        ) : (
          <ColumnTitle onDoubleClick={() => setIsEditingTitle(true)}>
            {column.title}
          </ColumnTitle>
        )}
        <HeaderControls>
          <TaskCount>{filteredTasks.length}</TaskCount>
          <ColumnFilterButton columnId={column.id} />
          {isEditMode && (
            <DeleteButton onClick={() => setShowDeleteModal(true)}>×</DeleteButton>
          )}
        </HeaderControls>
      </ColumnHeader>

      <SortableContext
        items={filteredTasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <TasksContainer>
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <ToDoCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </TasksContainer>
      </SortableContext>

      <AddTaskContainer>
        <AnimatePresence>
          {showDuplicateNotification && (
            <DuplicateNotification
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              This task already exists!
            </DuplicateNotification>
          )}
        </AnimatePresence>
        {isAddingTask ? (
          <>
            <Input
              type="text"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter task..."
              autoFocus
              style={{ flex: 1 }}
            />
            <Button onClick={handleAddTask} disabled={!newTaskContent.trim()}>
              Add
            </Button>
            <Button onClick={() => {
              setIsAddingTask(false);
              setNewTaskContent('');
              setShowDuplicateNotification(false);
            }}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsAddingTask(true)} style={{ width: '100%' }}>
            + Add Task
          </Button>
        )}
      </AddTaskContainer>
      </ColumnContainer>
      
      <DeleteColumnModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteColumn}
        columnTitle={column.title}
        taskCount={tasks.length}
      />
    </>
  );
};