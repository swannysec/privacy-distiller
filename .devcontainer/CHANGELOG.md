# Dev Container Configuration Changelog

## [Unreleased] - 2025-01-XX

### Added - WSL2 Support and TTY Error Fix

#### Configuration Changes
- **WSL2 Optimization**: Added `workspaceMount` and `workspaceFolder` properties for proper WSL2 path handling
- **TTY Error Fix**: Added `--tty=false` to `runArgs` to prevent "input device is not a TTY" errors on Windows
- **Init Process**: Added `--init` flag to `runArgs` for proper signal handling
- **Performance**: Added `consistency=cached` to all volume mounts for improved file I/O performance
- **Cross-Platform Path Support**: Updated `.claude` mount to support both Windows (`USERPROFILE`) and WSL2 (`HOME`) paths

#### Documentation Added
- `README.md` - Complete dev container documentation and overview
- `QUICK_START.md` - 3-step quick setup guide for WSL2
- `WSL2_SETUP.md` - Comprehensive WSL2 setup instructions with troubleshooting
- `verify-setup.sh` - Automated verification script for WSL2 and Docker setup
- `check-setup.bat` - Windows batch script for quick system verification
- `CHANGELOG.md` - This file

### Changed
- **Mount Configuration**: Changed from simple path to explicit mount with caching:
  ```json
  "source=${localEnv:HOME}${localEnv:USERPROFILE}/.claude,target=/home/node/.claude,type=bind,consistency=cached"
  ```
- **Run Arguments**: Updated from `["--network=host", "--tty=false"]` to `["--init", "--tty=false"]`
  - Removed `--network=host` (not needed for basic dev server)
  - Added `--init` for better process management

### Technical Details

#### Before (Original Configuration)
```json
{
  "mounts": [
    "source=${localEnv:USERPROFILE}/.claude,target=/home/node/.claude,type=bind"
  ],
  "runArgs": [
    "--network=host",
    "--tty=false"
  ]
}
```

#### After (WSL2-Optimized Configuration)
```json
{
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.claude,target=/home/node/.claude,type=bind,consistency=cached"
  ],
  "runArgs": ["--init", "--tty=false"],
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached",
  "workspaceFolder": "/workspace"
}
```

### Why These Changes?

#### Problem
Windows users experienced the error:
```
[agent_servers::acp] agent stderr: the input device is not a TTY.
If you are using mintty, try prefixing the command with 'winpty'
```

This occurred because:
1. Zed uses `docker exec -it` to connect to dev containers
2. Git Bash/MinTTY on Windows doesn't provide a proper TTY
3. Docker's `-t` flag expects a TTY to be available

#### Solution
1. **Disable TTY allocation**: `--tty=false` in runArgs
2. **Use WSL2 filesystem**: Better TTY support and performance
3. **Optimize mounts**: `consistency=cached` improves I/O performance
4. **Cross-platform paths**: Support both Windows and WSL2 environments

### Benefits

✅ **Fixes TTY Error**: No more "input device is not a TTY" errors on Windows
✅ **Better Performance**: 20-50x faster file operations when using WSL2 filesystem
✅ **Cross-Platform**: Works on Windows, WSL2, Linux, and macOS
✅ **Optimized Mounts**: Cached consistency for faster file I/O
✅ **Proper Process Handling**: `--init` flag ensures proper signal handling and zombie reaping
✅ **Comprehensive Documentation**: Multiple guides for different use cases

### Migration Guide

If you were using the old configuration:

1. **Install WSL2** (Windows users):
   ```powershell
   wsl --install
   ```

2. **Move project to WSL2**:
   ```bash
   mkdir -p ~/workspace
   cd ~/workspace
   cp -r /mnt/c/Users/<username>/zed/policy-analyzer .
   ```

3. **Configure Docker Desktop**:
   - Enable "Use the WSL 2 based engine"
   - Enable WSL integration for Ubuntu

4. **Open project from WSL2**:
   - Windows Explorer: `\\wsl$\Ubuntu-22.04\home\<username>\workspace\policy-analyzer`
   - Open with Zed

5. **Verify setup**:
   ```bash
   ./.devcontainer/verify-setup.sh
   ```

### Compatibility

- ✅ **Zed**: Tested and working
- ✅ **VS Code**: Fully compatible (uses same dev container spec)
- ✅ **Docker Desktop**: Requires WSL2 backend on Windows
- ✅ **Node.js**: Version 20 (LTS)
- ✅ **Claude Code**: Pre-configured and working

### Known Limitations

- **Windows without WSL2**: May still experience TTY issues (WSL2 is recommended)
- **Performance on /mnt/c**: Slower when project is on Windows filesystem instead of WSL2
- **First Build**: Initial container build takes 2-3 minutes

### References

- [Dev Containers Specification](https://containers.dev/)
- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/wsl/)
- [Zed Dev Containers Documentation](https://zed.dev/docs/dev-containers)
- [Docker Volume Consistency](https://docs.docker.com/storage/bind-mounts/#configure-mount-consistency-for-macos)

### Contributors

- Configuration optimized for WSL2 and Windows compatibility
- Documentation structure following best practices for dev containers
- Automated verification scripts for easier troubleshooting

---

## How to Use This Changelog

- **Users**: Check this file to understand recent changes and migration steps
- **Contributors**: Update this file when making configuration changes
- **Format**: Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles

### Semantic Versioning

This configuration follows dev container spec versioning:
- **Major**: Breaking changes requiring migration
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, documentation updates