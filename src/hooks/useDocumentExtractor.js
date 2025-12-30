/**
 * @file Document extraction hook
 * @description Hook for extracting text from URLs and PDF files
 */

import { useState, useCallback } from "react";
import { validateFile, validateDocumentText } from "../utils/validation.js";

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
      // Use URLFetcher service which handles CORS proxy fallback
      const { URLFetcher } = await import("../services/document/URLFetcher.js");
      const text = await URLFetcher.fetch(url);

      setIsExtracting(false);
      return text;
    } catch (err) {
      setError(err.message || "Failed to extract text from URL");
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
      const pdfjsLib = await import("pdfjs-dist");

      // Use worker from public folder (copied from node_modules/pdfjs-dist/build/)
      // This avoids CDN version mismatch issues
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + " ";
      }

      const cleanText = fullText.replace(/\s+/g, " ").trim();

      // Validate extracted text
      const textValidation = validateDocumentText(cleanText);
      if (!textValidation.valid) {
        throw new Error(textValidation.errors[0].message);
      }

      setIsExtracting(false);
      return cleanText;
    } catch (err) {
      const errorMessage = err.message || "Failed to extract text from PDF";
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
