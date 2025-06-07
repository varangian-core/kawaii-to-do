import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ToDo } from '../../store/boardStore';
import { useBoardStore } from '../../store/boardStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

const CardContainer = styled(motion.div)<{ isDragging?: boolean; backgroundImage?: string }>`
  background: ${props => {
    if (!props.backgroundImage) {
      return 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)';
    }
    if (props.backgroundImage.startsWith('linear-gradient')) {
      return props.backgroundImage;
    }
    return `url(${props.backgroundImage})`;
  }};
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  padding: 1rem;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  box-shadow: ${props => props.isDragging ? '0 8px 16px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragging ? 'scale(1.02)' : 'scale(1)'};
  position: relative;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const ContentOverlay = styled.div<{ $hasBackground?: boolean }>`
  background: ${props => props.$hasBackground 
    ? 'rgba(255, 255, 255, 0.9)' 
    : 'transparent'};
  border-radius: 8px;
  padding: ${props => props.$hasBackground ? '0.5rem' : '0'};
  margin-bottom: 0.5rem;
`;

const TaskContent = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #333;
  word-wrap: break-word;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const ActionButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.9);
  color: #666;
  
  &:hover {
    background: white;
    color: #333;
  }
`;

const DeleteButton = styled(ActionButton)`
  background: rgba(255, 107, 107, 0.9);
  color: white;
  
  &:hover {
    background: #ff6b6b;
  }
`;

interface ToDoCardProps {
  task: ToDo;
  isDragging?: boolean;
}

export const ToDoCard: React.FC<ToDoCardProps> = ({ task, isDragging = false }) => {
  const { updateTask, deleteTask } = useBoardStore();
  const { openImagePicker } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(task.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== task.content) {
      updateTask(task.id, { content: editedContent.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      deleteTask(task.id);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditedContent(task.content);
      setIsEditing(false);
    }
  };

  return (
    <CardContainer
      ref={setNodeRef}
      style={style}
      isDragging={isDragging || isSortableDragging}
      backgroundImage={task.backgroundImageUrl}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      {...attributes}
      {...listeners}
    >
      <ContentOverlay $hasBackground={!!task.backgroundImageUrl}>
        {isEditing ? (
          <Input
            type="text"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyPress}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: 0 }}
          />
        ) : (
          <TaskContent onDoubleClick={() => setIsEditing(true)}>
            {task.content}
          </TaskContent>
        )}
      </ContentOverlay>
      
      <ActionsContainer>
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            openImagePicker(task.id);
          }}
          title="Change background image"
        >
          🎨
        </ActionButton>
        <DeleteButton
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          title="Delete task"
        >
          🗑️
        </DeleteButton>
      </ActionsContainer>
    </CardContainer>
  );
};