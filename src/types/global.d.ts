// Google API type declarations

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey: string;
          discoveryDocs: string[];
        }) => Promise<void>;
        setToken: (token: { access_token: string } | null) => void;
        request: (config: {
          path: string;
          method: string;
          params?: Record<string, any>;
          headers?: Record<string, string>;
          body?: any;
        }) => Promise<any>;
        drive: {
          files: {
            list: (params: {
              q?: string;
              spaces?: string;
              fields?: string;
            }) => Promise<{ result: { files?: Array<{ id: string; name: string }> } }>;
            get: (params: {
              fileId: string;
              alt?: string;
            }) => Promise<{ result: any }>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback?: (response: any) => void;
            ux_mode?: 'popup' | 'redirect';
            redirect_uri?: string;
          }) => {
            requestAccessToken: () => void;
            callback: (response: any) => void;
          };
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

export {};