export interface ElectronAPI {
  resizeWindow: (size: 'wizard' | 'dashboard') => Promise<void>;
  toggleDevTools: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
