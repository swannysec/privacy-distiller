/**
 * Privacy Policy Analyzer - CORS Proxy Worker
 *
 * A minimal, privacy-focused CORS proxy for fetching privacy policies and
 * terms of service documents. This Worker adds CORS headers to responses
 * from third-party sites, enabling browser-based document analysis.
 *
 * Privacy considerations:
 * - No logging enabled (observability.enabled = false in wrangler.toml)
 * - No request data is stored or transmitted to third parties
 * - No cookies or authentication headers are forwarded
 * - Requests are processed and immediately forgotten
 *
 * @license MIT License with Commercial Product Restriction
 * @copyright 2025 John D. Swanson
 */

// Allowed origins - update this with your GitHub Pages URL after deployment
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8765',
  'http://localhost:8766',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  // Add your GitHub Pages URL here after deployment:
  // 'https://yourusername.github.io',
];

// Maximum content size to proxy (10MB)
const MAX_CONTENT_SIZE = 10 * 1024 * 1024;

// Request timeout (30 seconds)
const FETCH_TIMEOUT = 30000;

/**
 * CORS headers to add to responses
 */
function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };

  // Only allow specific origins, or allow all in development
  if (origin && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*'))) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (ALLOWED_ORIGINS.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

/**
 * Handle CORS preflight requests
 */
function handleOptions(request) {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Validate and sanitize the target URL
 */
function validateUrl(urlString) {
  if (!urlString) {
    return { valid: false, error: 'Missing "url" query parameter' };
  }

  try {
    const url = new URL(urlString);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Block localhost and private IPs to prevent SSRF
    const hostname = url.hostname.toLowerCase();
    if (
      // IPv4 loopback and private ranges
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      // IPv6 loopback and private ranges
      hostname === '::1' ||
      hostname === '::' ||
      hostname.startsWith('fe80:') ||       // Link-local
      hostname.startsWith('fc00:') ||       // Unique local
      hostname.startsWith('fd00:') ||       // Unique local
      // IPv4-mapped IPv6 addresses
      hostname.startsWith('::ffff:127.') ||
      hostname.startsWith('::ffff:10.') ||
      hostname.startsWith('::ffff:192.168.') ||
      hostname.startsWith('::ffff:172.16.') ||
      hostname.startsWith('::ffff:172.17.') ||
      hostname.startsWith('::ffff:172.18.') ||
      hostname.startsWith('::ffff:172.19.') ||
      hostname.startsWith('::ffff:172.20.') ||
      hostname.startsWith('::ffff:172.21.') ||
      hostname.startsWith('::ffff:172.22.') ||
      hostname.startsWith('::ffff:172.23.') ||
      hostname.startsWith('::ffff:172.24.') ||
      hostname.startsWith('::ffff:172.25.') ||
      hostname.startsWith('::ffff:172.26.') ||
      hostname.startsWith('::ffff:172.27.') ||
      hostname.startsWith('::ffff:172.28.') ||
      hostname.startsWith('::ffff:172.29.') ||
      hostname.startsWith('::ffff:172.30.') ||
      hostname.startsWith('::ffff:172.31.') ||
      // Private domain suffixes
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost')
    ) {
      return { valid: false, error: 'Private/local URLs are not allowed' };
    }

    return { valid: true, url };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main request handler
 */
async function handleRequest(request) {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Check if origin is allowed
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !ALLOWED_ORIGINS.includes('*')) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  // Parse the target URL from query parameter
  const requestUrl = new URL(request.url);
  const targetUrl = requestUrl.searchParams.get('url');

  // Validate the URL
  const validation = validateUrl(targetUrl);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  try {
    // Fetch the target URL
    const response = await fetchWithTimeout(
      validation.url.toString(),
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Privacy-Policy-Analyzer/1.0 (CORS Proxy)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      },
      FETCH_TIMEOUT
    );

    // Check content length if provided
    // Note: Chunked responses without Content-Length header bypass this check.
    // Cloudflare Workers have built-in CPU/memory limits that provide protection.
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_SIZE) {
      return new Response(JSON.stringify({ error: 'Content too large' }), {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Create response with CORS headers
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    // Remove potentially problematic headers
    newHeaders.delete('Content-Security-Policy');
    newHeaders.delete('X-Frame-Options');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    const errorMessage = error.name === 'AbortError'
      ? 'Request timeout'
      : 'Failed to fetch URL';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Worker entry point
 */
export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Only allow GET and HEAD requests
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'GET, HEAD, OPTIONS',
        },
      });
    }

    return handleRequest(request);
  },
};
