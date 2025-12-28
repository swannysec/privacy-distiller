/**
 * @file Document extraction hook
 * @description Hook for extracting text from URLs and PDF files
 */

import { useState, useCallback } from 'react';
import { validateUrl, validateFile, validateDocumentText } from '../utils/validation.js';
import { ERROR_CODES } from '../utils/constants.js';

/**
 * Hook for document extraction
 * @returns {Object} Document extraction utilities
 */
export function useDocumentExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Extracts text from a URL
   * @param {string} url - URL to fetch
   * @returns {Promise<string>} Extracted text
   */
  const extractFromUrl = useCallback(async (url) => {
    setIsExtracting(true);
    setError(null);

    try {
      // Validate URL
      const validation = validateUrl(url);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      // Fetch URL content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract text from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove script and style tags
      const scripts = doc.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());

      // Get text content
      const text = doc.body.textContent || '';
      const cleanText = text.replace(/\s+/g, ' ').trim();

      // Validate extracted text
      const textValidation = validateDocumentText(cleanText);
      if (!textValidation.valid) {
        throw new Error(textValidation.errors[0].message);
      }

      setIsExtracting(false);
      return cleanText;

    } catch (err) {
      setError(err.message || 'Failed to extract text from URL');
      setIsExtracting(false);
      throw err;
    }
  }, []);

  /**
   * Extracts text from a PDF file
   * @param {File} file - PDF file
   * @returns {Promise<string>} Extracted text
   */
  const extractFromPdf = useCallback(async (file) => {
    setIsExtracting(true);
    setError(null);

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      // Dynamic import of PDF.js
      const pdfjsLib = await import('pdfjs-dist');

      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }

      const cleanText = fullText.replace(/\s+/g, ' ').trim();

      // Validate extracted text
      const textValidation = validateDocumentText(cleanText);
      if (!textValidation.valid) {
        throw new Error(textValidation.errors[0].message);
      }

      setIsExtracting(false);
      return cleanText;

    } catch (err) {
      const errorMessage = err.message || 'Failed to extract text from PDF';
      setError(errorMessage);
      setIsExtracting(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    extractFromUrl,
    extractFromPdf,
    isExtracting,
    error,
    clearError,
  };
}
