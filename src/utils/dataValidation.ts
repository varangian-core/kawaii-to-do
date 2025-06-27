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

// Very permissive validation - only check basic structure
export function isValidBoardData(data: any): data is BoardData {
  // Only reject null/undefined
  if (data === null || data === undefined) {
    console.log('[Validation] Data is null or undefined');
    return false;
  }
  
  // Must be an object
  if (typeof data !== 'object') {
    console.log('[Validation] Data is not an object');
    return false;
  }
  
  // Must have the three required properties (but they can be empty)
  if (!('tasks' in data) || !('columns' in data) || !('columnOrder' in data)) {
    console.log('[Validation] Missing required properties');
    return false;
  }
  
  // Very loose type checking - just ensure they're the right type
  if (data.tasks !== null && typeof data.tasks !== 'object') {
    console.log('[Validation] tasks is not an object');
    return false;
  }
  
  if (data.columns !== null && typeof data.columns !== 'object') {
    console.log('[Validation] columns is not an object');
    return false;
  }
  
  if (data.columnOrder !== null && !Array.isArray(data.columnOrder)) {
    console.log('[Validation] columnOrder is not an array');
    return false;
  }
  
  // All good - very permissive
  return true;
}

// Only prevent data loss from null/undefined responses
export function wouldCauseDataLoss(currentData: BoardData, newData: any): boolean {
  // If Firebase returns null/undefined, that would cause data loss
  if (newData === null || newData === undefined) {
    console.warn('[Validation] Blocking null/undefined data that would erase existing data');
    return true;
  }
  
  // If the new data is not a valid structure at all
  if (!isValidBoardData(newData)) {
    console.warn('[Validation] Blocking invalid data structure');
    return true;
  }
  
  const currentTaskCount = Object.keys(currentData.tasks || {}).length;
  const currentColumnCount = Object.keys(currentData.columns || {}).length;
  
  // Only block if we have existing data and Firebase returns completely empty structure
  if (currentTaskCount > 0 && currentColumnCount > 0) {
    const newTaskCount = Object.keys(newData.tasks || {}).length;
    const newColumnCount = Object.keys(newData.columns || {}).length;
    
    // Block only if BOTH tasks AND columns would be wiped
    if (newTaskCount === 0 && newColumnCount === 0) {
      console.warn('[Validation] Blocking update that would wipe all tasks and columns');
      return true;
    }
  }
  
  // Otherwise allow the update - be very permissive
  return false;
}

// Create a backup key with timestamp
export function createBackupKey(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-backup-${timestamp}`;
}

// Very permissive user data validation
export function isValidUserData(data: any): data is UserData {
  // Only reject null/undefined
  if (data === null || data === undefined) return false;
  
  // Must be an object
  if (typeof data !== 'object') return false;
  
  // Must have users property (can be empty)
  if (!('users' in data)) return false;
  
  // Users must be an object if present
  if (data.users !== null && typeof data.users !== 'object') return false;
  
  return true;
}