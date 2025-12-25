# Prosellers App

A beautiful Electron.js application launcher for Prosellers services.

## Features

- Modern, card-based UI design
- Quick access to all Prosellers services
- Cross-platform support (macOS and Windows)
- Smooth animations and hover effects

## Apps Included

1. **Prosellers Web** - https://prosellers.pw
2. **Proxy** - https://proxy.prosellers.ailab.eu.org
3. **SeoInfo** - https://seoinfo.prosellers.ailab.eu.org
4. **Logs** - https://logs.ailab.eu.org

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

### Build for macOS

```bash
npm run build:mac
```

This will create a `.dmg` file in the `dist` folder.

### Build for Windows

```bash
npm run build:win
```

This will create a `.exe` installer in the `dist` folder.

### Build for both platforms

```bash
npm run build:all
```

## Build Output

All built executables will be in the `dist` directory:
- macOS: `.dmg` and `.zip` files
- Windows: `.exe` installer and portable version

## Notes

- The app opens external links in your default browser
- Icons are emoji-based for simplicity (you can replace with custom icons later)
- The app window is resizable with minimum dimensions of 800x600

## Customization

To add custom icons:
1. Create an `assets` folder
2. Add `icon.icns` for macOS and `icon.ico` for Windows
3. The build process will automatically use these icons

