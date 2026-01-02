/**
 * @file LegalDocumentModal Tests
 * @description Tests for the legal document modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LegalDocumentModal } from "./LegalDocumentModal";

// Mock react-markdown
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

// Mock remark-gfm
vi.mock("remark-gfm", () => ({
  default: () => {},
}));

describe("LegalDocumentModal", () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let originalFetch: typeof global.fetch;

  // Default props for most tests
  const defaultProps = {
    documentPath: "/docs/privacy.md",
    title: "Privacy Policy",
  };

  /**
   * Creates a mock fetch that resolves with the given content
   */
  function mockFetchSuccess(content = "# Test") {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(content),
    });
  }

  /**
   * Creates a mock fetch that rejects with an error
   */
  function mockFetchError(error: unknown) {
    global.fetch = vi.fn().mockRejectedValue(error);
  }

  /**
   * Creates a mock fetch that returns a non-ok response
   */
  function mockFetchFailure(status: number) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status,
    });
  }

  /**
   * Renders the modal with default props merged with overrides
   */
  function renderModal(propOverrides: Partial<typeof defaultProps> = {}) {
    return render(
      <LegalDocumentModal
        {...defaultProps}
        {...propOverrides}
        onClose={mockOnClose}
      />,
    );
  }

  beforeEach(() => {
    mockOnClose = vi.fn();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render modal with title", () => {
      mockFetchSuccess("# Test Document");
      renderModal();
      expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    });

    it("should render modal overlay", () => {
      mockFetchSuccess();
      renderModal({ title: "Test" });
      expect(document.querySelector(".modal-overlay")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      mockFetchSuccess();
      renderModal();

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "legal-modal-title");
    });

    it("should render close button with aria-label", () => {
      mockFetchSuccess();
      renderModal();

      const closeButton = screen.getByRole("button", {
        name: "Close Privacy Policy",
      });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show loading state initially", () => {
      // Never resolve fetch to keep loading state
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
      renderModal();
      expect(screen.getByText("Loading document...")).toBeInTheDocument();
    });

    it("should hide loading state after document loads", async () => {
      mockFetchSuccess("# Test Document Content");
      renderModal();

      await waitFor(() => {
        expect(
          screen.queryByText("Loading document..."),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("document loading", () => {
    it("should fetch document from correct path", async () => {
      mockFetchSuccess("# Document");
      renderModal({ documentPath: "docs/privacy.md" });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("docs/privacy.md"),
        );
      });
    });

    it("should render markdown content after loading", async () => {
      mockFetchSuccess("# Privacy Policy\n\nThis is our privacy policy.");
      renderModal();

      await waitFor(() => {
        expect(screen.getByTestId("markdown")).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should show error when fetch fails", async () => {
      mockFetchError(new Error("Network error"));
      renderModal();

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it("should show error when response is not ok", async () => {
      mockFetchFailure(404);
      renderModal();

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load document: 404/),
        ).toBeInTheDocument();
      });
    });

    it("should show error button that closes modal", async () => {
      mockFetchError(new Error("Network error"));
      renderModal();

      await waitFor(() => {
        const closeButton = screen.getAllByText("Close")[0];
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", async () => {
      mockFetchError("String error");
      renderModal();

      await waitFor(() => {
        expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
      });
    });
  });

  describe("close functionality", () => {
    it("should call onClose when close button is clicked", async () => {
      mockFetchSuccess();
      renderModal();

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: "Close Privacy Policy",
        });
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when footer close button is clicked", async () => {
      mockFetchSuccess();
      renderModal();

      await waitFor(() => {
        expect(
          screen.queryByText("Loading document..."),
        ).not.toBeInTheDocument();
      });

      const footerCloseButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(footerCloseButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when overlay is clicked", () => {
      mockFetchSuccess();
      renderModal();

      const overlay = document.querySelector(".modal-overlay");
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when modal content is clicked", () => {
      mockFetchSuccess();
      renderModal();

      const modal = document.querySelector(".modal");
      fireEvent.click(modal!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should call onClose when Escape key is pressed", () => {
      mockFetchSuccess();
      renderModal();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose for other keys", () => {
      mockFetchSuccess();
      renderModal();

      fireEvent.keyDown(document, { key: "Enter" });
      fireEvent.keyDown(document, { key: "Space" });
      fireEvent.keyDown(document, { key: "a" });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("document path changes", () => {
    it("should refetch when document path changes", async () => {
      mockFetchSuccess("# First Document");

      const { rerender } = renderModal();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Second Document"),
      });

      rerender(
        <LegalDocumentModal
          documentPath="/docs/terms.md"
          title="Terms of Service"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("cleanup", () => {
    it("should remove event listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      mockFetchSuccess();

      const { unmount } = renderModal();
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
