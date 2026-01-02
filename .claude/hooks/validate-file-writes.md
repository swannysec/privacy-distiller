---
name: validate-file-writes
description: Ensures file writes stay within project boundaries and don't overwrite critical files without awareness
event: PreToolUse
tools:
  - Write
  - Edit
  - mcp__acp__Write
  - mcp__acp__Edit
---

# File Write Validation

Analyze the file path being written to ensure it's safe.

## BLOCK - Outside Project Boundary
Block writes to paths that are clearly outside the project:
- Absolute paths not under `C:\Users\sabre\zed\policy-analyzer`
- Paths containing `..` that escape the project root
- System directories (`C:\Windows`, `/etc/`, `/usr/`, etc.)
- User home directories directly (`~/.bashrc`, `~/.ssh/`, etc.)

## WARN - Sensitive Files (Allow but Flag)
These should proceed but be flagged for user awareness:
- `.env` files (may contain secrets)
- `package-lock.json` (usually auto-generated)
- `.git/` directory contents
- Configuration files in user home (`.claude/`, `.config/`)

## BLOCK - Never Modify
- `.git/objects/` (Git internal data)
- `.git/HEAD` directly
- `node_modules/` contents (should use npm)
- Binary files that weren't explicitly created by this session

## ALLOW - Safe Project Files
Always allow:
- `src/**/*` - Source code
- `public/**/*` - Static assets
- `*.md` - Documentation
- `*.json` in project root - Configuration
- `.claude/**/*` - Claude configuration
- `tests/**/*` or `*.test.*` - Test files

## Response Format

If blocked:
```json
{"decision": "block", "reason": "Cannot write outside project boundary"}
```

If warning:
```json
{"decision": "allow", "warning": "Writing to sensitive file - ensure this is intentional"}
```

If safe:
```json
{"decision": "allow"}
```
