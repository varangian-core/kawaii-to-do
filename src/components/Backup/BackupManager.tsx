import React, { useEffect, useState } from 'react';
import { useBackupStore, startAutoBackup, stopAutoBackup } from '../../store/backupStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import styled from 'styled-components';

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

export const BackupManager: React.FC = () => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  
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

  // Initialize Google Drive on component mount
  useEffect(() => {
    if (!isInitialized) {
      initializeGoogleDrive();
    }
  }, [isInitialized, initializeGoogleDrive]);

  // Handle auto-backup
  useEffect(() => {
    if (isAuthenticated && autoBackupEnabled) {
      startAutoBackup();
    } else {
      stopAutoBackup();
    }

    return () => stopAutoBackup();
  }, [isAuthenticated, autoBackupEnabled]);

  const handleRestore = async () => {
    setShowRestoreConfirm(false);
    await restoreBackup();
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
        title="Google Drive Backup"
      >
        ☁️
      </ActionButton>

      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Google Drive Backup"
      >
        <div style={{ padding: '20px', minWidth: '400px' }}>
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

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Sign in with Google to backup your tasks to Google Drive
              </p>
              <p style={{ marginBottom: '20px', color: '#999', fontSize: '12px' }}>
                Note: Make sure pop-ups are enabled for this site
              </p>
              <Button
                onClick={authenticate}
                disabled={!isInitialized}
                style={{
                  background: '#4285f4',
                  color: 'white',
                  padding: '12px 24px',
                  fontSize: '16px',
                }}
              >
                {!isInitialized ? 'Initializing...' : 'Sign in with Google'}
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Backup Status</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Last backup: {formatLastBackupTime()}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Manual Backup</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    onClick={createBackup}
                    disabled={isBackingUp}
                    style={{
                      background: 'linear-gradient(135deg, #34a853 0%, #4285f4 100%)',
                      color: 'white',
                      padding: '10px 20px',
                    }}
                  >
                    {isBackingUp ? 'Backing up...' : 'Backup Now'}
                  </Button>
                  <Button
                    onClick={() => setShowRestoreConfirm(true)}
                    disabled={isRestoring}
                    style={{
                      background: 'linear-gradient(135deg, #fbbc04 0%, #ea4335 100%)',
                      color: 'white',
                      padding: '10px 20px',
                    }}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore'}
                  </Button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Auto Backup</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackup(e.target.checked, autoBackupInterval)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px' }}>Enable automatic backup</span>
                  </label>
                </div>
                {autoBackupEnabled && (
                  <div style={{ marginLeft: '24px' }}>
                    <label style={{ fontSize: '14px', color: '#666' }}>
                      Backup every:
                      <select
                        value={autoBackupInterval}
                        onChange={(e) => setAutoBackup(true, parseInt(e.target.value))}
                        style={{
                          marginLeft: '8px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                        }}
                      >
                        <option value="1">1 hour</option>
                        <option value="6">6 hours</option>
                        <option value="12">12 hours</option>
                        <option value="24">24 hours</option>
                        <option value="48">48 hours</option>
                        <option value="168">1 week</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                <Button
                  onClick={signOut}
                  style={{
                    background: '#f5f5f5',
                    color: '#666',
                    padding: '8px 16px',
                    fontSize: '14px',
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        title="Restore Backup"
      >
        <div style={{ padding: '20px', maxWidth: '400px' }}>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Are you sure you want to restore from backup? This will replace all current data with the backed up data.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setShowRestoreConfirm(false)}
              style={{
                background: '#f5f5f5',
                color: '#666',
                padding: '8px 16px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              style={{
                background: 'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)',
                color: 'white',
                padding: '8px 16px',
              }}
            >
              Restore
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};