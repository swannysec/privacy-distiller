/**
 * @file PDF Extractor Service
 * @description Service for extracting text from PDF files
 */

import { validateFile, validateDocumentText } from '../../utils/validation.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../../utils/constants.js';

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

      // Set worker source for security isolation
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
