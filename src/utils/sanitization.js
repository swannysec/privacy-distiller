/**
 * @file Content sanitization utilities
 */

import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - DOMPurify options
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html, options = {}) {
  if (!html || typeof html !== "string") {
    return "";
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "div",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "class", "id", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?):\/\/)/i,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(html, mergedOptions);
}

/**
 * Sanitizes text content by removing potentially dangerous characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Apply sanitization in a loop to handle nested bypass attempts
  // e.g., "javajavascript:script:" -> "javascript:" after first pass
  let result = text;
  let previous;
  do {
    previous = result;
    result = result
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/vbscript:/gi, "") // Remove vbscript: protocol
      .replace(/data:/gi, "") // Remove data: protocol
      .replace(/on\w+\s*=/gi, ""); // Remove event handlers
  } while (result !== previous);

  return result.trim();
}

/**
 * Sanitizes a URL to ensure it's safe
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmedUrl = url.trim();

  try {
    const urlObject = new URL(trimmedUrl);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(urlObject.protocol)) {
      return "";
    }

    return urlObject.href;
  } catch {
    return "";
  }
}

/**
 * Sanitizes LLM-generated content for safe display
 * @param {string} content - LLM-generated content
 * @returns {string} Sanitized content
 */
export function sanitizeLLMContent(content) {
  if (!content || typeof content !== "string") {
    return "";
  }

  // First sanitize as HTML (handles any HTML tags the LLM might have generated)
  const sanitizedHtml = sanitizeHtml(content, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });

  return sanitizedHtml;
}

/**
 * Strips all HTML tags from content
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html || typeof html !== "string") {
    return "";
  }

  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitizes file name to prevent path traversal
 * @param {string} fileName - File name to sanitize
 * @returns {string} Sanitized file name
 */
export function sanitizeFileName(fileName) {
  if (!fileName || typeof fileName !== "string") {
    return "unknown";
  }

  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe characters
    .replace(/\.{2,}/g, ".") // Remove multiple dots
    .replace(/^\.+/, "") // Remove leading dots
    .slice(0, 255); // Limit length
}
