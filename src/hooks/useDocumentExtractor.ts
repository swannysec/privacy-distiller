/**
 * @file Document extraction hook
 * @description Hook for extracting text from URLs and PDF files
 */

import { useState, useCallback } from "react";
import {
  validateFile,
  validateDocumentText,
  validatePdfMagicBytes,
} from "../utils/validation";

/**
 * Return type for useDocumentExtractor hook
 */
export interface UseDocumentExtractorReturn {
  /** Extract text content from a URL */
  extractFromUrl: (url: string) => Promise<string>;
  /** Extract text content from a PDF file */
  extractFromPdf: (file: File) => Promise<string>;
  /** Whether extraction is currently in progress */
  isExtracting: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
}

/**
 * Hook for document extraction
 * @returns Document extraction utilities
 */
export function useDocumentExtractor(): UseDocumentExtractorReturn {
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extracts text from a URL
   * @param url - URL to fetch
   * @returns Extracted text
   */
  const extractFromUrl = useCallback(async (url: string): Promise<string> => {
    setIsExtracting(true);
    setError(null);

    try {
      // Use URLFetcher service which handles CORS proxy fallback
      const { URLFetcher } = await import("../services/document/URLFetcher");
      const text = await URLFetcher.fetch(url);

      setIsExtracting(false);
      return text;
    } catch (err) {
      const errorMessage =
        (err instanceof Error ? err.message : null) ||
        "Failed to extract text from URL";
      setError(errorMessage);
      setIsExtracting(false);
      throw err;
    }
  }, []);

  /**
   * Extracts text from a PDF file
   * @param file - PDF file
   * @returns Extracted text
   */
  const extractFromPdf = useCallback(async (file: File): Promise<string> => {
    setIsExtracting(true);
    setError(null);

    try {
      // Validate file (type, size, extension)
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.errors[0].message);
      }

      // Validate PDF magic bytes (file signature)
      const magicBytesValidation = await validatePdfMagicBytes(file);
      if (!magicBytesValidation.valid) {
        throw new Error(magicBytesValidation.errors[0].message);
      }

      // Dynamic import of PDF.js and worker
      const pdfjsLib = await import("pdfjs-dist");

      // Import worker as raw text and create blob URL
      const workerCode =
        await import("pdfjs-dist/build/pdf.worker.min.mjs?raw");
      const workerBlob = new Blob([workerCode.default], {
        type: "application/javascript",
      });
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Load PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => {
            // Type guard for TextItem which has 'str' property
            if ("str" in item) {
              return item.str;
            }
            return "";
          })
          .join(" ");
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
      const errorMessage =
        (err instanceof Error ? err.message : null) ||
        "Failed to extract text from PDF";
      setError(errorMessage);
      setIsExtracting(false);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Clears error state
   */
  const clearError = useCallback((): void => {
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
