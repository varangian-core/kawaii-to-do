import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ToDo } from '../../store/boardStore';
import { useBoardStore } from '../../store/boardStore';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CircularProgress } from '../common/CircularProgress';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { mixColors } from '../../utils/colorUtils';

const CardContainer = styled(motion.div)<{ isDragging?: boolean; backgroundImage?: string; $isOver?: boolean }>`
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
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: ${props => props.$isOver ? '2px solid #667eea' : '2px solid transparent'};
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  
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
  margin-bottom: auto;
  flex: 1;
  display: flex;
  align-items: flex-start;
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
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  position: relative;
  z-index: 2;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
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

const UserBadge = styled.div<{ $color: string }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: ${props => props.$color};
  color: white;
  border-radius: 1rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const UserIcon = styled.span`
  font-size: 0.9rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

interface ToDoCardProps {
  task: ToDo;
  isDragging?: boolean;
}

export const ToDoCard: React.FC<ToDoCardProps> = ({ task, isDragging = false }) => {
  const { updateTask, deleteTask } = useBoardStore();
  const { openImagePicker } = useUIStore();
  const { users, currentUserId } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(task.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const assignedUsers = task.assignedUserIds?.map(id => users[id]).filter(Boolean) || [];
  
  // Calculate mixed color for multiple users
  const badgeColor = assignedUsers.length > 1 
    ? mixColors(assignedUsers.map(u => u.color))
    : assignedUsers[0]?.color || '#ddd';

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: task.id,
  });

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteModal(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditedContent(task.content);
      setIsEditing(false);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUserId) {
      const currentUserIds = task.assignedUserIds || [];
      const isAssigned = currentUserIds.includes(currentUserId);
      
      if (isAssigned) {
        // Remove current user from assigned users
        updateTask(task.id, { 
          assignedUserIds: currentUserIds.filter(id => id !== currentUserId) 
        });
      } else {
        // Add current user to assigned users
        updateTask(task.id, { 
          assignedUserIds: [...currentUserIds, currentUserId] 
        });
      }
    }
  };

  const handleProgressChange = (newProgress: number) => {
    updateTask(task.id, { progress: newProgress });
  };

  return (
    <CardContainer
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      isDragging={isDragging || isSortableDragging}
      backgroundImage={task.backgroundImageUrl}
      $isOver={isOver}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.2 }}
      layout
      {...attributes}
      {...listeners}
    >
      {assignedUsers.length > 0 && (
        <UserBadge 
          $color={badgeColor}
          onClick={handleUserClick}
          title={`Assigned to ${assignedUsers.map(u => u.name).join(', ')}`}
        >
          {assignedUsers.length === 1 ? (
            <>
              {assignedUsers[0].icon && <UserIcon>{assignedUsers[0].icon}</UserIcon>}
              <span>{assignedUsers[0].name}</span>
            </>
          ) : assignedUsers.length === 2 ? (
            <>
              {assignedUsers[0].icon && <UserIcon>{assignedUsers[0].icon}</UserIcon>}
              <span>{assignedUsers[0].name} / {assignedUsers[1].name}</span>
            </>
          ) : (
            <>
              {assignedUsers[0].icon && <UserIcon>{assignedUsers[0].icon}</UserIcon>}
              <span>{assignedUsers[0].name} +{assignedUsers.length - 1}</span>
            </>
          )}
        </UserBadge>
      )}
      
      {assignedUsers.length === 0 && currentUserId && (
        <UserBadge 
          $color="#ddd"
          onClick={handleUserClick}
          title="Click to assign yourself"
          style={{ opacity: 0.6 }}
        >
          <span>+</span>
        </UserBadge>
      )}
      
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
        <CircularProgress 
          progress={task.progress || 0} 
          onProgressChange={handleProgressChange}
        />
        <ButtonGroup>
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
            onClick={handleDelete}
            title="Delete task"
          >
            🗑️
          </DeleteButton>
        </ButtonGroup>
      </ActionsContainer>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        taskContent={task.content}
      />
    </CardContainer>
  );
};