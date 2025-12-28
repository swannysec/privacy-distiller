# Quick Start: WSL2 Dev Container

## TL;DR - Fastest Path to Working Dev Container

If you're seeing the error: `the input device is not a TTY`

**Solution: Move your project to WSL2 filesystem**

## 3-Step Quick Setup

### 1. Enable WSL2 (One-time setup)
```powershell
# Run in PowerShell as Administrator
wsl --install
```
Restart computer when prompted.

### 2. Move Project to WSL2
```bash
# Open Ubuntu terminal from Start Menu
mkdir -p ~/workspace
cd ~/workspace
git clone <your-repo-url> policy-analyzer
# OR copy existing: cp -r /mnt/c/Users/sabre/zed/policy-analyzer .
```

### 3. Configure Docker Desktop
- Open Docker Desktop → Settings → General
- ✅ Enable "Use the WSL 2 based engine"
- Settings → Resources → WSL Integration
- ✅ Enable integration with Ubuntu
- Click "Apply & Restart"

## Opening Project in Zed

### From Windows File Explorer:
```
\\wsl$\Ubuntu-22.04\home\<username>\workspace\policy-analyzer
```
Right-click → Open with Zed

### From WSL2 Terminal:
```bash
cd ~/workspace/policy-analyzer
/mnt/c/Program\ Files/Zed/zed.exe .
```

## Verify It Works

```bash
# In WSL2 terminal
docker --version
docker ps
# Should show Docker is accessible
```

Now open the project in Zed - the TTY error should be gone! ✨

## Why This Works

- ❌ Windows path: `C:\Users\sabre\zed\policy-analyzer` → TTY errors
- ✅ WSL2 path: `~/workspace/policy-analyzer` → No TTY errors
- The `devcontainer.json` is already configured with `--tty=false` and WSL2-optimized settings

## Need More Details?

See `WSL2_SETUP.md` for comprehensive setup instructions and troubleshooting.

## Configuration Summary

Your `devcontainer.json` has been optimized for WSL2:
- ✅ Dual Windows/WSL2 path support for `.claude` config
- ✅ TTY allocation disabled (`--tty=false`)
- ✅ Cached volume mounts for performance
- ✅ Proper workspace mounting
- ✅ Init process handling

## Common Issues

**"Cannot connect to Docker daemon"**
→ Make sure Docker Desktop is running and WSL integration is enabled

**"No such file or directory" for .claude**
→ Run: `mkdir -p ~/.claude` in WSL2 terminal

**Slow performance**
→ Make sure project is in `~/workspace/` not `/mnt/c/`

## Quick Commands

```bash
# Check WSL version
wsl -l -v

# Set default to WSL2
wsl --set-default-version 2

# Access WSL files from Windows
\\wsl$

# Test Docker in WSL2
docker run hello-world
```
