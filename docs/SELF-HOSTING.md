# Self-Hosting Guide

This guide covers deploying your own instance of Privacy Policy Distiller, including the optional free tier proxy service.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│                    (GitHub Pages / Any static host)              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Ollama    │  │  LM Studio  │  │      OpenRouter         │  │
│  │   (Local)   │  │   (Local)   │  │   (Direct / Via Proxy)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │    Optional: Free Tier   │
                              │   Cloudflare Worker      │
                              │                          │
                              │  • Turnstile bot protection
                              │  • Rate limiting         │
                              │  • API key management    │
                              └──────────────────────────┘
```

## Quick Start (Frontend Only)

The simplest deployment uses the frontend with users providing their own API keys.

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/privacy-distiller.git
cd privacy-distiller
npm install
```

### 2. Build and Deploy

```bash
npm run build
# Deploy the `dist/` folder to any static hosting:
# - GitHub Pages
# - Netlify
# - Vercel
# - Cloudflare Pages
# - Any web server
```

That's it! Users can use local LLMs (Ollama, LM Studio) or provide their own OpenRouter API key.

---

## Full Deployment (With Free Tier Proxy)

To offer a hosted free tier (like privacydistiller.com), deploy the Cloudflare Worker proxy.

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- [OpenRouter account](https://openrouter.ai) with API key and credits
- Node.js 18+

### Step 1: Create Turnstile Widget

Turnstile provides invisible bot protection without CAPTCHAs.

1. Go to [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Click **Add Site**
3. Configure:
   - **Site name**: Your app name
   - **Domain**: Your frontend domain(s)
   - **Widget Mode**: **Invisible** (recommended)
4. Save the **Site Key** (public) and **Secret Key** (private)

### Step 2: Create KV Namespace

The Worker uses KV for rate limiting and balance caching.

```bash
cd cloudflare-free-tier
npm install
npx wrangler kv:namespace create POLICY_ANALYZER_KV
```

Copy the `id` from the output.

### Step 3: Configure the Worker

Edit `cloudflare-free-tier/wrangler.toml`:

```toml
# Update the KV namespace ID
[[kv_namespaces]]
binding = "POLICY_ANALYZER_KV"
id = "<your-kv-namespace-id>"

[vars]
# Bot protection (set to "false" to disable)
TURNSTILE_ENABLED = "true"

# Rate limiting (set to "false" for unlimited)
GLOBAL_LIMIT_ENABLED = "true"
GLOBAL_DAILY_LIMIT = "100"

# Spending cap on free API key (USD)
FREE_KEY_SPENDING_CAP = "5.00"

# Your frontend domain(s)
ALLOWED_ORIGINS = "https://yourdomain.com,http://localhost:5173"
```

### Step 4: Set Worker Secrets

```bash
cd cloudflare-free-tier

# Your OpenRouter API key for the free tier
npx wrangler secret put FREE_API_KEY
# Paste your OpenRouter API key when prompted

# Turnstile secret key (from Step 1)
npx wrangler secret put TURNSTILE_SECRET_KEY
# Paste your Turnstile secret key when prompted
```

### Step 5: Deploy the Worker

```bash
npx wrangler deploy
```

Note the worker URL: `https://privacy-policy-free-tier.<your-subdomain>.workers.dev`

### Step 6: (Optional) Custom Domain

1. In Cloudflare Dashboard → Workers & Pages → your worker
2. Go to **Settings** → **Triggers** → **Custom Domains**
3. Add your subdomain (e.g., `api.yourdomain.com`)

### Step 7: Configure Frontend

Set environment variables for your frontend build:

| Variable | Value |
|----------|-------|
| `VITE_FREE_TIER_ENABLED` | `true` |
| `VITE_FREE_TIER_WORKER_URL` | Your worker URL |
| `VITE_TURNSTILE_SITE_KEY` | Your Turnstile site key |

**For GitHub Pages**, add these as repository variables:
- Settings → Secrets and variables → Actions → Variables tab

**For local development**, copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Step 8: Deploy Frontend

```bash
npm run build
# Deploy dist/ to your hosting provider
```

---

## Configuration Reference

### Worker Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TURNSTILE_ENABLED` | `"true"` | Enable Turnstile bot protection |
| `GLOBAL_LIMIT_ENABLED` | `"true"` | Enable global daily rate limit |
| `GLOBAL_DAILY_LIMIT` | `"100"` | Max requests per day (all users combined) |
| `FREE_KEY_SPENDING_CAP` | `"5.00"` | USD spending cap on free API key |
| `ALLOWED_ORIGINS` | — | Comma-separated allowed CORS origins |

### Worker Secrets

| Secret | Description |
|--------|-------------|
| `FREE_API_KEY` | OpenRouter API key for free tier |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |

### Frontend Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FREE_TIER_ENABLED` | Show "Hosted Free" provider option |
| `VITE_FREE_TIER_WORKER_URL` | URL of your deployed Worker |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

---

## Disabling Features

### Run Without Free Tier

Simply don't set the `VITE_FREE_TIER_ENABLED` variable (or set to `false`). Users will only see local LLM options and OpenRouter (BYOK).

### Run Worker Without Turnstile

Set in `wrangler.toml`:
```toml
TURNSTILE_ENABLED = "false"
```

### Run Worker Without Rate Limiting

Set in `wrangler.toml`:
```toml
GLOBAL_LIMIT_ENABLED = "false"
```

---

## API Endpoints

The Worker exposes these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Free tier availability status |
| `/api/analyze` | POST | LLM proxy endpoint |

### POST /api/analyze

Request:
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {"role": "user", "content": "Summarize this policy..."}
  ],
  "temperature": 0.7,
  "max_tokens": 32000
}
```

Headers:
- `X-Turnstile-Token`: Turnstile verification token (if enabled)
- `X-User-Api-Key`: Optional user API key for BYOK fallback

Response headers:
- `x-key-source`: `free` or `byok`
- `x-free-remaining`: Remaining daily requests (if using free tier)

---

## Privacy Considerations

The Worker is designed with privacy in mind:

- **No logging**: `observability.enabled = false` in wrangler.toml
- **No IP tracking**: No user identifiers stored
- **No cookies**: Stateless request handling
- **Turnstile**: Privacy-preserving alternative to traditional CAPTCHAs
- **Rate limiting**: Uses anonymous daily counters, not per-user tracking

---

## Troubleshooting

### "Turnstile verification failed"

- Ensure your domain is added to the Turnstile widget configuration
- Check that `TURNSTILE_SECRET_KEY` is set correctly
- For local development, use the test site key: `1x00000000000000000000AA`

### "Origin not allowed"

- Add your domain to `ALLOWED_ORIGINS` in wrangler.toml
- Include both production and development URLs

### "Free tier budget exhausted"

- The free API key has reached its spending cap
- Add more credits to your OpenRouter account, or
- Increase `FREE_KEY_SPENDING_CAP` in wrangler.toml

### Worker not updating after deploy

- Clear Cloudflare cache if using a custom domain
- Check `npx wrangler tail` for real-time logs during development

---

## Cost Estimates

### Cloudflare (Worker + KV)

- **Workers**: 100,000 requests/day free
- **KV**: 100,000 reads/day, 1,000 writes/day free
- Typically **$0/month** for moderate traffic

### OpenRouter

- Varies by model; Gemini 2.5 Flash Preview ≈ $0.15-0.60 per 1M tokens
- Set `FREE_KEY_SPENDING_CAP` to control costs
- Monitor usage at [openrouter.ai/activity](https://openrouter.ai/activity)

### Turnstile

- **Free** for unlimited verifications
