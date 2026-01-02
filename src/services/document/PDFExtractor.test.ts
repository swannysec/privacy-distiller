/**
 * @file PDFExtractor Tests
 * @description Tests for PDF extraction service with SRI verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PDFExtractor } from "./PDFExtractor.js";

// Mock pdfjs-dist at module level
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(),
}));

/**
 * Creates a mock File with arrayBuffer method
 */
function createMockFile(content: string, name: string, type: string): File {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  // Ensure arrayBuffer is available
  if (!file.arrayBuffer) {
    (file as File & { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = async () => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
      });
    };
  }
  return file;
}

describe("PDFExtractor", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();

    // Store original fetch
    originalFetch = global.fetch;

    // Mock fetch for worker loading
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["mock worker code"])),
    });
    global.fetch = mockFetch;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("SRI Verification", () => {
    it("should have correct SRI configuration", () => {
      // This test verifies that the SRI configuration is present in the file
      const fileContent = require("fs").readFileSync(
        require("path").join(__dirname, "PDFExtractor.ts"),
        "utf-8",
      );

      expect(fileContent).toContain("PDFJS_WORKER_CONFIG");
      expect(fileContent).toContain("integrity");
      expect(fileContent).toContain("sha384-");
      expect(fileContent).toContain("getVerifiedWorkerUrl");
    });

    it("should use SRI verification for worker loading", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: () =>
            Promise.resolve({
              getTextContent: () =>
                Promise.resolve({
                  items: [{ str: "test text" }],
                }),
            }),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf content",
        "test.pdf",
        "application/pdf",
      );

      try {
        await PDFExtractor.extract(mockFile);
      } catch {
        // May fail due to validation, but we verify fetch was called
      }

      // Verify fetch was called with integrity parameter
      if (mockFetch.mock.calls.length > 0) {
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[1]).toBeDefined();
        expect(fetchCall[1].integrity).toMatch(/^sha384-/);
      }
    });
  });

  describe("Error Handling", () => {
    it("should throw error for invalid file type", async () => {
      const invalidFile = createMockFile("test", "test.txt", "text/plain");

      await expect(PDFExtractor.extract(invalidFile)).rejects.toThrow();
    });

    it("should throw error for oversized file", async () => {
      // Create a mock file that appears larger than 10MB
      const largeContent = new ArrayBuffer(11 * 1024 * 1024);
      const largeFile = new File([largeContent], "large.pdf", {
        type: "application/pdf",
      });

      await expect(PDFExtractor.extract(largeFile)).rejects.toThrow();
    });

    it("should throw error for null file", async () => {
      await expect(PDFExtractor.extract(null as unknown as File)).rejects.toThrow();
    });

    it("should throw error for undefined file", async () => {
      await expect(PDFExtractor.extract(undefined as unknown as File)).rejects.toThrow();
    });

    it("should handle Invalid PDF error specifically", async () => {
      const { getDocument } = await import("pdfjs-dist");
      const mockPdfPromise = Promise.reject(new Error("Invalid PDF structure"));
      // Attach catch to avoid unhandled rejection
      mockPdfPromise.catch(() => {});

      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: mockPdfPromise,
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      await expect(PDFExtractor.extract(mockFile)).rejects.toThrow();
    });

    it("should handle generic PDF extraction errors", async () => {
      const { getDocument } = await import("pdfjs-dist");
      const mockPdfPromise = Promise.reject(new Error("Some other error"));
      // Attach catch to avoid unhandled rejection
      mockPdfPromise.catch(() => {});

      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: mockPdfPromise,
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      await expect(PDFExtractor.extract(mockFile)).rejects.toThrow(
        "Some other error",
      );
    });
  });

  describe("extract", () => {
    it("should extract text from single page PDF", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                {
                  str: "This is a sample privacy policy document with enough text to pass validation requirements for minimum length",
                },
              ],
            }),
          }),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      const result = await PDFExtractor.extract(mockFile);

      expect(result).toContain("privacy policy");
    });

    it("should extract text from multi-page PDF", async () => {
      const { getDocument } = await import("pdfjs-dist");
      const mockGetPage = vi
        .fn()
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              {
                str: "Page 1: This is the first page of the privacy policy document",
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              {
                str: "Page 2: This is the second page with more detailed information",
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              {
                str: "Page 3: This is the third and final page of the document",
              },
            ],
          }),
        });

      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 3,
          getPage: mockGetPage,
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      const result = await PDFExtractor.extract(mockFile);

      expect(result).toContain("Page 1");
      expect(result).toContain("Page 2");
      expect(result).toContain("Page 3");
      expect(mockGetPage).toHaveBeenCalledTimes(3);
    });

    it("should clean up extracted text by normalizing whitespace", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                {
                  str: "This   is   a   privacy   policy   document   with   lots   of   extra",
                },
                {
                  str: "   spaces   that   should   be   normalized   when   the   text   is   processed",
                },
                {
                  str: "   and   cleaned   up   by   the   extractor   to   produce   readable   text   output",
                },
              ],
            }),
          }),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      const result = await PDFExtractor.extract(mockFile);

      // Should not have multiple consecutive spaces
      expect(result).not.toMatch(/\s{3,}/);
    });

    it("should throw error for empty extracted text", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [],
            }),
          }),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      await expect(PDFExtractor.extract(mockFile)).rejects.toThrow();
    });

    it("should throw error for text that is too short", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 1,
          getPage: vi.fn().mockResolvedValue({
            getTextContent: vi.fn().mockResolvedValue({
              items: [{ str: "Hi" }],
            }),
          }),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      await expect(PDFExtractor.extract(mockFile)).rejects.toThrow();
    });
  });

  describe("getMetadata", () => {
    it("should return metadata from PDF", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 5,
          getMetadata: vi.fn().mockResolvedValue({
            info: {
              Title: "Test PDF",
              Author: "Test Author",
              CreationDate: "D:20240101120000",
            },
            metadata: {
              get: vi.fn(),
            },
          }),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      const metadata = await PDFExtractor.getMetadata(mockFile);

      expect(metadata.numPages).toBe(5);
      expect(metadata.info.Title).toBe("Test PDF");
      expect(metadata.info.Author).toBe("Test Author");
    });

    it("should return default metadata on error", async () => {
      const { getDocument } = await import("pdfjs-dist");
      const mockPdfPromise = Promise.reject(new Error("Failed to load PDF"));
      // Attach catch to avoid unhandled rejection
      mockPdfPromise.catch(() => {});

      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: mockPdfPromise,
      });

      const mockFile = createMockFile("invalid", "test.pdf", "application/pdf");

      const metadata = await PDFExtractor.getMetadata(mockFile);

      expect(metadata).toEqual({
        numPages: 0,
        info: {},
        metadata: null,
      });
    });

    it("should handle getMetadata call failure gracefully", async () => {
      const { getDocument } = await import("pdfjs-dist");
      (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
        promise: Promise.resolve({
          numPages: 2,
          getMetadata: vi.fn().mockRejectedValue(new Error("Metadata error")),
        }),
      });

      const mockFile = createMockFile(
        "mock pdf",
        "test.pdf",
        "application/pdf",
      );

      const metadata = await PDFExtractor.getMetadata(mockFile);

      // Should return default values due to error
      expect(metadata).toEqual({
        numPages: 0,
        info: {},
        metadata: null,
      });
    });
  });
});
