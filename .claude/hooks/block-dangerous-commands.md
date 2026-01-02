---
name: block-dangerous-commands
description: Prevents execution of dangerous bash commands that could harm the system or project
event: PreToolUse
tools:
  - Bash
  - mcp__acp__Bash
---

# Dangerous Command Detection

Analyze the bash command for dangerous patterns. Block if ANY of these are detected:

## BLOCK - Destructive File Operations
- `rm -rf /` or `rm -rf ~` or `rm -rf *` (recursive force delete of root, home, or everything)
- `rm -rf` on paths outside the project directory
- `> /dev/sd*` or writing directly to disk devices
- `mkfs` or `dd if=` (disk formatting/overwriting)
- `:(){ :|:& };:` (fork bomb)

## BLOCK - System Modification
- `chmod 777` on system directories
- `chown` on system files
- Modifying `/etc/`, `/usr/`, `/bin/`, `/sbin/`
- `sudo` commands (should not be needed in this project)

## BLOCK - Network Abuse
- `curl` or `wget` piped directly to `sh` or `bash`
- Mass network scanning (`nmap` on ranges)
- DDoS patterns

## BLOCK - Credential/Secret Exposure
- `cat` or `echo` of `.env` files to logs
- Commands that would expose API keys in output

## BLOCK - Git History Destruction (Without Explicit User Request)
- `git push --force` to main/master without recent user approval
- `git filter-repo` or `git filter-branch` without recent user approval
- `git reset --hard` on remote tracking branches

## ALLOW - Safe Operations
These are always safe:
- `npm test`, `npm run build`, `npm install`
- `git status`, `git diff`, `git log`, `git add`, `git commit`
- `mkdir`, `cat` (reading files), `ls`, `find`, `grep`
- `gh pr`, `gh issue` commands
- File operations within the project directory

## Response Format

If dangerous:
```json
{"decision": "block", "reason": "Brief explanation of why this is dangerous"}
```

If safe:
```json
{"decision": "allow"}
```
