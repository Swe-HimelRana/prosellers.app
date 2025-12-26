const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Get version from package.json
let version = '1.0.0';
try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    version = packageData.version;
} catch (e) {
    console.error('Could not read version:', e);
}

const apps = [
    {
        name: 'Prosellers Web',
        url: 'https://prosellers.pw',
        icon: '🌐',
        description: 'Main Prosellers web application'
    },
    {
        name: 'Prosellers Admin',
        url: 'https://prosellers.pw/admin/',
        icon: '🌐',
        description: 'Main Prosellers web application'
    },
    {
        name: 'Proxy',
        url: 'https://proxy.prosellers.ailab.eu.org',
        icon: '🔒',
        description: 'Proxy service for secure connections'
    },
    {
        name: 'SeoInfo',
        url: 'https://seoinfo.prosellers.ailab.eu.org/admin.php',
        icon: '📊',
        description: 'SEO information and analytics tool'
    },
    {
        name: 'Logs',
        url: 'https://logs.ailab.eu.org/admin.php',
        icon: '📝',
        description: 'System logs and monitoring'
    },
    {
        name: 'DB Access',
        url: 'https://dbaccess.prosellers.ailab.eu.org',
        icon: '🗄️',
        description: 'Database access and management tool'
    },
    {
        name: 'Notes',
        url: 'notes://app',
        icon: '📝',
        description: 'Take and manage notes'
    }
];

// Display version info
function displayVersion() {
    const versionElement = document.getElementById('versionInfo');
    if (versionElement) {
        versionElement.textContent = `Version ${version}`;
    }
}

function createAppCard(app) {
    const card = document.createElement('a');
    card.href = '#';
    card.className = 'app-card';
    card.addEventListener('click', (e) => {
        e.preventDefault();
        // Check if this is DB Access or Notes - open in separate window
        if (app.url.includes('dbaccess.prosellers.ailab.eu.org') || app.url.startsWith('notes://')) {
            if (app.url.startsWith('notes://')) {
                ipcRenderer.send('open-notes-window');
            } else {
                ipcRenderer.send('open-external-window', app.url);
            }
        } else {
            // Navigate to URL within the app
            ipcRenderer.send('navigate-to-url', app.url);
        }
    });

    card.innerHTML = `
        <div class="app-icon">${app.icon}</div>
        <div class="app-name">${app.name}</div>
        <div class="app-url">${app.url}</div>
        <div class="app-description">${app.description}</div>
    `;

    return card;
}

function loadApps() {
    const grid = document.getElementById('appsGrid');
    if (grid) {
        apps.forEach(app => {
            const card = createAppCard(app);
            grid.appendChild(card);
        });
    }
    displayVersion();
}

// Update notification handling
function showUpdateNotification(status, message, version = null, progress = null) {
    const notification = document.getElementById('updateNotification');
    if (!notification) return;
    
    // Remove all status classes
    notification.className = 'update-notification';
    notification.classList.add(status);
    notification.classList.add('show');
    
    let content = message;
    
    if (progress !== null) {
        content = `${message}<div class="update-progress">Downloading: ${progress.percent}%</div>`;
    }
    
    if (status === 'downloaded') {
        content += '<br><button class="update-action-btn" id="restartBtn">Restart Now</button>';
    }
    
    notification.innerHTML = content;
    
    // Add restart button handler if it exists
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            ipcRenderer.send('restart-and-install');
        });
    }
}

// Listen for update status from main process
ipcRenderer.on('update-status', (event, data) => {
    showUpdateNotification(data.status, data.message, data.version);
});

// Listen for update progress
ipcRenderer.on('update-progress', (event, progress) => {
    showUpdateNotification('downloading', 'Downloading update...', null, progress);
});

// Update check button handler
function setupUpdateCheck() {
    const updateCheckBtn = document.getElementById('updateCheckBtn');
    if (updateCheckBtn) {
        updateCheckBtn.addEventListener('click', () => {
            ipcRenderer.send('check-for-updates');
            showUpdateNotification('checking', 'Checking for updates...');
        });
    }
}

// Settings button handler
function setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            ipcRenderer.send('navigate-to-settings');
        });
    }
}

// Load apps when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadApps();
        setupUpdateCheck();
        setupSettings();
    });
} else {
    loadApps();
    setupUpdateCheck();
    setupSettings();
}

