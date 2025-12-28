/**
 * @file Input validation utilities
 */

import {
  FILE_CONSTRAINTS,
  URL_CONSTRAINTS,
  TEXT_PROCESSING,
  ERROR_CODES,
  ERROR_MESSAGES,
} from './constants.js';

/**
 * Validates a URL input
 * @param {string} url - URL to validate
 * @returns {import('../types').ValidationResult}
 */
export function validateUrl(url) {
  const errors = [];

  if (!url || typeof url !== 'string') {
    errors.push({
      field: 'url',
      message: 'URL is required',
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    errors.push({
      field: 'url',
      message: 'URL cannot be empty',
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  if (trimmedUrl.length > URL_CONSTRAINTS.MAX_LENGTH) {
    errors.push({
      field: 'url',
      message: `URL is too long (max ${URL_CONSTRAINTS.MAX_LENGTH} characters)`,
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  let urlObject;
  try {
    urlObject = new URL(trimmedUrl);
  } catch {
    errors.push({
      field: 'url',
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_URL],
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  if (!URL_CONSTRAINTS.ALLOWED_PROTOCOLS.includes(urlObject.protocol)) {
    errors.push({
      field: 'url',
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_URL],
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  const hostname = urlObject.hostname.toLowerCase();
  if (URL_CONSTRAINTS.BLOCKED_DOMAINS.some((domain) => hostname.includes(domain))) {
    errors.push({
      field: 'url',
      message: 'Cannot fetch from local or internal URLs',
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validates a file input
 * @param {File} file - File to validate
 * @returns {import('../types').ValidationResult}
 */
export function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push({
      field: 'file',
      message: 'File is required',
      code: ERROR_CODES.INVALID_FILE_TYPE,
    });
    return { valid: false, errors };
  }

  if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
    errors.push({
      field: 'file',
      message: ERROR_MESSAGES[ERROR_CODES.FILE_TOO_LARGE],
      code: ERROR_CODES.FILE_TOO_LARGE,
    });
  }

  if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    const hasValidExtension = FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      errors.push({
        field: 'file',
        message: ERROR_MESSAGES[ERROR_CODES.INVALID_FILE_TYPE],
        code: ERROR_CODES.INVALID_FILE_TYPE,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates extracted document text
 * @param {string} text - Text to validate
 * @returns {import('../types').ValidationResult}
 */
export function validateDocumentText(text) {
  const errors = [];

  if (!text || typeof text !== 'string') {
    errors.push({
      field: 'text',
      message: 'Document text is required',
      code: ERROR_CODES.DOCUMENT_TOO_SHORT,
    });
    return { valid: false, errors };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < TEXT_PROCESSING.MIN_DOCUMENT_LENGTH) {
    errors.push({
      field: 'text',
      message: ERROR_MESSAGES[ERROR_CODES.DOCUMENT_TOO_SHORT],
      code: ERROR_CODES.DOCUMENT_TOO_SHORT,
    });
  }

  if (trimmedText.length > TEXT_PROCESSING.MAX_DOCUMENT_LENGTH) {
    errors.push({
      field: 'text',
      message: ERROR_MESSAGES[ERROR_CODES.DOCUMENT_TOO_LONG],
      code: ERROR_CODES.DOCUMENT_TOO_LONG,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates LLM configuration
 * @param {import('../types').LLMConfig} config - LLM configuration to validate
 * @returns {import('../types').ValidationResult}
 */
export function validateLLMConfig(config) {
  const errors = [];

  if (!config) {
    errors.push({
      field: 'config',
      message: 'LLM configuration is required',
      code: ERROR_CODES.INVALID_API_KEY,
    });
    return { valid: false, errors };
  }

  if (!config.provider) {
    errors.push({
      field: 'provider',
      message: 'LLM provider is required',
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (!config.model) {
    errors.push({
      field: 'model',
      message: 'Model selection is required',
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (config.provider === 'openrouter' && !config.apiKey) {
    errors.push({
      field: 'apiKey',
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (!config.baseUrl) {
    errors.push({
      field: 'baseUrl',
      message: 'Base URL is required',
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 1) {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be between 0 and 1',
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (typeof config.maxTokens !== 'number' || config.maxTokens < 1) {
    errors.push({
      field: 'maxTokens',
      message: 'Max tokens must be greater than 0',
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an API key format (basic check)
 * @param {string} apiKey - API key to validate
 * @returns {import('../types').ValidationResult}
 */
export function validateApiKey(apiKey) {
  const errors = [];

  if (!apiKey || typeof apiKey !== 'string') {
    errors.push({
      field: 'apiKey',
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
      code: ERROR_CODES.INVALID_API_KEY,
    });
    return { valid: false, errors };
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey.length === 0) {
    errors.push({
      field: 'apiKey',
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
      code: ERROR_CODES.INVALID_API_KEY,
    });
    return { valid: false, errors };
  }

  if (trimmedKey.length < 10) {
    errors.push({
      field: 'apiKey',
      message: 'API key appears to be too short',
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  return { valid: errors.length === 0, errors };
}
