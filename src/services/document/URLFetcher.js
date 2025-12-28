/**
 * @file URL Fetcher Service
 * @description Service for fetching and extracting text from URLs
 */

import { validateUrl, validateDocumentText } from '../../utils/validation.js';
import { CORS_PROXIES, ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

export class URLFetcher {
  /**
   * Fetches and extracts text from a URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} Extracted text
   */
  static async fetch(url) {
    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      throw new Error(validation.errors[0].message);
    }

    // Try fetching with CORS proxy fallback chain
    let lastError = null;

    for (const proxy of CORS_PROXIES) {
      try {
        const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const text = this.extractTextFromHtml(html);

        // Validate extracted text
        const textValidation = validateDocumentText(text);
        if (!textValidation.valid) {
          throw new Error(textValidation.errors[0].message);
        }

        return text;

      } catch (err) {
        lastError = err;
        // Continue to next proxy
      }
    }

    // All attempts failed
    throw new Error(
      lastError?.message || ERROR_MESSAGES[ERROR_CODES.URL_FETCH_FAILED]
    );
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
