# Prosellers App

A beautiful Electron.js application launcher for Prosellers services.

## Features

- Modern, card-based UI design
- Quick access to all Prosellers services
- Cross-platform support (macOS and Windows)
- Smooth animations and hover effects
- **Auto-update functionality** - Automatically checks for and installs updates from GitHub releases
- In-app navigation - All URLs open within the app window
- Loading animations for better user experience

## Apps Included

1. **Prosellers Web** - https://prosellers.pw
2. **Proxy** - https://proxy.prosellers.ailab.eu.org
3. **SeoInfo** - https://seoinfo.prosellers.ailab.eu.org
4. **Logs** - https://logs.ailab.eu.org
5. **DB Access** - https://dbaccess.prosellers.ailab.eu.org/

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Run the app

```bash
npm start
```

## Building Executables

### Prerequisites for Auto-Update

Before building, you need to set up a GitHub Personal Access Token for publishing releases:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Create a new token with `repo` scope
3. Set the `GH_TOKEN` environment variable:
   ```bash
   export GH_TOKEN=your_github_token_here
   ```

### Build for macOS

```bash
npm run build:mac
```

This will create a `.dmg` file in the `dist` folder and publish it to GitHub releases (if `GH_TOKEN` is set).

### Build for Windows

```bash
npm run build:win
```

This will create a `.exe` installer in the `dist` folder and publish it to GitHub releases (if `GH_TOKEN` is set).

### Build for both platforms

```bash
npm run build:all
```

### Publishing to GitHub Releases

To publish releases to GitHub (required for auto-updates):

```bash
# Set your GitHub token
export GH_TOKEN=your_github_token_here

# Build and publish
npm run build:all -- --publish always
```

Or use the `--publish` flag with specific values:
- `--publish always` - Always publish
- `--publish onTag` - Publish only on git tag
- `--publish never` - Never publish (default)

## Build Output

All built executables will be in the `dist` directory:
- macOS: `.dmg` and `.zip` files
- Windows: `.exe` installer and portable version

## Auto-Update Feature

The app includes automatic update functionality:

- **Automatic checking**: The app checks for updates 3 seconds after launch
- **Manual checking**: Click the refresh button (🔄) next to the version info
- **Update notifications**: Users are notified when updates are available
- **Automatic download**: Updates are downloaded automatically in the background
- **Restart to install**: Users can restart the app to install updates

### How Auto-Update Works

1. The app checks GitHub releases for new versions
2. If a newer version is found, it downloads automatically
3. Users are notified and can choose to restart immediately or later
4. Updates are installed when the app restarts

### Version Management

- Update the `version` field in `package.json` before building
- Create a git tag matching the version (e.g., `v1.0.1`)
- Build and publish to GitHub releases
- The app will automatically detect and download the new version

## Notes

- URLs open inside the app window (not in external browser)
- Icons are emoji-based for simplicity (you can replace with custom icons later)
- The app window is resizable with minimum dimensions of 800x600
- Auto-update only works in production builds (packaged apps), not in development mode

## Customization

To add custom icons:
1. Create an `assets` folder
2. Add `icon.icns` for macOS and `icon.ico` for Windows
3. The build process will automatically use these icons

