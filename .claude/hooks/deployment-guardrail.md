---
name: deployment-guardrail
description: Requires explicit user approval for production deployment commands
event: PreToolUse
tools:
  - Bash
  - mcp__acp__Bash
---

# Deployment Guardrail

Production deployments should only happen with explicit user intent.

## BLOCK - Deployment Commands (Require Recent User Approval)
These commands deploy to production and need user approval:
- `wrangler deploy`
- `wrangler publish`
- `gh-pages -d dist`
- `npm run deploy`
- `vercel --prod`
- `netlify deploy --prod`
- `firebase deploy`
- `aws s3 sync` to production buckets

## Context Check
Before blocking, check if the user explicitly requested deployment in their recent message.

Phrases that indicate approval:
- "deploy to production"
- "push to cloudflare"
- "deploy the worker"
- "ship it"
- "deploy this"

If user explicitly requested deployment, allow the command.

## ALLOW - Non-Production
These are safe:
- `wrangler dev` (local development)
- `vercel` without `--prod` (preview)
- `netlify deploy` without `--prod` (draft)
- Dry-run or preview commands

## Response Format

If blocked (no recent user approval):
```json
{"decision": "block", "reason": "Production deployment requires explicit user approval. Please confirm you want to deploy."}
```

If user approved:
```json
{"decision": "allow"}
```
