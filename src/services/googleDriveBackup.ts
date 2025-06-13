// Google Drive backup service for Kawaii To-Do

import { BoardData, UserData } from '../utils/dataValidation';

// Google API configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Backup file names
const BOARD_BACKUP_FILENAME = 'kawaii-todo-board-backup.json';
const USER_BACKUP_FILENAME = 'kawaii-todo-users-backup.json';
const CONFIG_BACKUP_FILENAME = 'kawaii-todo-config-backup.json';

export interface BackupConfig {
  autoDeleteHours: number;
  theme?: string;
  [key: string]: any;
}

export interface BackupMetadata {
  version: string;
  timestamp: string;
  deviceInfo: string;
}

class GoogleDriveBackupService {
  private tokenClient: any;
  private accessToken: string | null = null;

  // Initialize Google API
  async init(): Promise<void> {
    // Check if credentials are configured
    if (!CLIENT_ID || !API_KEY) {
      throw new Error('Google API credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in your .env file');
    }

    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.gapi && window.google) {
        resolve();
        return;
      }

      // Load the Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            });

            // Load Google Identity Services
            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.onload = () => {
              this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                  this.accessToken = response.access_token;
                },
                ux_mode: 'popup',
                redirect_uri: window.location.origin,
              });
              resolve();
            };
            document.body.appendChild(gisScript);
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Request access token
  async requestAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google Identity Services not initialized'));
        return;
      }

      // Configure callback
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }
        this.accessToken = response.access_token;
        window.gapi.client.setToken({ access_token: this.accessToken! });
        resolve();
      };

      // Request token with prompt to ensure popup
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Create or update a file in Google Drive
  private async saveFile(fileName: string, content: any): Promise<string> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    const boundary = '-------314159265358979323846';
    const delimiter = "\\r\\n--" + boundary + "\\r\\n";
    const close_delim = "\\r\\n--" + boundary + "--";

    // Check if file already exists
    const searchResponse = await window.gapi.client.drive.files.list({
      q: `name='${fileName}' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    });

    const existingFile = searchResponse.result.files?.[0];

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\\r\\n\\r\\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\\r\\n\\r\\n' +
      JSON.stringify(content, null, 2) +
      close_delim;

    const request = window.gapi.client.request({
      path: existingFile 
        ? `/upload/drive/v3/files/${existingFile.id}`
        : '/upload/drive/v3/files',
      method: existingFile ? 'PATCH' : 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });

    const response = await request;
    return response.result.id;
  }

  // Load a file from Google Drive
  private async loadFile(fileName: string): Promise<any | null> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google Drive');
    }

    try {
      // Search for the file
      const searchResponse = await window.gapi.client.drive.files.list({
        q: `name='${fileName}' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)',
      });

      const file = searchResponse.result.files?.[0];
      if (!file) {
        return null;
      }

      // Download file content
      const response = await window.gapi.client.drive.files.get({
        fileId: file.id,
        alt: 'media',
      });

      return response.result;
    } catch (error) {
      console.error(`Error loading ${fileName} from Google Drive:`, error);
      return null;
    }
  }

  // Backup board data
  async backupBoardData(data: BoardData): Promise<void> {
    const backup = {
      data,
      metadata: this.createMetadata(),
    };
    await this.saveFile(BOARD_BACKUP_FILENAME, backup);
  }

  // Backup user data
  async backupUserData(data: UserData): Promise<void> {
    const backup = {
      data,
      metadata: this.createMetadata(),
    };
    await this.saveFile(USER_BACKUP_FILENAME, backup);
  }

  // Backup configuration
  async backupConfig(config: BackupConfig): Promise<void> {
    const backup = {
      data: config,
      metadata: this.createMetadata(),
    };
    await this.saveFile(CONFIG_BACKUP_FILENAME, backup);
  }

  // Restore board data
  async restoreBoardData(): Promise<BoardData | null> {
    const backup = await this.loadFile(BOARD_BACKUP_FILENAME);
    return backup?.data || null;
  }

  // Restore user data
  async restoreUserData(): Promise<UserData | null> {
    const backup = await this.loadFile(USER_BACKUP_FILENAME);
    return backup?.data || null;
  }

  // Restore configuration
  async restoreConfig(): Promise<BackupConfig | null> {
    const backup = await this.loadFile(CONFIG_BACKUP_FILENAME);
    return backup?.data || null;
  }

  // Create full backup
  async createFullBackup(
    boardData: BoardData,
    userData: UserData,
    config: BackupConfig
  ): Promise<void> {
    await Promise.all([
      this.backupBoardData(boardData),
      this.backupUserData(userData),
      this.backupConfig(config),
    ]);
  }

  // Restore full backup
  async restoreFullBackup(): Promise<{
    boardData: BoardData | null;
    userData: UserData | null;
    config: BackupConfig | null;
  }> {
    const [boardData, userData, config] = await Promise.all([
      this.restoreBoardData(),
      this.restoreUserData(),
      this.restoreConfig(),
    ]);

    return { boardData, userData, config };
  }

  // Get backup info
  async getBackupInfo(): Promise<{
    board: BackupMetadata | null;
    users: BackupMetadata | null;
    config: BackupMetadata | null;
  } | null> {
    try {
      const [boardBackup, userBackup, configBackup] = await Promise.all([
        this.loadFile(BOARD_BACKUP_FILENAME),
        this.loadFile(USER_BACKUP_FILENAME),
        this.loadFile(CONFIG_BACKUP_FILENAME),
      ]);

      return {
        board: boardBackup?.metadata || null,
        users: userBackup?.metadata || null,
        config: configBackup?.metadata || null,
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      return null;
    }
  }

  // Create metadata for backup
  private createMetadata(): BackupMetadata {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      deviceInfo: navigator.userAgent,
    };
  }

  // Sign out
  signOut(): void {
    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        this.accessToken = null;
        window.gapi.client.setToken(null);
      });
    }
  }
}

// Export singleton instance
export const googleDriveBackup = new GoogleDriveBackupService();

