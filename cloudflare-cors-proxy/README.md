# Privacy Policy Analyzer - CORS Proxy Worker

A minimal, privacy-focused Cloudflare Worker that acts as a CORS proxy for the Privacy Policy Analyzer application.

## Privacy Features

- **No logging**: `observability.enabled = false` in wrangler.toml
- **No data retention**: Requests are processed and immediately forgotten
- **No cookies forwarded**: Authentication/session data is stripped
- **SSRF protection**: Private/internal URLs are blocked

## Deployment

### Prerequisites

1. A Cloudflare account (free tier is sufficient)
2. Node.js 18+ installed
3. Wrangler CLI (installed as dev dependency)

### Steps

1. **Install dependencies**:
   ```bash
   cd cloudflare-cors-proxy
   npm install
   ```

2. **Login to Cloudflare**:
   ```bash
   npx wrangler login
   ```
   This opens a browser for authentication.

3. **Deploy the Worker**:
   ```bash
   npm run deploy
   ```

4. **Note the Worker URL**:
   After deployment, you'll see output like:
   ```
   Published privacy-policy-cors-proxy (1.0.0)
     https://privacy-policy-cors-proxy.<your-subdomain>.workers.dev
   ```

5. **Update allowed origins**:
   Edit `src/index.js` and add your GitHub Pages URL to `ALLOWED_ORIGINS`:
   ```javascript
   const ALLOWED_ORIGINS = [
     'http://localhost:5173',
     'http://localhost:4173',
     'https://yourusername.github.io',  // Add this
   ];
   ```

6. **Redeploy after changes**:
   ```bash
   npm run deploy
   ```

## Local Development

Run the Worker locally for testing:

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`.

Test it with:
```bash
curl "http://localhost:8787/?url=https://example.com"
```

## Usage

The Worker accepts GET requests with a `url` query parameter:

```
https://your-worker.workers.dev/?url=https://example.com/privacy-policy
```

### Response Codes

- `200`: Success - returns the proxied content with CORS headers
- `400`: Invalid or missing URL parameter
- `403`: Origin not in allowed list
- `405`: Method not allowed (only GET/HEAD/OPTIONS)
- `413`: Content too large (>10MB)
- `502`: Failed to fetch the target URL

## Security

- Only HTTP/HTTPS URLs are proxied
- Private IP ranges and localhost are blocked (SSRF protection)
- Content size limited to 10MB
- 30-second request timeout
- Origin validation via allowlist

## Free Tier Limits

Cloudflare Workers free tier includes:
- 100,000 requests/day
- 10ms CPU time per request
- No credit card required

This is more than sufficient for personal/professional use of the Privacy Policy Analyzer.

## License

This Worker is part of the Privacy Policy Analyzer project and is licensed under the MIT License with Commercial Product Restriction. See the LICENSE file in the parent directory.
