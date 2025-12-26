# Building and Publishing Guide

## Building Executables

### Build Without Publishing

```bash
# Build for macOS only
npm run build:mac

# Build for Windows only  
npm run build:win

# Build for both platforms
npm run build:all
```

Builds will be in the `dist/` folder.

## Manual Publishing to GitHub Releases

### Method 1: Using GitHub Web Interface

1. **Build the executables:**
   ```bash
   npm run build:all
   ```

2. **Go to GitHub Releases:**
   - Visit: https://github.com/Swe-HimelRana/prosellers.app/releases
   - Click "Draft a new release"

3. **Create Release:**
   - **Tag version:** `v1.0.0` (must match version in package.json)
   - **Release title:** `v1.0.0` or `Release 1.0.0`
   - **Description:** Add release notes
   - **Attach files:** Upload all files from `dist/` folder:
     - `Prosellers App-1.0.0.dmg` (macOS installer)
     - `Prosellers App-1.0.0-mac.zip` (macOS zip)
     - `Prosellers App Setup 1.0.0.exe` (Windows installer)
     - `Prosellers App 1.0.0.exe` (Windows portable)

4. **Publish:** Click "Publish release"

### Method 2: Using GitHub CLI (gh)

If you have GitHub CLI installed:

```bash
# Build first
npm run build:all

# Create release
gh release create v1.0.0 \
  --title "v1.0.0" \
  --notes "Release notes here" \
  dist/*.dmg \
  dist/*.zip \
  dist/*.exe
```

### Method 3: Using Git Tags

1. **Update version in package.json** (if needed)
2. **Create and push a git tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. **Build with publish flag:**
   ```bash
   export GH_TOKEN=your_github_token
   npm run build:all -- --publish always
   ```

## Version Management

Before building a new release:

1. **Update version in `package.json`:**
   ```json
   "version": "1.0.1"
   ```

2. **Create git tag:**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. **Build and publish:**
   ```bash
   npm run build:all
   # Then manually upload to GitHub releases
   ```

## Build Output Files

After building, you'll find these files in `dist/`:

**macOS:**
- `Prosellers App-1.0.0.dmg` - Installer disk image
- `Prosellers App-1.0.0-mac.zip` - Zip archive

**Windows:**
- `Prosellers App Setup 1.0.0.exe` - NSIS installer
- `Prosellers App 1.0.0.exe` - Portable executable

## Notes

- The app will automatically check for updates from GitHub releases
- Make sure the version in package.json matches the release tag
- For auto-updates to work, releases must be published on GitHub
- Users need to have at least one version installed for auto-update to work

