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
        name: 'Proxy',
        url: 'https://proxy.prosellers.ailab.eu.org',
        icon: '🔒',
        description: 'Proxy service for secure connections'
    },
    {
        name: 'SeoInfo',
        url: 'https://seoinfo.prosellers.ailab.eu.org',
        icon: '📊',
        description: 'SEO information and analytics tool'
    },
    {
        name: 'Logs',
        url: 'https://logs.ailab.eu.org',
        icon: '📝',
        description: 'System logs and monitoring'
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
        // Navigate to URL within the app
        ipcRenderer.send('navigate-to-url', app.url);
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

// Load apps when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadApps);
} else {
    loadApps();
}

