/**
 * @file Input validation utilities
 */

import {
  FILE_CONSTRAINTS,
  URL_CONSTRAINTS,
  TEXT_PROCESSING,
  ERROR_CODES,
  ERROR_MESSAGES,
} from "./constants";
import type { ValidationResult, LLMConfig } from '../types';

/**
 * Validates a URL input
 * @param url - URL to validate
 * @returns ValidationResult
 */
export function validateUrl(url: string): ValidationResult {
  const errors = [];

  if (!url || typeof url !== "string") {
    errors.push({
      field: "url",
      message: "URL is required",
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    errors.push({
      field: "url",
      message: "URL cannot be empty",
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  if (trimmedUrl.length > URL_CONSTRAINTS.MAX_LENGTH) {
    errors.push({
      field: "url",
      message: `URL is too long (max ${URL_CONSTRAINTS.MAX_LENGTH} characters)`,
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  let urlObject: URL;
  try {
    urlObject = new URL(trimmedUrl);
  } catch {
    errors.push({
      field: "url",
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_URL],
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  if (!URL_CONSTRAINTS.ALLOWED_PROTOCOLS.includes(urlObject.protocol)) {
    errors.push({
      field: "url",
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_URL],
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  const hostname = urlObject.hostname.toLowerCase();

  // Check blocked domains (localhost, etc.)
  if (
    URL_CONSTRAINTS.BLOCKED_DOMAINS.some((domain) => hostname.includes(domain))
  ) {
    errors.push({
      field: "url",
      message: "Cannot fetch from local or internal URLs",
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  // Check private IP ranges for SSRF protection
  if (
    URL_CONSTRAINTS.PRIVATE_IP_PATTERNS?.some((pattern) =>
      pattern.test(hostname),
    )
  ) {
    errors.push({
      field: "url",
      message: "Cannot fetch from private or internal network addresses",
      code: ERROR_CODES.INVALID_URL,
    });
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validates a file input
 * @param file - File to validate
 * @returns ValidationResult
 */
export function validateFile(file: File): ValidationResult {
  const errors = [];

  if (!file) {
    errors.push({
      field: "file",
      message: "File is required",
      code: ERROR_CODES.INVALID_FILE_TYPE,
    });
    return { valid: false, errors };
  }

  if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
    errors.push({
      field: "file",
      message: ERROR_MESSAGES[ERROR_CODES.FILE_TOO_LARGE],
      code: ERROR_CODES.FILE_TOO_LARGE,
    });
  }

  if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    const hasValidExtension = FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    if (!hasValidExtension) {
      errors.push({
        field: "file",
        message: ERROR_MESSAGES[ERROR_CODES.INVALID_FILE_TYPE],
        code: ERROR_CODES.INVALID_FILE_TYPE,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates PDF file magic bytes (file signature)
 * This is an async function that reads the first bytes of the file
 * to verify it's actually a PDF, not just a renamed file
 * @param file - File to validate
 * @returns Promise<ValidationResult>
 */
export async function validatePdfMagicBytes(file: File): Promise<ValidationResult> {
  const errors = [];

  if (!file) {
    errors.push({
      field: "file",
      message: "File is required",
      code: ERROR_CODES.INVALID_FILE_TYPE,
    });
    return { valid: false, errors };
  }

  try {
    // Read the first 5 bytes of the file
    const headerBytes = await file.slice(0, 5).arrayBuffer();
    const header = new Uint8Array(headerBytes);

    // Check for PDF magic bytes: %PDF-
    const isPdf = FILE_CONSTRAINTS.PDF_MAGIC_BYTES.every(
      (byte, index) => header[index] === byte,
    );

    if (!isPdf) {
      errors.push({
        field: "file",
        message:
          "File does not appear to be a valid PDF (invalid file signature)",
        code: ERROR_CODES.INVALID_FILE_TYPE,
      });
    }
  } catch {
    errors.push({
      field: "file",
      message: "Unable to read file contents",
      code: ERROR_CODES.INVALID_FILE_TYPE,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates extracted document text
 * @param text - Text to validate
 * @returns ValidationResult
 */
export function validateDocumentText(text: string): ValidationResult {
  const errors = [];

  if (!text || typeof text !== "string") {
    errors.push({
      field: "text",
      message: "Document text is required",
      code: ERROR_CODES.DOCUMENT_TOO_SHORT,
    });
    return { valid: false, errors };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < TEXT_PROCESSING.MIN_DOCUMENT_LENGTH) {
    errors.push({
      field: "text",
      message: ERROR_MESSAGES[ERROR_CODES.DOCUMENT_TOO_SHORT],
      code: ERROR_CODES.DOCUMENT_TOO_SHORT,
    });
  }

  if (trimmedText.length > TEXT_PROCESSING.MAX_DOCUMENT_LENGTH) {
    errors.push({
      field: "text",
      message: ERROR_MESSAGES[ERROR_CODES.DOCUMENT_TOO_LONG],
      code: ERROR_CODES.DOCUMENT_TOO_LONG,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates LLM configuration
 * @param config - LLM configuration to validate
 * @returns ValidationResult
 */
export function validateLLMConfig(config: LLMConfig): ValidationResult {
  const errors = [];

  if (!config) {
    errors.push({
      field: "config",
      message: "LLM configuration is required",
      code: ERROR_CODES.INVALID_API_KEY,
    });
    return { valid: false, errors };
  }

  if (!config.provider) {
    errors.push({
      field: "provider",
      message: "LLM provider is required",
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (!config.model) {
    errors.push({
      field: "model",
      message: "Model selection is required",
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (config.provider === "openrouter" && !config.apiKey) {
    errors.push({
      field: "apiKey",
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (!config.baseUrl) {
    errors.push({
      field: "baseUrl",
      message: "Base URL is required",
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (
    typeof config.temperature !== "number" ||
    config.temperature < 0 ||
    config.temperature > 2
  ) {
    errors.push({
      field: "temperature",
      message: "Temperature must be between 0 and 2",
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  if (typeof config.maxTokens !== "number" || config.maxTokens < 1) {
    errors.push({
      field: "maxTokens",
      message: "Max tokens must be greater than 0",
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an API key format (basic check)
 * @param apiKey - API key to validate
 * @returns ValidationResult
 */
export function validateApiKey(apiKey: string): ValidationResult {
  const errors = [];

  if (!apiKey || typeof apiKey !== "string") {
    errors.push({
      field: "apiKey",
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
      code: ERROR_CODES.INVALID_API_KEY,
    });
    return { valid: false, errors };
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey.length === 0) {
    errors.push({
      field: "apiKey",
      message: ERROR_MESSAGES[ERROR_CODES.INVALID_API_KEY],
      code: ERROR_CODES.INVALID_API_KEY,
    });
    return { valid: false, errors };
  }

  if (trimmedKey.length < 10) {
    errors.push({
      field: "apiKey",
      message: "API key appears to be too short",
      code: ERROR_CODES.INVALID_API_KEY,
    });
  }

  return { valid: errors.length === 0, errors };
}
