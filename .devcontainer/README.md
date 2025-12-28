# Dev Container Configuration

This directory contains the development container configuration for the Privacy Policy Analyzer project.

## 🚀 Quick Start

### Recommended: WSL2 Setup (Windows Users)

If you're experiencing TTY errors on Windows, follow the quick setup:

1. **Install WSL2**
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   ```

2. **Move project to WSL2**
   ```bash
   # In Ubuntu terminal
   mkdir -p ~/workspace
   cd ~/workspace
   git clone <your-repo-url> policy-analyzer
   ```

3. **Configure Docker Desktop**
   - Enable "Use the WSL 2 based engine"
   - Enable WSL integration for Ubuntu

4. **Open in Zed**
   - Navigate to `\\wsl$\Ubuntu-22.04\home\<username>\workspace\policy-analyzer`
   - Open with Zed
   - Accept "Open in Container" prompt

📖 **See [QUICK_START.md](./QUICK_START.md) for detailed steps**

## 📋 What's Included

### devcontainer.json
Main configuration file with:
- **Base Image**: Node.js 20 (official Microsoft dev container)
- **Claude Code Integration**: Pre-configured Claude Code feature
- **Auto-installed Extensions**: ESLint, Prettier
- **Port Forwarding**: Port 3000 for Vite dev server
- **WSL2 Optimizations**: Cached mounts, TTY handling
- **Auto Setup**: Runs `npm install` on container creation

### Configuration Highlights

```json
{
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  "features": {
    "ghcr.io/anthropics/devcontainer-features/claude-code:1.0": {}
  },
  "runArgs": ["--init", "--tty=false"],
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached"
}
```

### Key Features

✅ **TTY Error Fix**: `--tty=false` prevents "input device is not a TTY" errors on Windows
✅ **Performance Optimized**: `consistency=cached` for fast file operations
✅ **Cross-Platform Paths**: Works on both Windows and WSL2
✅ **Auto-Setup**: Dependencies installed automatically
✅ **Port Forwarding**: Dev server accessible at `http://localhost:3000`
✅ **Claude Integration**: Claude Code works seamlessly in container

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `devcontainer.json` | Main container configuration |
| `README.md` | This file - overview and navigation |
| `QUICK_START.md` | Fast-track setup for WSL2 |
| `WSL2_SETUP.md` | Comprehensive WSL2 setup guide |
| `verify-setup.sh` | Automated verification script |

## 🔧 Using the Container

### First Time Setup

1. Open project in Zed
2. When prompted, select "Open in Container"
3. Wait for container to build (2-3 minutes first time)
4. `npm install` runs automatically
5. Start coding!

### Development Workflow

```bash
# Inside the container, terminal will open in /workspace

# Start dev server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Accessing the Container

**Via Zed**: 
- Project → Open Remote → Connect Dev Container

**Via Docker CLI**:
```bash
# List running containers
docker ps

# Execute command in container
docker exec -it <container-name> bash

# View logs
docker logs <container-name>
```

## 🔍 Verifying Setup

Run the verification script from WSL2:

```bash
cd ~/workspace/policy-analyzer
./.devcontainer/verify-setup.sh
```

This checks:
- ✅ WSL2 environment
- ✅ Docker availability
- ✅ Required tools
- ✅ Dev container config validity
- ✅ Network connectivity

## 🛠 Troubleshooting

### "The input device is not a TTY" Error

**Solution**: Use WSL2 backend
- See [QUICK_START.md](./QUICK_START.md) for 3-step setup
- See [WSL2_SETUP.md](./WSL2_SETUP.md) for comprehensive guide

### Container Fails to Build

```bash
# Rebuild without cache
docker build --no-cache .

# Or in Zed: Kill container and rebuild
docker kill <container-name>
# Reopen in Zed
```

### "Cannot connect to Docker daemon"

1. Ensure Docker Desktop is running
2. Check WSL integration is enabled
3. Restart Docker Desktop
4. Verify: `docker ps` works in WSL2 terminal

### Slow Performance

**Cause**: Project on Windows filesystem (`/mnt/c/...`)
**Solution**: Move to WSL2 filesystem (`~/workspace/`)

```bash
# Move project to WSL2
cp -r /mnt/c/Users/<username>/zed/policy-analyzer ~/workspace/
cd ~/workspace/policy-analyzer
```

### Changes to devcontainer.json Not Applied

Dev containers don't auto-reload. To apply changes:

1. Kill the existing container:
   ```bash
   docker ps  # Find container name
   docker kill <container-name>
   ```

2. Reopen project in Zed
3. Accept "Open in Container" prompt again

## 📦 Container Specifications

| Resource | Requirement |
|----------|-------------|
| CPUs | 2 cores minimum |
| Memory | 4GB minimum |
| Storage | 32GB minimum |
| Base Image | Node.js 20 (Debian-based) |
| User | `node` (non-root) |

## 🔐 Security

- Container runs as non-root user (`node`)
- Claude config mounted from host (`~/.claude`)
- No privileged access required
- Network isolated unless explicitly forwarded

## 🎯 Next Steps

1. ✅ Complete WSL2 setup (if on Windows)
2. ✅ Run verification script
3. ✅ Open project in Zed dev container
4. ✅ Start development server: `npm run dev`
5. ✅ Begin building features!

## 📖 Additional Resources

- [Dev Containers Specification](https://containers.dev/)
- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/wsl/)
- [Zed Dev Containers Documentation](https://zed.dev/docs/dev-containers)
- [Microsoft Dev Container Images](https://github.com/devcontainers/images)

## 🤝 Contributing

When making changes to the dev container configuration:

1. Update `devcontainer.json`
2. Test the changes locally
3. Update this documentation
4. Run `verify-setup.sh` to ensure validity
5. Commit all changes together

## 💡 Tips

- **Use cached mounts** for better performance (already configured)
- **Keep project in WSL2** filesystem for optimal speed
- **Restart container** after changing `devcontainer.json`
- **Run verification script** before reporting issues
- **Check Docker Desktop** is running and WSL integration enabled

---

**Need Help?**
- Quick fixes: See [QUICK_START.md](./QUICK_START.md)
- Detailed setup: See [WSL2_SETUP.md](./WSL2_SETUP.md)
- Verify setup: Run `./verify-setup.sh`
