import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Window sizes
const WIZARD_SIZE = { width: 700, height: 750 };
const DASHBOARD_SIZE = { width: 1200, height: 800 };

const createWindow = () => {
  // Start with wizard size - resizable only after setup completes
  mainWindow = new BrowserWindow({
    width: WIZARD_SIZE.width,
    height: WIZARD_SIZE.height,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open DevTools in development only
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

// IPC handler to resize window after setup completes
ipcMain.handle('resize-window', (_event, size: 'wizard' | 'dashboard') => {
  if (!mainWindow) return;
  
  const targetSize = size === 'wizard' ? WIZARD_SIZE : DASHBOARD_SIZE;
  mainWindow.setSize(targetSize.width, targetSize.height, true);
  mainWindow.center();
  
  // Only allow resizing in dashboard mode
  mainWindow.setResizable(size === 'dashboard');
});

// IPC handler to toggle DevTools (development only)
ipcMain.handle('toggle-devtools', () => {
  if (!mainWindow) return;
  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.warn('DevTools only available in development mode');
    return;
  }
  mainWindow.webContents.toggleDevTools();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  createWindow();
  
  // Register global shortcut for DevTools (development only)
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (mainWindow) {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Unregister shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
