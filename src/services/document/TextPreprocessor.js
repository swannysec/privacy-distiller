/**
 * @file Text Preprocessor Service
 * @description Service for preprocessing extracted text
 */

import { TEXT_PROCESSING } from '../../utils/constants.js';
import { chunk } from '../../utils/helpers.js';

export class TextPreprocessor {
  /**
   * Preprocesses extracted text for LLM analysis
   * @param {string} text - Raw text to preprocess
   * @returns {string} Preprocessed text
   */
  static preprocess(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let processed = text;

    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ');

    // Normalize line breaks
    processed = processed.replace(/\n\s*\n\s*\n+/g, '\n\n');

    // Remove excessive punctuation
    processed = processed.replace(/([.!?])\1+/g, '$1');

    // Trim
    processed = processed.trim();

    return processed;
  }

  /**
   * Chunks text into smaller segments for LLM processing
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Maximum chunk size in characters
   * @param {number} overlap - Overlap between chunks in characters
   * @returns {string[]} Array of text chunks
   */
  static chunkText(text, chunkSize = TEXT_PROCESSING.CHUNK_SIZE, overlap = TEXT_PROCESSING.CHUNK_OVERLAP) {
    if (!text) return [];

    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunkText = text.slice(startIndex, endIndex);

      chunks.push(chunkText);

      // Move to next chunk with overlap
      startIndex = endIndex - overlap;

      // Prevent infinite loop
      if (startIndex + chunkSize >= text.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Extracts sentences from text
   * @param {string} text - Text to extract sentences from
   * @returns {string[]} Array of sentences
   */
  static extractSentences(text) {
    if (!text) return [];

    // Simple sentence splitting (can be improved with NLP)
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences;
  }

  /**
   * Truncates text to a maximum length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncate(text, maxLength = TEXT_PROCESSING.MAX_DOCUMENT_LENGTH) {
    if (!text || text.length <= maxLength) {
      return text;
    }

    // Truncate at sentence boundary if possible
    const truncated = text.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');

    if (lastPeriod > maxLength * 0.8) {
      return truncated.slice(0, lastPeriod + 1);
    }

    return truncated + '...';
  }

  /**
   * Removes common boilerplate text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  static removeBoilerplate(text) {
    if (!text) return '';

    let cleaned = text;

    // Remove common cookie consent messages
    const boilerplatePatterns = [
      /we use cookies.{0,200}?accept/gi,
      /this site uses cookies.{0,200}?agree/gi,
      /by continuing.{0,200}?cookies/gi,
    ];

    boilerplatePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Clean up remaining whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Counts words in text
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   */
  static countWords(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimates reading time
   * @param {string} text - Text to estimate reading time for
   * @param {number} wordsPerMinute - Reading speed (default: 200)
   * @returns {number} Reading time in minutes
   */
  static estimateReadingTime(text, wordsPerMinute = 200) {
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }
}
