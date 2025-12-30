/**
 * @file URL Fetcher Service
 * @description Service for fetching and extracting text from URLs
 */

import { validateUrl, validateDocumentText } from '../../utils/validation.js';
import { CORS_PROXIES, CLOUDFLARE_WORKER_URL, ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

/**
 * Known CORS-blocked domains that should skip direct fetch
 * These sites consistently block browser requests
 */
const CORS_BLOCKED_DOMAINS = [
  'google.com',
  'policies.google.com',
  'apple.com',
  'microsoft.com',
  'facebook.com',
  'meta.com',
  'amazon.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'netflix.com',
  'spotify.com',
];

/**
 * Fast timeout for direct fetch attempts (2 seconds)
 */
const DIRECT_FETCH_TIMEOUT = 2000;

export class URLFetcher {
  /**
   * Fetches and extracts text from a URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} Extracted text
   */
  static async fetch(url, maxRedirects = 3) {
    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      throw new Error(validation.errors[0].message);
    }

    let currentUrl = url;
    let redirectCount = 0;

    while (redirectCount < maxRedirects) {
      let result;
      try {
        result = await this._fetchWithProxies(currentUrl);
      } catch (err) {
        throw err;
      }

      // Check for meta refresh redirect
      const redirectUrl = this._detectMetaRefreshRedirect(result.html);

      if (redirectUrl && redirectUrl !== currentUrl) {
        currentUrl = redirectUrl;
        redirectCount++;
        continue;
      }

      // No redirect, validate and return text
      const text = this.extractTextFromHtml(result.html);

      const textValidation = validateDocumentText(text);
      if (!textValidation.valid) {
        throw new Error(textValidation.errors[0].message);
      }

      return text;
    }

    throw new Error('Too many redirects');
  }

  /**
   * Check if a URL is from a known CORS-blocked domain
   * @param {string} url - URL to check
   * @returns {boolean} True if domain is known to block CORS
   * @private
   */
  static _isKnownCorsBlockedDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return CORS_BLOCKED_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetches URL content using parallel fetch strategy with race condition
   * Direct fetch and proxies race simultaneously for fastest response
   * @param {string} url - URL to fetch
   * @returns {Promise<{html: string}>} Fetched HTML content
   * @private
   */
  static async _fetchWithProxies(url) {
    const abortController = new AbortController();
    const fetchPromises = [];

    // Skip direct fetch for known CORS-blocked domains
    const skipDirectFetch = this._isKnownCorsBlockedDomain(url);

    if (!skipDirectFetch) {
      // Direct fetch with fast timeout
      const directFetchPromise = new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Direct fetch timeout'));
        }, DIRECT_FETCH_TIMEOUT);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml',
            },
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const html = await response.text();
          resolve({ html, source: 'direct' });
        } catch (err) {
          clearTimeout(timeoutId);
          reject(err);
        }
      });

      fetchPromises.push(directFetchPromise);
    }

    // Add proxy fetch promises (Cloudflare Worker only - no third-party proxies)
    for (const proxy of CORS_PROXIES) {
      if (!proxy) continue; // Skip empty proxy (direct fetch already handled)

      const proxyPromise = (async () => {
        try {
          // Cloudflare Worker uses ?url= parameter format
          const fetchUrl = `${proxy}${encodeURIComponent(url)}`;
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml',
            },
            signal: abortController.signal,
          });

          if (!response.ok) {
            // Parse error response from Worker
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const html = await response.text();
          return { html, source: 'cloudflare-worker' };
        } catch (err) {
          throw err;
        }
      })();

      fetchPromises.push(proxyPromise);
    }

    try {
      // Race all fetch methods - first success wins
      const result = await Promise.any(fetchPromises);

      // Cancel remaining requests
      abortController.abort();

      return { html: result.html };
    } catch (aggregateError) {
      // All fetches failed
      const errors = aggregateError.errors || [];
      const lastError = errors[errors.length - 1];
      throw new Error(
        lastError?.message || ERROR_MESSAGES[ERROR_CODES.URL_FETCH_FAILED]
      );
    }
  }

  /**
   * Detects meta refresh redirect in HTML
   * @param {string} html - HTML content
   * @returns {string|null} Redirect URL or null if no redirect
   * @private
   */
  static _detectMetaRefreshRedirect(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for meta refresh tag
    const metaRefresh = doc.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      const content = metaRefresh.getAttribute('content') || '';
      // Parse "0; URL=https://..." or "0;URL=https://..." format
      const match = content.match(/URL=["']?([^"'\s>]+)/i);
      if (match) {
        return match[1];
      }
    }

    // Check for noscript meta refresh (common pattern)
    const noscript = doc.querySelector('noscript');
    if (noscript) {
      const noscriptMeta = noscript.querySelector('meta[http-equiv="refresh"]');
      if (noscriptMeta) {
        const content = noscriptMeta.getAttribute('content') || '';
        const match = content.match(/URL=["']?([^"'\s>]+)/i);
        if (match) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Extracts text content from HTML
   * @param {string} html - HTML content
   * @returns {string} Extracted text
   */
  static extractTextFromHtml(html) {
    // Create DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'nav',
      'header',
      'footer',
      'aside',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
    ];

    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Get text content from body
    const text = doc.body.textContent || '';

    // Clean up text
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return cleanText;
  }

  /**
   * Gets page metadata
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} Page metadata
   */
  static async getMetadata(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      return {
        title: doc.querySelector('title')?.textContent || '',
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
        author: doc.querySelector('meta[name="author"]')?.getAttribute('content') || '',
      };
    } catch {
      return {
        title: '',
        description: '',
        keywords: '',
        author: '',
      };
    }
  }
}
