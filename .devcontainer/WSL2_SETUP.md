# WSL2 Setup Guide for Dev Containers

This guide will help you set up WSL2 with Docker Desktop to resolve the TTY error when using dev containers in Zed on Windows.

## Prerequisites

- Windows 10 version 2004+ (Build 19041+) or Windows 11
- Administrator access to your computer

## Step 1: Enable WSL2

Open PowerShell as Administrator and run:

```powershell
# Enable WSL
wsl --install

# Or if WSL is already installed, update to WSL2
wsl --set-default-version 2
```

Restart your computer if prompted.

## Step 2: Install a Linux Distribution

Install Ubuntu (recommended) from Microsoft Store, or via PowerShell:

```powershell
wsl --install -d Ubuntu-22.04
```

Launch Ubuntu and complete the initial setup (create username and password).

## Step 3: Configure Docker Desktop for WSL2

1. **Install Docker Desktop for Windows** (if not already installed)
   - Download from: https://www.docker.com/products/docker-desktop

2. **Enable WSL2 Backend in Docker Desktop**
   - Open Docker Desktop
   - Go to: Settings → General
   - Check: "Use the WSL 2 based engine"
   - Click "Apply & Restart"

3. **Enable WSL Integration**
   - Go to: Settings → Resources → WSL Integration
   - Check: "Enable integration with my default WSL distro"
   - Enable integration for your Ubuntu distribution
   - Click "Apply & Restart"

## Step 4: Move Your Project to WSL2 Filesystem

This is **critical** for performance and TTY compatibility!

### Option A: Clone Repository in WSL2 (Recommended)

1. Open Ubuntu terminal (from Windows Start Menu)

2. Navigate to your home directory:
   ```bash
   cd ~
   ```

3. Create a workspace directory:
   ```bash
   mkdir -p ~/workspace
   cd ~/workspace
   ```

4. Clone your repository:
   ```bash
   git clone <your-repo-url> policy-analyzer
   cd policy-analyzer
   ```

### Option B: Copy Existing Project to WSL2

From Ubuntu terminal:

```bash
# Copy from Windows to WSL2
cp -r /mnt/c/Users/sabre/zed/policy-analyzer ~/workspace/
cd ~/workspace/policy-analyzer
```

## Step 5: Access WSL2 Files from Windows

From Windows File Explorer, navigate to:

```
\\wsl$\Ubuntu-22.04\home\<your-username>\workspace\policy-analyzer
```

Or simply type in File Explorer address bar:
```
\\wsl$
```

You can create a shortcut or bookmark this location.

## Step 6: Launch Zed from WSL2 Context

### Method 1: From Windows, Open WSL2 Path

1. In Windows File Explorer, navigate to:
   ```
   \\wsl$\Ubuntu-22.04\home\<your-username>\workspace\policy-analyzer
   ```

2. Right-click and select "Open with Zed" (if available)

### Method 2: Launch Zed from WSL2 Terminal

From Ubuntu terminal:

```bash
cd ~/workspace/policy-analyzer

# If Zed is installed in Windows, you can call it via:
/mnt/c/Program\ Files/Zed/zed.exe .

# Or if you have an alias set up:
zed .
```

### Method 3: Use Windows Terminal with WSL2

1. Install Windows Terminal from Microsoft Store
2. Open Windows Terminal
3. Select Ubuntu tab
4. Navigate to your project:
   ```bash
   cd ~/workspace/policy-analyzer
   ```
5. Launch Zed from there

## Step 7: Verify Docker Works in WSL2

From Ubuntu terminal:

```bash
# Check Docker is accessible
docker --version

# Verify Docker daemon is running
docker ps

# Test container creation
docker run hello-world
```

## Step 8: Open Dev Container in Zed

Now when you open the project in Zed:

1. Zed should detect the `.devcontainer/devcontainer.json`
2. Accept the prompt to "Open in Container"
3. The TTY error should no longer occur!

## Troubleshooting

### Error: "Cannot connect to Docker daemon"

From WSL2 terminal:
```bash
# Restart Docker Desktop from Windows

# Verify WSL integration
docker context ls
```

### Error: "No such file or directory" for .claude mount

The devcontainer.json now handles both Windows and WSL2 paths:
```json
"mounts": [
  "source=${localEnv:HOME}${localEnv:USERPROFILE}/.claude,target=/home/node/.claude,type=bind,consistency=cached"
]
```

To set up Claude config in WSL2:
```bash
# In Ubuntu terminal
mkdir -p ~/.claude
# Copy any existing config from Windows
cp -r /mnt/c/Users/sabre/.claude/* ~/.claude/ 2>/dev/null || true
```

### Performance Issues

If you experience slow performance:

1. **Keep files in WSL2 filesystem** (NOT under `/mnt/c/`)
   - Good: `~/workspace/policy-analyzer`
   - Bad: `/mnt/c/Users/sabre/zed/policy-analyzer`

2. **Use consistency=cached for volume mounts** (already configured in devcontainer.json)

### Git Credentials

Set up Git credentials in WSL2:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Use Windows Git Credential Manager (recommended)
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

## Benefits of WSL2 Backend

✅ **Better TTY support** - Resolves the "input device is not a TTY" error
✅ **Faster I/O** - 20-50x faster file operations for files in WSL2 filesystem
✅ **Better Docker performance** - Native Linux filesystem performance
✅ **Consistent environment** - Same behavior across Windows and Linux
✅ **Shared containers** - Containers work seamlessly between Windows and WSL2

## Verification Checklist

- [ ] WSL2 installed and set as default version
- [ ] Ubuntu (or other distro) installed and configured
- [ ] Docker Desktop installed with WSL2 backend enabled
- [ ] WSL integration enabled for your Ubuntu distro
- [ ] Project moved to WSL2 filesystem (`~/workspace/`)
- [ ] Can access Docker from WSL2 terminal (`docker ps` works)
- [ ] Can open project in Zed without TTY error
- [ ] Dev container builds and starts successfully

## Additional Resources

- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/wsl/)
- [WSL2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Dev Containers Specification](https://containers.dev/)
- [Zed Dev Containers Documentation](https://zed.dev/docs/dev-containers)

## Next Steps

Once your dev container is working:

1. Run `npm install` (should happen automatically via `postCreateCommand`)
2. Start development server: `npm run dev`
3. Access the app at `http://localhost:3000`

The Vite dev server will be automatically forwarded and you'll get a notification when it starts (configured in `portsAttributes`).