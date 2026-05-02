import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (size: 'wizard' | 'dashboard') => ipcRenderer.invoke('resize-window', size),
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),
});

export type ElectronAPI = typeof window.electronAPI;
