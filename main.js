const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let mainWindow;
let currentUrl = null;
let pinVerified = false; // Session-based PIN verification
let notesWindow = null; // Notes popup window
let notesDb = null; // SQLite database instance
let SQL = null; // SQL.js instance

// PIN storage file path
const pinStoragePath = path.join(app.getPath('userData'), 'pin-settings.json');

// Notes database setup
const notesDbPath = path.join(app.getPath('userData'), 'notes.db');

async function initNotesDatabase() {
  try {
    // Initialize SQL.js
    if (!SQL) {
      SQL = await initSqlJs();
    }
    
    // Load existing database or create new one
    let dbData = null;
    if (fs.existsSync(notesDbPath)) {
      dbData = fs.readFileSync(notesDbPath);
    }
    
    notesDb = new SQL.Database(dbData);
    
    // Create notes table if it doesn't exist
    notesDb.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        created_at DATETIME DEFAULT (datetime('now')),
        updated_at DATETIME DEFAULT (datetime('now'))
      )
    `);
    
    // Create index for faster searches
    notesDb.run(`
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)
    `);
    
    // Save database to file
    saveNotesDatabase();
    
    console.log('Notes database initialized');
  } catch (error) {
    console.error('Error initializing notes database:', error);
    notesDb = null;
  }
}

function saveNotesDatabase() {
  if (notesDb) {
    try {
      const data = notesDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(notesDbPath, buffer);
    } catch (error) {
      console.error('Error saving notes database:', error);
    }
  }
}

// Load PIN settings
function loadPinSettings() {
  try {
    if (fs.existsSync(pinStoragePath)) {
      return JSON.parse(fs.readFileSync(pinStoragePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading PIN settings:', e);
  }
  return { enabled: false, pin: null };
}

// Save PIN settings
function savePinSettings(settings) {
  try {
    fs.writeFileSync(pinStoragePath, JSON.stringify(settings, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving PIN settings:', e);
    return false;
  }
}


// Try to load electron-updater (may not be available in dev mode)
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  // Configure auto-updater
  if (autoUpdater && typeof autoUpdater.setAutoDownload === 'function') {
    autoUpdater.setAutoDownload(true);
    autoUpdater.setAutoInstallOnAppQuit(true);
  }
} catch (error) {
  console.warn('electron-updater not available:', error.message);
  autoUpdater = null;
}

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
    backgroundColor: '#202020',
    titleBarStyle: 'default',
    show: false
  });

  // Check if PIN protection is enabled (only on app startup)
  const pinSettings = loadPinSettings();
  if (pinSettings.enabled && pinSettings.pin && !pinVerified) {
    mainWindow.loadFile('pin-entry.html');
  } else {
    mainWindow.loadFile('index.html');
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle navigation to URLs within the app
  ipcMain.on('navigate-to-url', (event, url) => {
    if (mainWindow) {
      currentUrl = url;
      mainWindow.loadFile('navigation.html');
      
      // Set up error handling for the navigation page
      mainWindow.webContents.once('did-finish-load', () => {
        // Listen for failed navigation attempts
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
          if (isMainFrame && (errorCode === -3 || errorCode === -20 || errorDescription.includes('BLOCKED_BY_RESPONSE'))) {
            // ERR_BLOCKED_BY_RESPONSE or similar - send error to renderer
            mainWindow.webContents.send('iframe-error');
          }
        });
      });
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
      // Only check PIN if it's enabled and not yet verified in this session
      const pinSettings = loadPinSettings();
      if (pinSettings.enabled && pinSettings.pin && !pinVerified) {
        mainWindow.loadFile('pin-entry.html');
      } else {
        mainWindow.loadFile('index.html');
      }
    }
  });

  // Handle navigation to settings
  ipcMain.on('navigate-to-settings', () => {
    if (mainWindow) {
      mainWindow.loadFile('settings.html');
    }
  });

  // Handle app restart
  ipcMain.on('restart-app', () => {
    // Reset PIN verification session
    pinVerified = false;
    // Reload the app
    app.relaunch();
    app.exit(0);
  });

  // PIN management handlers
  ipcMain.on('get-pin-settings', (event) => {
    const settings = loadPinSettings();
    event.reply('pin-settings', settings);
  });

  ipcMain.on('set-pin-enabled', (event, enabled) => {
    const settings = loadPinSettings();
    settings.enabled = enabled;
    if (!enabled) {
      settings.pin = null;
    }
    savePinSettings(settings);
  });

  ipcMain.on('set-pin', (event, pin) => {
    const settings = loadPinSettings();
    settings.enabled = true;
    settings.pin = pin;
    savePinSettings(settings);
  });

  ipcMain.on('verify-pin', (event, pin) => {
    const settings = loadPinSettings();
    const isValid = settings.enabled && settings.pin === pin;
    event.reply('pin-verified', isValid);
    
    if (isValid) {
      // PIN verified, set session flag and load main page
      pinVerified = true;
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadFile('index.html');
        }
      }, 100);
    }
  });

  // Handle opening URL in external window (for DB Access)
  ipcMain.on('open-external-window', (event, url) => {
    const externalWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false
      },
      backgroundColor: '#ffffff',
      title: 'DB Access',
      show: false
    });

    // Remove X-Frame-Options for this window too
    externalWindow.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
      if (details.responseHeaders) {
        delete details.responseHeaders['x-frame-options'];
        delete details.responseHeaders['X-Frame-Options'];
        if (details.responseHeaders['content-security-policy']) {
          const cspHeaders = details.responseHeaders['content-security-policy'];
          if (Array.isArray(cspHeaders)) {
            details.responseHeaders['content-security-policy'] = cspHeaders.map(header => {
              return header.replace(/frame-ancestors[^;]*;?/gi, '').trim();
            });
          }
        }
        if (details.responseHeaders['Content-Security-Policy']) {
          const cspHeaders = details.responseHeaders['Content-Security-Policy'];
          if (Array.isArray(cspHeaders)) {
            details.responseHeaders['Content-Security-Policy'] = cspHeaders.map(header => {
              return header.replace(/frame-ancestors[^;]*;?/gi, '').trim();
            });
          }
        }
      }
      callback({ responseHeaders: details.responseHeaders });
    });

    externalWindow.loadURL(url);

    externalWindow.once('ready-to-show', () => {
      externalWindow.show();
    });

    // Clean up when window is closed
    externalWindow.on('closed', () => {
      // Window is closed, no cleanup needed
    });
  });

  // Handle opening Notes window
  ipcMain.on('open-notes-window', () => {
    if (notesWindow) {
      notesWindow.focus();
      return;
    }

    notesWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      },
      backgroundColor: '#202020',
      title: 'Notes',
      show: false
    });

    notesWindow.loadFile('notes.html');

    notesWindow.once('ready-to-show', () => {
      notesWindow.show();
    });

    notesWindow.on('closed', () => {
      notesWindow = null;
    });
  });

  // Notes database operations
  ipcMain.on('get-all-notes', async (event) => {
    try {
      if (!notesDb) {
        await initNotesDatabase();
        if (!notesDb) {
          event.reply('all-notes', []);
          return;
        }
      }
      const result = notesDb.exec('SELECT * FROM notes ORDER BY updated_at DESC');
      if (result.length > 0) {
        const notes = result[0].values.map(row => ({
          id: row[0],
          title: row[1],
          content: row[2],
          created_at: row[3],
          updated_at: row[4]
        }));
        event.reply('all-notes', notes);
      } else {
        event.reply('all-notes', []);
      }
    } catch (error) {
      console.error('Error getting all notes:', error);
      event.reply('all-notes', []);
    }
  });

  ipcMain.on('get-note', async (event, noteId) => {
    try {
      if (!notesDb) {
        await initNotesDatabase();
        if (!notesDb) {
          event.reply('note-loaded', null);
          return;
        }
      }
      const stmt = notesDb.prepare('SELECT * FROM notes WHERE id = ?');
      stmt.bind([noteId]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        event.reply('note-loaded', {
          id: row.id,
          title: row.title,
          content: row.content,
          created_at: row.created_at,
          updated_at: row.updated_at
        });
      } else {
        event.reply('note-loaded', null);
      }
      stmt.free();
    } catch (error) {
      console.error('Error getting note:', error);
      event.reply('note-loaded', null);
    }
  });

  ipcMain.on('create-note', async (event, title, content) => {
    try {
      if (!notesDb) {
        await initNotesDatabase();
        if (!notesDb) {
          console.error('Database not available');
          return;
        }
      }
      const stmt = notesDb.prepare('INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))');
      stmt.run([title, content]);
      stmt.free();
      
      // Get the inserted note
      const selectStmt = notesDb.prepare('SELECT * FROM notes WHERE id = last_insert_rowid()');
      selectStmt.step();
      const newNote = selectStmt.getAsObject();
      selectStmt.free();
      
      saveNotesDatabase();
      event.reply('note-saved', {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        created_at: newNote.created_at,
        updated_at: newNote.updated_at
      });
    } catch (error) {
      console.error('Error creating note:', error);
    }
  });

  ipcMain.on('update-note', async (event, noteId, title, content) => {
    try {
      if (!notesDb) {
        await initNotesDatabase();
        if (!notesDb) {
          console.error('Database not available');
          return;
        }
      }
      const stmt = notesDb.prepare('UPDATE notes SET title = ?, content = ?, updated_at = datetime("now") WHERE id = ?');
      stmt.run([title, content, noteId]);
      stmt.free();
      
      // Get the updated note
      const selectStmt = notesDb.prepare('SELECT * FROM notes WHERE id = ?');
      selectStmt.bind([noteId]);
      selectStmt.step();
      const updatedNote = selectStmt.getAsObject();
      selectStmt.free();
      
      saveNotesDatabase();
      event.reply('note-saved', {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        created_at: updatedNote.created_at,
        updated_at: updatedNote.updated_at
      });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  });

  ipcMain.on('delete-note', async (event, noteId) => {
    try {
      if (!notesDb) {
        await initNotesDatabase();
        if (!notesDb) {
          console.error('Database not available');
          return;
        }
      }
      const stmt = notesDb.prepare('DELETE FROM notes WHERE id = ?');
      stmt.run([noteId]);
      stmt.free();
      saveNotesDatabase();
      event.reply('note-deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  });

  // Prevent new windows from opening - keep everything in the same window
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
  
  // Listen for console errors to detect blocked iframes (using new API)
  mainWindow.webContents.on('console-message', (event) => {
    const { level, message } = event;
    if (message && (message.includes('X-Frame-Options') || 
        message.includes('ERR_BLOCKED_BY_RESPONSE') || 
        message.includes('Refused to display') ||
        message.includes('blocked'))) {
      // Send error to renderer
      mainWindow.webContents.send('iframe-error');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Initialize notes database
  await initNotesDatabase();
  
  // Set up session to remove X-Frame-Options headers
  const filter = {
    urls: ['*://*/*']
  };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    // Remove X-Frame-Options and Content-Security-Policy frame-ancestors
    if (details.responseHeaders) {
      delete details.responseHeaders['x-frame-options'];
      delete details.responseHeaders['X-Frame-Options'];
      
      // Remove frame-ancestors from Content-Security-Policy
      if (details.responseHeaders['content-security-policy']) {
        const cspHeaders = details.responseHeaders['content-security-policy'];
        if (Array.isArray(cspHeaders)) {
          details.responseHeaders['content-security-policy'] = cspHeaders.map(header => {
            return header.replace(/frame-ancestors[^;]*;?/gi, '').trim();
          });
        }
      }
      if (details.responseHeaders['Content-Security-Policy']) {
        const cspHeaders = details.responseHeaders['Content-Security-Policy'];
        if (Array.isArray(cspHeaders)) {
          details.responseHeaders['Content-Security-Policy'] = cspHeaders.map(header => {
            return header.replace(/frame-ancestors[^;]*;?/gi, '').trim();
          });
        }
      }
    }
    
    callback({ responseHeaders: details.responseHeaders });
  });

  createWindow();
  
  // Check for updates after a short delay
  setTimeout(() => {
    if (!app.isPackaged || !autoUpdater) {
      console.log('Running in development mode or electron-updater not available, skipping auto-update check');
    } else {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Auto-updater event handlers
if (autoUpdater) {
autoUpdater.on('checking-for-update', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking', message: 'Checking for updates...' });
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'available', 
      message: `Update available: ${info.version}`,
      version: info.version
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'not-available', 
      message: 'You are using the latest version'
    });
  }
});

autoUpdater.on('error', (err) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'error', 
      message: `Update error: ${err.message}`
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloaded', 
      message: 'Update downloaded. Restart to install.',
      version: info.version
    });
    
    // Show dialog to user
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully',
      detail: 'The application will be updated on restart. Would you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  }
});
} // End of autoUpdater check

// IPC handlers for update actions
ipcMain.on('check-for-updates', () => {
  if (!app.isPackaged || !autoUpdater) {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { 
        status: 'error', 
        message: 'Update check is only available in production builds'
      });
    }
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

ipcMain.on('restart-and-install', () => {
  if (autoUpdater) {
    autoUpdater.quitAndInstall(false, true);
  }
});

app.on('window-all-closed', () => {
  // Reset PIN verification session when app closes
  pinVerified = false;
  // Close database connection
  if (notesDb) {
    notesDb.close();
    notesDb = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Close database connection on app quit
  if (notesDb) {
    notesDb.close();
    notesDb = null;
  }
});

