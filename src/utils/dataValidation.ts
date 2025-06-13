// Data validation utilities to prevent data loss

export interface BoardData {
  tasks: Record<string, any>;
  columns: Record<string, any>;
  columnOrder: string[];
}

export interface UserData {
  users: Record<string, any>;
  currentUserId: string | null;
}

// Validate that board data has actual content
export function isValidBoardData(data: any): data is BoardData {
  if (!data || typeof data !== 'object') return false;
  
  // Check if required properties exist
  if (!data.tasks || !data.columns || !Array.isArray(data.columnOrder)) {
    return false;
  }
  
  // Check if there's actual content (not just empty objects)
  const hasContent = 
    Object.keys(data.tasks).length > 0 || 
    Object.keys(data.columns).length > 0 ||
    data.columnOrder.length > 0;
    
  return hasContent;
}

// Check if incoming data would cause data loss
export function wouldCauseDataLoss(currentData: BoardData, newData: any): boolean {
  // If current data has content but new data is empty, it would cause data loss
  const currentHasContent = isValidBoardData(currentData);
  const newHasContent = isValidBoardData(newData);
  
  if (currentHasContent && !newHasContent) {
    console.warn('Warning: Attempted to overwrite existing data with empty data');
    return true;
  }
  
  // Check for significant data reduction (more than 90% loss)
  if (currentHasContent && newHasContent) {
    const currentTaskCount = Object.keys(currentData.tasks).length;
    const newTaskCount = Object.keys(newData.tasks).length;
    
    if (currentTaskCount > 10 && newTaskCount < currentTaskCount * 0.1) {
      console.warn('Warning: Significant data reduction detected', {
        current: currentTaskCount,
        new: newTaskCount
      });
      return true;
    }
  }
  
  return false;
}

// Create a backup key with timestamp
export function createBackupKey(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-backup-${timestamp}`;
}

// Validate user data
export function isValidUserData(data: any): data is UserData {
  if (!data || typeof data !== 'object') return false;
  return data.users && typeof data.users === 'object';
}