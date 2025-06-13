import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import styled from 'styled-components';
import { isValidBoardData, isValidUserData } from '../../utils/dataValidation';

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const BackupSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 16px;
  color: #333;
`;

const BackupInfo = styled.div`
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

export const SimpleBackupManager: React.FC = () => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const downloadBackup = () => {
    try {
      // Get current state
      const boardState = useBoardStore.getState();
      const userState = useUserStore.getState();
      const uiState = useUIStore.getState();
      
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        board: {
          tasks: boardState.tasks,
          columns: boardState.columns,
          columnOrder: boardState.columnOrder,
        },
        users: {
          users: userState.users,
          currentUserId: userState.currentUserId,
        },
        settings: {
          autoDeleteHours: uiState.autoDeleteHours,
          isEditMode: uiState.isEditMode,
        },
      };
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kawaii-todo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        
        // Validate backup structure
        if (!backup.board || !backup.users) {
          throw new Error('Invalid backup file format');
        }
        
        // Validate board data
        if (!isValidBoardData(backup.board)) {
          throw new Error('Invalid board data in backup');
        }
        
        // Validate user data
        if (!isValidUserData(backup.users)) {
          throw new Error('Invalid user data in backup');
        }
        
        // Restore data
        useBoardStore.getState().setBoardState(backup.board);
        useUserStore.setState(backup.users);
        
        if (backup.settings?.autoDeleteHours !== undefined) {
          useUIStore.getState().setAutoDeleteHours(backup.settings.autoDeleteHours);
        }
        
        setMessage({ type: 'success', text: 'Backup restored successfully!' });
        
        // Close modal after short delay
        setTimeout(() => {
          setShowBackupModal(false);
          setMessage(null);
        }, 2000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to restore backup. Please check the file format.' });
      }
    };
    
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };
  
  return (
    <>
      <ActionButton 
        onClick={() => setShowBackupModal(true)}
        title="Backup & Restore"
      >
        💾
      </ActionButton>

      <Modal
        isOpen={showBackupModal}
        onClose={() => {
          setShowBackupModal(false);
          setMessage(null);
        }}
        title="Backup & Restore"
      >
        <div style={{ padding: '20px', minWidth: '400px' }}>
          {message && (
            <div style={{
              background: message.type === 'success' ? '#e8f5e9' : '#ffebee',
              color: message.type === 'success' ? '#2e7d32' : '#c62828',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}>
              {message.text}
            </div>
          )}
          
          <BackupSection>
            <SectionTitle>Download Backup</SectionTitle>
            <BackupInfo>
              Save all your tasks, columns, users, and settings to a file on your device.
            </BackupInfo>
            <Button
              onClick={downloadBackup}
              style={{
                background: 'linear-gradient(135deg, #34a853 0%, #4285f4 100%)',
                color: 'white',
                padding: '10px 20px',
              }}
            >
              Download Backup
            </Button>
          </BackupSection>
          
          <BackupSection>
            <SectionTitle>Restore from Backup</SectionTitle>
            <BackupInfo>
              Upload a previously downloaded backup file to restore your data.
              <br />
              <strong>Warning:</strong> This will replace all current data.
            </BackupInfo>
            <ButtonGroup>
              <FileInputLabel>
                Choose Backup File
                <FileInput 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                />
              </FileInputLabel>
            </ButtonGroup>
          </BackupSection>
          
          <BackupSection>
            <SectionTitle>Automatic Backups</SectionTitle>
            <BackupInfo>
              The app automatically saves your data locally and keeps the 5 most recent backups.
              <br />
              Your data is also saved to the cloud when using Firebase hosting.
            </BackupInfo>
          </BackupSection>
        </div>
      </Modal>
    </>
  );
};