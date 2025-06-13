import React, { useEffect, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { useBackupStore, startAutoBackup, stopAutoBackup } from '../../store/backupStore';
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
  padding-bottom: 32px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
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

const ConfigRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ConfigLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
`;

const Select = styled.select`
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const HybridBackupManager: React.FC = () => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { isEditMode } = useUIStore();
  
  const {
    isInitialized,
    isAuthenticated,
    isBackingUp,
    isRestoring,
    lastBackupTime,
    autoBackupEnabled,
    autoBackupInterval,
    backupError,
    initializeGoogleDrive,
    authenticate,
    createBackup,
    restoreBackup,
    setAutoBackup,
    signOut,
  } = useBackupStore();

  // Initialize Google Drive when modal opens
  useEffect(() => {
    if (showBackupModal && !isInitialized && isEditMode) {
      initializeGoogleDrive();
    }
  }, [showBackupModal, isInitialized, isEditMode, initializeGoogleDrive]);

  // Handle auto-backup
  useEffect(() => {
    if (isAuthenticated && autoBackupEnabled) {
      startAutoBackup();
    } else {
      stopAutoBackup();
    }

    return () => stopAutoBackup();
  }, [isAuthenticated, autoBackupEnabled]);

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

  const formatLastBackupTime = () => {
    if (!lastBackupTime) return 'Never';
    
    const date = new Date(lastBackupTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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
        <div style={{ padding: '20px', minWidth: '500px', maxWidth: '600px' }}>
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

          {backupError && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}>
              {backupError}
            </div>
          )}
          
          <BackupSection>
            <SectionTitle>Manual Backup</SectionTitle>
            <BackupInfo>
              Download or restore your data manually using JSON files.
            </BackupInfo>
            <ButtonGroup>
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
              <FileInputLabel>
                Restore from File
                <FileInput 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                />
              </FileInputLabel>
            </ButtonGroup>
          </BackupSection>

          {isEditMode && (
            <BackupSection>
              <SectionTitle>Google Drive Auto-Backup</SectionTitle>
              {!isAuthenticated ? (
                <>
                  <BackupInfo>
                    Connect to Google Drive to enable automatic backups every 8, 24, or 48 hours.
                    <br />
                    <small style={{ color: '#999' }}>
                      Note: Requires Google API credentials to be configured.
                    </small>
                  </BackupInfo>
                  <Button
                    onClick={authenticate}
                    disabled={!isInitialized}
                    style={{
                      background: '#4285f4',
                      color: 'white',
                      padding: '10px 20px',
                    }}
                  >
                    {!isInitialized ? 'Initializing...' : 'Connect to Google Drive'}
                  </Button>
                </>
              ) : (
                <>
                  <BackupInfo style={{ background: '#e8f5e9', color: '#2e7d32' }}>
                    ✅ Connected to Google Drive
                    <br />
                    Last backup: {formatLastBackupTime()}
                  </BackupInfo>
                  
                  <ConfigRow>
                    <ConfigLabel>
                      <input
                        type="checkbox"
                        checked={autoBackupEnabled}
                        onChange={(e) => setAutoBackup(e.target.checked, autoBackupInterval)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable auto-backup every:
                    </ConfigLabel>
                    <Select
                      value={autoBackupInterval}
                      onChange={(e) => setAutoBackup(autoBackupEnabled, parseInt(e.target.value))}
                      disabled={!autoBackupEnabled}
                    >
                      <option value="8">8 hours</option>
                      <option value="24">24 hours</option>
                      <option value="48">48 hours</option>
                    </Select>
                  </ConfigRow>

                  <ButtonGroup style={{ marginTop: '16px' }}>
                    <Button
                      onClick={createBackup}
                      disabled={isBackingUp}
                      style={{
                        background: 'linear-gradient(135deg, #34a853 0%, #4285f4 100%)',
                        color: 'white',
                        padding: '8px 16px',
                      }}
                    >
                      {isBackingUp ? 'Backing up...' : 'Backup Now'}
                    </Button>
                    <Button
                      onClick={restoreBackup}
                      disabled={isRestoring}
                      style={{
                        background: 'linear-gradient(135deg, #fbbc04 0%, #ea4335 100%)',
                        color: 'white',
                        padding: '8px 16px',
                      }}
                    >
                      {isRestoring ? 'Restoring...' : 'Restore from Drive'}
                    </Button>
                    <Button
                      onClick={signOut}
                      style={{
                        background: '#f5f5f5',
                        color: '#666',
                        padding: '8px 16px',
                      }}
                    >
                      Disconnect
                    </Button>
                  </ButtonGroup>
                </>
              )}
            </BackupSection>
          )}
          
          <BackupSection>
            <SectionTitle>Automatic Local Backups</SectionTitle>
            <BackupInfo>
              The app automatically saves your data and keeps the 5 most recent local backups.
              {isUsingFirebase() && (
                <>
                  <br />
                  Your data is also synced to the cloud in real-time.
                </>
              )}
            </BackupInfo>
          </BackupSection>
        </div>
      </Modal>
    </>
  );
};

// Helper to check if using Firebase
const isUsingFirebase = () => {
  return window.location.hostname.includes('firebaseapp.com') || 
         window.location.hostname.includes('web.app');
};