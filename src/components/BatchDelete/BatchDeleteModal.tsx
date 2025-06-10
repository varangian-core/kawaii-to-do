import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBoardStore } from '../../store/boardStore';
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
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #856404;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #856404;
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

const DeleteButton = styled(Button)`
  background: #dc3545;
  
  &:hover:not(:disabled) {
    background: #c82333;
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

const PreviewSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const PreviewTitle = styled.h5`
  margin: 0 0 0.5rem 0;
  color: #495057;
`;

const TaskList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.9rem;
  color: #666;
`;

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatchDeleteModal: React.FC<BatchDeleteModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [resultMessage, setResultMessage] = useState<{ text: string; success: boolean } | null>(null);
  const { tasks, columns, deleteTask } = useBoardStore();


  const findMatchingTasks = (searchTerms: string[]): Array<{ taskId: string; content: string; columnTitle: string }> => {
    const matchingTasks: Array<{ taskId: string; content: string; columnTitle: string }> = [];
    
    searchTerms.forEach(searchTerm => {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      
      Object.entries(tasks).forEach(([taskId, task]) => {
        if (task.content.toLowerCase().trim() === normalizedSearch) {
          // Find which column contains this task
          const column = Object.values(columns).find(col => col.taskIds.includes(taskId));
          if (column) {
            matchingTasks.push({
              taskId,
              content: task.content,
              columnTitle: column.title
            });
          }
        }
      });
    });

    return matchingTasks;
  };

  const handleDelete = () => {
    const searchTerms = parseTasks(inputText);
    
    if (searchTerms.length === 0) {
      setResultMessage({ text: 'No tasks specified for deletion.', success: false });
      return;
    }

    const matchingTasks = findMatchingTasks(searchTerms);
    
    if (matchingTasks.length === 0) {
      setResultMessage({ text: 'No matching tasks found.', success: false });
      return;
    }

    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete ${matchingTasks.length} task(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Delete all matching tasks
    matchingTasks.forEach(({ taskId }) => {
      deleteTask(taskId);
    });

    const message = `Successfully deleted ${matchingTasks.length} task(s).`;
    setResultMessage({ text: message, success: true });
    
    // Clear the input after successful deletion
    setInputText('');
    setTimeout(() => {
      onClose();
      setResultMessage(null);
    }, 2000);
  };

  const handleClose = () => {
    setInputText('');
    setResultMessage(null);
    onClose();
  };

  // Preview matching tasks
  const previewTasks = inputText.trim() ? findMatchingTasks(parseTasks(inputText)) : [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Batch Delete Tasks">
      <Instructions>
        <h4>⚠️ Batch Delete Tasks</h4>
        <ul>
          <li>Enter the exact task names you want to delete (one per line)</li>
          <li>Only tasks with exact matches will be deleted</li>
          <li>Tasks will be deleted from all columns</li>
          <li>This action cannot be undone!</li>
        </ul>
      </Instructions>
      
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter tasks to delete (one per line)...

Example:
- [ ] Assess latest real estate news (30 min)
- [x] Review pull requests
- [ ] (Optional) Update dependencies (2 hours)
- Look into upgrading the internet — Note: Quest idea"
      />
      
      {previewTasks.length > 0 && (
        <PreviewSection>
          <PreviewTitle>Tasks to be deleted ({previewTasks.length}):</PreviewTitle>
          <TaskList>
            {previewTasks.map((task, index) => (
              <li key={index}>
                "{task.content}" (from {task.columnTitle})
              </li>
            ))}
          </TaskList>
        </PreviewSection>
      )}
      
      {resultMessage && (
        <ResultMessage $success={resultMessage.success}>
          {resultMessage.text}
        </ResultMessage>
      )}
      
      <ButtonContainer>
        <SecondaryButton onClick={handleClose}>
          Cancel
        </SecondaryButton>
        <DeleteButton 
          onClick={handleDelete}
          disabled={!inputText.trim() || previewTasks.length === 0}
        >
          Delete Tasks ({previewTasks.length})
        </DeleteButton>
      </ButtonContainer>
    </Modal>
  );
};