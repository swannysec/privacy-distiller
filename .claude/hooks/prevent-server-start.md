---
name: prevent-server-start
description: Prevents Claude from starting dev servers - user manages these manually
event: PreToolUse
tools:
  - Bash
  - mcp__acp__Bash
---

# Server Start Prevention

This project has a rule: Claude should NOT start dev servers. The user manages preview servers manually.

## BLOCK - Server Commands
Block these commands:
- `npm run dev`
- `npm run preview`
- `npm start`
- `npx vite`
- `npx vite preview`
- `python -m http.server`
- `python3 -m http.server`
- `npx serve`
- `npx http-server`
- Any command that would start a long-running server process

## ALLOW - Build Commands
These are fine (they exit when complete):
- `npm run build`
- `npm test`
- `npx vite build`

## ALLOW - Background Checks
Short-lived server checks are okay:
- `curl http://localhost:*` (checking if something is running)
- `netstat` or `lsof` (checking ports)

## Response Format

If blocked:
```json
{"decision": "block", "reason": "Server commands are not allowed - user manages dev servers manually. Use 'npm run build' for builds."}
```

If allowed:
```json
{"decision": "allow"}
```
