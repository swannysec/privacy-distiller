/**
 * @file PDF Extractor Service
 * @description Service for extracting text from PDF files
 */

import { validateFile, validateDocumentText } from '../../utils/validation.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

/**
 * PDF.js worker configuration with SRI verification
 */
const PDFJS_WORKER_CONFIG = {
  version: '5.4.449',
  url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.449/pdf.worker.min.js',
  integrity: 'sha384-ZSs6LKr2GoUPDyHrN+rCQgyHL1yUyok5xMniSrgeRG7rUvA6vTmxronM1eZOfjgz'
};

// Cache for the verified worker blob URL
let workerBlobUrl = null;

/**
 * Fetches and verifies the PDF.js worker script with SRI
 * @returns {Promise<string>} Blob URL of the verified worker script
 */
async function getVerifiedWorkerUrl() {
  // Return cached URL if available
  if (workerBlobUrl) {
    return workerBlobUrl;
  }

  try {
    // Fetch worker script with integrity check
    const response = await fetch(PDFJS_WORKER_CONFIG.url, {
      integrity: PDFJS_WORKER_CONFIG.integrity,
      mode: 'cors',
      cache: 'default'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch worker: ${response.status} ${response.statusText}`);
    }

    // Create blob from verified content
    const blob = await response.blob();
    workerBlobUrl = URL.createObjectURL(blob);
    
    return workerBlobUrl;
  } catch (err) {
    // Log warning and fall back to direct CDN URL (without SRI protection)
    console.warn('Failed to fetch worker with SRI verification:', err.message);
    console.warn('Falling back to direct CDN URL (less secure)');
    return PDFJS_WORKER_CONFIG.url;
  }
}

export class PDFExtractor {
  /**
   * Extracts text from a PDF file
   * @param {File} file - PDF file
   * @returns {Promise<string>} Extracted text
   */
  static async extract(file) {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.errors[0].message);
    }

    try {
      // Dynamic import of PDF.js
      const pdfjsLib = await import('pdfjs-dist');

      // Set worker source with SRI verification
      pdfjsLib.GlobalWorkerOptions.workerSrc = await getVerifiedWorkerUrl();

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      // Extract text from all pages
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items with proper spacing
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');

        fullText += pageText + '\n\n';
      }

      // Clean up text
      const cleanText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      // Validate extracted text
      const textValidation = validateDocumentText(cleanText);
      if (!textValidation.valid) {
        throw new Error(textValidation.errors[0].message);
      }

      return cleanText;

    } catch (err) {
      if (err.message.includes('Invalid PDF')) {
        throw new Error(ERROR_MESSAGES[ERROR_CODES.PDF_EXTRACTION_FAILED]);
      }
      throw new Error(err.message || ERROR_MESSAGES[ERROR_CODES.PDF_EXTRACTION_FAILED]);
    }
  }

  /**
   * Gets PDF metadata
   * @param {File} file - PDF file
   * @returns {Promise<Object>} PDF metadata
   */
  static async getMetadata(file) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = await getVerifiedWorkerUrl();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const metadata = await pdf.getMetadata();

      return {
        numPages: pdf.numPages,
        info: metadata.info,
        metadata: metadata.metadata,
      };
    } catch (err) {
      return {
        numPages: 0,
        info: {},
        metadata: null,
      };
    }
  }
}
