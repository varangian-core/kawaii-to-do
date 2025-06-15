import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

const ModalContent = styled.div`
  padding: 20px;
  min-width: 400px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Column">
      <ModalContent>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="column-title">Column Title</Label>
            <Input
              id="column-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter column title"
              autoFocus
            />
          </div>
          <ButtonGroup>
            <Button
              type="button"
              onClick={handleClose}
              style={{
                background: '#f0f0f0',
                color: '#666',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                opacity: title.trim() ? 1 : 0.5,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Add Column
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </Modal>
  );
};