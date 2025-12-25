const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let currentUrl = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle navigation to URLs within the app
  ipcMain.on('navigate-to-url', (event, url) => {
    if (mainWindow) {
      currentUrl = url;
      mainWindow.loadFile('navigation.html');
    }
  });

  // Handle request for current URL from navigation page
  ipcMain.on('get-current-url', (event) => {
    event.returnValue = currentUrl;
  });

  // Handle navigation back to home
  ipcMain.on('navigate-home', () => {
    if (mainWindow) {
      currentUrl = null;
      mainWindow.loadFile('index.html');
    }
  });

  // Prevent new windows from opening - keep everything in the same window
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

