---
name: protect-production-branch
description: Adds guardrails around operations on main/master branch
event: PreToolUse
tools:
  - Bash
  - mcp__acp__Bash
---

# Production Branch Protection

The `main` branch is production. Extra care is needed for operations that affect it.

## BLOCK - Direct Force Push to Main
- `git push --force origin main`
- `git push -f origin main`
- `git push --force-with-lease origin main`

These require explicit user approval in the conversation first.

## BLOCK - Direct Commits to Main (When on Feature Branch)
If the current branch is NOT main, block:
- `git checkout main && git commit`
- `git switch main && git commit`

Work should stay on feature branches until PR merge.

## WARN - Merge to Main
Allow but flag:
- `git merge * main` (merging into main)
- `git checkout main && git merge`

User should be aware this affects production.

## ALLOW - Safe Main Operations
- `git checkout main` (just switching, no modifications)
- `git pull origin main` (getting updates)
- `git fetch origin main`
- `git log main`
- `git diff main`
- Creating branches FROM main: `git checkout -b feature main`

## ALLOW - Normal Branch Operations
All operations on non-main branches are allowed:
- `git push origin feature-branch`
- `git commit` (when on feature branch)
- `git push --force origin feature-branch` (force push to own branch is fine)

## Response Format

If blocked:
```json
{"decision": "block", "reason": "Direct force push to main requires explicit user approval"}
```

If warning:
```json
{"decision": "allow", "warning": "This affects the production branch - ensure this is intentional"}
```

If allowed:
```json
{"decision": "allow"}
```
