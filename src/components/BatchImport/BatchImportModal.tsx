import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBoardStore } from '../../store/boardStore';
import { useUserStore } from '../../store/userStore';
import { parseTasks } from '../../utils/taskParser';

const TextArea = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #ff6ec4;
  }
`;

const Instructions = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const SecondaryButton = styled(Button)`
  background: #e9ecef;
  color: #495057;
  
  &:hover:not(:disabled) {
    background: #dee2e6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ResultMessage = styled.div<{ $success: boolean }>`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: ${props => props.$success ? '#d4edda' : '#f8d7da'};
  color: ${props => props.$success ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.$success ? '#c3e6cb' : '#f5c6cb'};
`;

const UserAssignmentSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const UserSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  margin-top: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #ff6ec4;
  }
`;

const UserSelectLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageManifest {
  landscapes?: { images: Array<{ name: string; path: string }> };
  abstract?: { images: Array<{ name: string; path: string }> };
  [key: string]: any;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [resultMessage, setResultMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('none');
  const { tasks, columns, addTask, updateTask } = useBoardStore();
  const { users, currentUserId } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableImages();
      // Default to current user if available
      if (currentUserId) {
        setSelectedUserId(currentUserId);
      }
    }
  }, [isOpen, currentUserId]);

  const fetchAvailableImages = async () => {
    try {
      const response = await fetch('/images.json');
      if (response.ok) {
        const data: ImageManifest = await response.json();
        const images: string[] = [];
        
        // Collect all image paths from all categories
        Object.values(data).forEach(category => {
          if (category && typeof category === 'object' && category.images && Array.isArray(category.images)) {
            category.images.forEach((img: { path: string }) => {
              images.push(img.path);
            });
          }
        });
        
        setAvailableImages(images);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const getRandomImage = (): string | undefined => {
    if (availableImages.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    return availableImages[randomIndex];
  };


  const checkDuplicateTask = (content: string): boolean => {
    const normalizedContent = content.toLowerCase().trim();
    return Object.values(tasks).some(task => 
      task.content.toLowerCase().trim() === normalizedContent
    );
  };

  const handleImport = () => {
    const parsedTasks = parseTasks(inputText);
    
    if (parsedTasks.length === 0) {
      setResultMessage({ text: 'No valid tasks found to import.', success: false });
      return;
    }

    // Find the "To Do" column
    const todoColumn = Object.values(columns).find(col => 
      col.title.toLowerCase() === 'to do' || col.title.toLowerCase() === 'todo'
    );

    if (!todoColumn) {
      setResultMessage({ text: 'Could not find "To Do" column.', success: false });
      return;
    }

    let importedCount = 0;
    let duplicateCount = 0;

    parsedTasks.forEach(taskContent => {
      if (!checkDuplicateTask(taskContent)) {
        const randomImage = getRandomImage();
        const newTaskId = addTask(todoColumn.id, taskContent, randomImage);
        
        // Assign user if selected
        if (selectedUserId !== 'none') {
          updateTask(newTaskId, { assignedUserIds: [selectedUserId] });
        }
        
        importedCount++;
      } else {
        duplicateCount++;
      }
    });

    const message = `Successfully imported ${importedCount} task(s).${
      duplicateCount > 0 ? ` ${duplicateCount} duplicate(s) were skipped.` : ''
    }`;
    
    setResultMessage({ text: message, success: true });
    
    // Clear the input after successful import
    if (importedCount > 0) {
      setInputText('');
      setTimeout(() => {
        onClose();
        setResultMessage(null);
      }, 2000);
    }
  };

  const handleClose = () => {
    setInputText('');
    setResultMessage(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Batch Import Tasks">
      <Instructions>
        <h4>📝 How to import tasks:</h4>
        <ul>
          <li>Enter one task per line</li>
          <li>Bullet points (-, *, •) and numbered lists are supported</li>
          <li>Markdown checkboxes (- [ ]) are also supported</li>
          <li>Duplicate tasks will be automatically skipped</li>
        </ul>
      </Instructions>
      
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste your tasks here...

Example:
- [ ] Assess latest real estate news (30 min)
- [x] Review pull requests
- [ ] (Optional) Update dependencies (2 hours)
- Look into upgrading the internet — Note: Quest idea"
      />
      
      <UserAssignmentSection>
        <UserSelectLabel htmlFor="user-assignment">
          Assign imported tasks to:
        </UserSelectLabel>
        <UserSelect 
          id="user-assignment"
          value={selectedUserId} 
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="none">No assignment</option>
          {Object.values(users).map(user => (
            <option key={user.id} value={user.id}>
              {user.icon} {user.name}
            </option>
          ))}
        </UserSelect>
      </UserAssignmentSection>
      
      {resultMessage && (
        <ResultMessage $success={resultMessage.success}>
          {resultMessage.text}
        </ResultMessage>
      )}
      
      <ButtonContainer>
        <SecondaryButton onClick={handleClose}>
          Cancel
        </SecondaryButton>
        <Button 
          onClick={handleImport}
          disabled={!inputText.trim()}
        >
          Import Tasks
        </Button>
      </ButtonContainer>
    </Modal>
  );
};