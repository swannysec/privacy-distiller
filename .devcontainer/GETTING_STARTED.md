# Getting Started with Dev Containers

Welcome! This guide will help you set up and use the Privacy Policy Analyzer dev container.

## 🎯 What You Need to Know

You're seeing a **TTY error** because Zed is trying to connect to Docker using a pseudo-terminal (TTY) that isn't available in your Windows environment. The solution is to use **WSL2** (Windows Subsystem for Linux version 2).

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install WSL2

Open PowerShell **as Administrator** and run:

```powershell
wsl --install
```

Restart your computer when prompted.

### Step 2: Install Ubuntu

After restart, Ubuntu will automatically install. If not:

```powershell
wsl --install -d Ubuntu-22.04
```

Set up your username and password when prompted.

### Step 3: Configure Docker Desktop

1. Open **Docker Desktop**
2. Go to **Settings** → **General**
3. ✅ Enable "Use the WSL 2 based engine"
4. Go to **Settings** → **Resources** → **WSL Integration**
5. ✅ Enable integration with your Ubuntu distribution
6. Click **Apply & Restart**

### Step 4: Move Your Project to WSL2

Open **Ubuntu** from the Start Menu and run:

```bash
# Create workspace directory
mkdir -p ~/workspace
cd ~/workspace

# Copy your existing project from Windows
cp -r /mnt/c/Users/sabre/zed/policy-analyzer .

# Navigate into the project
cd policy-analyzer
```

### Step 5: Open in Zed from WSL2

**Option A - From Windows File Explorer:**

1. Open File Explorer
2. Type in address bar: `\\wsl$\Ubuntu-22.04\home\<your-username>\workspace\policy-analyzer`
3. Right-click on the folder → Open with Zed

**Option B - From Ubuntu Terminal:**

```bash
cd ~/workspace/policy-analyzer
/mnt/c/Program\ Files/Zed/zed.exe .
```

### Step 6: Open in Container

When Zed prompts "Reopen in Container":
- Click **"Open in Container"**
- Wait 2-3 minutes for the first build
- You're done! 🎉

## ✅ Verify Everything Works

From the Ubuntu terminal:

```bash
cd ~/workspace/policy-analyzer
./.devcontainer/verify-setup.sh
```

This script checks:
- ✅ WSL2 is running
- ✅ Docker is accessible
- ✅ Project is in the right location
- ✅ Configuration is correct

## 🚀 Start Developing

Once inside the container:

```bash
# Start the dev server (runs on port 3000)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

The dev server will be automatically forwarded to `http://localhost:3000` on your host machine.

## 🐛 Troubleshooting

### Still Getting TTY Error?

Make sure you're opening the project from the **WSL2 filesystem**, not from `/mnt/c/`:

❌ **Wrong:** `/mnt/c/Users/sabre/zed/policy-analyzer`
✅ **Correct:** `~/workspace/policy-analyzer` (or `/home/<username>/workspace/policy-analyzer`)

### "Cannot Connect to Docker Daemon"

```bash
# Check Docker Desktop is running
docker ps

# If that fails, restart Docker Desktop from Windows
# Then verify in WSL2:
docker --version
```

### Slow Performance

If files are loading slowly, make sure:
1. Project is in WSL2 filesystem (`~/workspace/`)
2. NOT in Windows filesystem (`/mnt/c/`)

```bash
# Check where you are
pwd

# Should show: /home/<username>/workspace/policy-analyzer
# NOT: /mnt/c/Users/...
```

### Container Won't Build

```bash
# Rebuild without cache
docker system prune -a
# Then reopen project in Zed
```

### Changes to devcontainer.json Not Applied

1. Kill the running container:
   ```bash
   docker ps  # Find the container name
   docker kill <container-name>
   ```
2. Reopen the project in Zed
3. Accept the "Open in Container" prompt again

## 📖 Additional Resources

- **Quick Reference:** See [QUICK_START.md](./QUICK_START.md)
- **Detailed Setup:** See [WSL2_SETUP.md](./WSL2_SETUP.md)
- **Complete Docs:** See [README.md](./README.md)
- **Windows Check:** Run `check-setup.bat` from Windows
- **WSL2 Check:** Run `verify-setup.sh` from Ubuntu

## 💡 Pro Tips

### Accessing WSL2 Files from Windows

Type in File Explorer address bar:
```
\\wsl$
```

This shows all your WSL2 distributions. Bookmark your workspace folder!

### Git in WSL2

Your Git credentials should work automatically, but if not:

```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Use Windows Credential Manager
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

### Claude Configuration

The dev container automatically mounts your Claude config from `~/.claude`.

If it doesn't exist, create it:

```bash
mkdir -p ~/.claude
```

To copy from Windows:

```bash
cp -r /mnt/c/Users/sabre/.claude/* ~/.claude/
```

## 🎓 Understanding the Setup

### Why WSL2?

- **Better TTY Support:** Native Linux environment = no TTY errors
- **Faster Performance:** 20-50x faster file I/O than Windows filesystem
- **True Linux:** Run Linux tools natively on Windows
- **Seamless Docker:** Docker containers work perfectly

### What's Happening Behind the Scenes?

1. **Zed** detects `.devcontainer/devcontainer.json`
2. **Docker** builds a container with Node.js 20
3. **Container** installs dependencies (`npm install`)
4. **Claude Code** feature is installed and configured
5. **Your code** is mounted into `/workspace` in the container
6. **Port 3000** is forwarded for the dev server

### Container Specs

- **Base Image:** `mcr.microsoft.com/devcontainers/javascript-node:20`
- **User:** `node` (non-root)
- **Working Directory:** `/workspace`
- **Memory:** 4GB minimum
- **CPUs:** 2 cores minimum

## 🆘 Need Help?

1. **Run verification script:**
   ```bash
   ./.devcontainer/verify-setup.sh
   ```

2. **Check Docker logs:**
   ```bash
   docker ps
   docker logs <container-name>
   ```

3. **Review documentation:**
   - [QUICK_START.md](./QUICK_START.md) - 3-step quick setup
   - [WSL2_SETUP.md](./WSL2_SETUP.md) - Comprehensive guide
   - [README.md](./README.md) - Full documentation

4. **Common Issues:**
   - TTY Error → Use WSL2 filesystem
   - Slow Performance → Move to `~/workspace/`
   - Can't Connect to Docker → Enable WSL integration in Docker Desktop
   - Changes Not Applied → Kill container and rebuild

## ✨ You're Ready!

Once you see the Zed interface connected to the container:

1. Open the terminal (will be inside the container)
2. Run `npm run dev`
3. Visit `http://localhost:3000`
4. Start building the Privacy Policy Analyzer! 🚀

---

**Still stuck?** Check [WSL2_SETUP.md](./WSL2_SETUP.md) for detailed troubleshooting or run the verification scripts.