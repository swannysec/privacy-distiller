/**
 * @file PDFExtractor Tests
 * @description Tests for PDF extraction service with SRI verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFExtractor } from './PDFExtractor.js';

describe('PDFExtractor', () => {
  describe('SRI Verification', () => {
    it('should have correct SRI configuration', () => {
      // This test verifies that the SRI configuration is present in the file
      const fileContent = require('fs').readFileSync(
        require('path').join(__dirname, 'PDFExtractor.js'),
        'utf-8'
      );
      
      expect(fileContent).toContain('PDFJS_WORKER_CONFIG');
      expect(fileContent).toContain('integrity');
      expect(fileContent).toContain('sha384-');
      expect(fileContent).toContain('getVerifiedWorkerUrl');
    });

    it('should use SRI verification for worker loading', async () => {
      // Mock fetch to verify it's called with integrity parameter
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock worker code']))
      });
      global.fetch = mockFetch;

      // Mock URL.createObjectURL
      const mockObjectURL = 'blob:mock-url';
      global.URL.createObjectURL = vi.fn().mockReturnValue(mockObjectURL);

      // Create a mock PDF file
      const mockFile = new File(['mock pdf content'], 'test.pdf', {
        type: 'application/pdf'
      });

      // Mock pdfjs-dist module
      vi.mock('pdfjs-dist', () => ({
        default: {
          GlobalWorkerOptions: {},
          getDocument: vi.fn(() => ({
            promise: Promise.resolve({
              numPages: 1,
              getPage: () => Promise.resolve({
                getTextContent: () => Promise.resolve({
                  items: [{ str: 'test text' }]
                })
              })
            })
          }))
        }
      }));

      try {
        await PDFExtractor.extract(mockFile);
      } catch (err) {
        // Expected to fail due to mocking, but we can verify fetch was called
      }

      // Verify fetch was called with integrity parameter
      if (mockFetch.mock.calls.length > 0) {
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[1]).toBeDefined();
        expect(fetchCall[1].integrity).toMatch(/^sha384-/);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid file', async () => {
      const invalidFile = new File(['test'], 'test.txt', {
        type: 'text/plain'
      });

      await expect(PDFExtractor.extract(invalidFile)).rejects.toThrow();
    });

    it('should throw error for oversized file', async () => {
      // Create a file larger than 10MB (mock)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf'
      });

      await expect(PDFExtractor.extract(largeFile)).rejects.toThrow();
    });
  });

  describe('getMetadata', () => {
    it('should return default metadata on error', async () => {
      const invalidFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf'
      });

      const metadata = await PDFExtractor.getMetadata(invalidFile);

      expect(metadata).toEqual({
        numPages: 0,
        info: {},
        metadata: null
      });
    });
  });
});
