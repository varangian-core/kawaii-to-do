import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, ToDo } from '../../store/boardStore';
import { ToDoCard } from '../ToDo/ToDoCard';
import { useBoardStore } from '../../store/boardStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

const ColumnContainer = styled(motion.div)<{ isDragging?: boolean }>`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
  min-width: 300px;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
  border: 1px solid rgba(255, 182, 193, 0.3);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
  opacity: ${props => props.isDragging ? 0.5 : 1};
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
`;

const ColumnTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const TaskCount = styled.span`
  font-size: 0.9rem;
  color: #666;
  background: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
`;

const TasksContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
  min-height: 100px;
`;

const AddTaskContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
`;

const DeleteButton = styled(Button)`
  background: #ff6b6b;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  
  &:hover {
    background: #ff5252;
  }
`;

interface ColumnProps {
  column: ColumnType;
  tasks: ToDo[];
}

export const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const { addTask, deleteColumn, updateColumn } = useBoardStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);

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
    if (newTaskContent.trim()) {
      addTask(column.id, newTaskContent.trim());
      setNewTaskContent('');
      setIsAddingTask(false);
    }
  };

  const handleDeleteColumn = () => {
    if (window.confirm(`Delete column "${column.title}" and all its tasks?`)) {
      deleteColumn(column.id);
    }
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <TaskCount>{tasks.length}</TaskCount>
          <DeleteButton onClick={handleDeleteColumn}>×</DeleteButton>
        </div>
      </ColumnHeader>

      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <TasksContainer>
          <AnimatePresence>
            {tasks.map((task) => (
              <ToDoCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </TasksContainer>
      </SortableContext>

      <AddTaskContainer>
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
  );
};