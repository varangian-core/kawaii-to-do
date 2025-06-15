import React from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { Button } from './Button';

const ModalContent = styled.div`
  padding: 20px;
  min-width: 400px;
  
  @media (max-width: 480px) {
    min-width: 300px;
  }
`;

const WarningIcon = styled.div`
  font-size: 48px;
  text-align: center;
  margin-bottom: 20px;
`;

const Message = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h3`
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const TaskCount = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  color: #856404;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

interface DeleteColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  columnTitle: string;
  taskCount: number;
}

export const DeleteColumnModal: React.FC<DeleteColumnModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  columnTitle,
  taskCount,
}) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Column">
      <ModalContent>
        <WarningIcon>⚠️</WarningIcon>
        
        <Message>
          <Title>Delete "{columnTitle}" column?</Title>
          <Description>
            This action cannot be undone. The column and all its tasks will be permanently deleted.
          </Description>
        </Message>

        {taskCount > 0 && (
          <TaskCount>
            🗒️ This column contains {taskCount} task{taskCount !== 1 ? 's' : ''} that will be deleted
          </TaskCount>
        )}

        <ButtonGroup>
          <Button
            onClick={onClose}
            style={{
              background: '#f0f0f0',
              color: '#666',
              minWidth: '120px',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
              color: 'white',
              minWidth: '120px',
            }}
          >
            Delete Column
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};