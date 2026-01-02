/**
 * @file LegalDocumentModal Tests
 * @description Tests for the legal document modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LegalDocumentModal } from "./LegalDocumentModal";

// Mock react-markdown
vi.mock("react-markdown", () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

// Mock remark-gfm
vi.mock("remark-gfm", () => ({
  default: () => {},
}));

describe("LegalDocumentModal", () => {
  let mockOnClose;
  let originalFetch;

  beforeEach(() => {
    mockOnClose = vi.fn();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render modal with title", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test Document"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    });

    it("should render modal overlay", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Test"
          onClose={mockOnClose}
        />,
      );

      expect(document.querySelector(".modal-overlay")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "legal-modal-title");
    });

    it("should render close button with aria-label", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

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

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Loading document...")).toBeInTheDocument();
    });

    it("should hide loading state after document loads", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test Document Content"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading document..."),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("document loading", () => {
    it("should fetch document from correct path", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Document"),
      });

      render(
        <LegalDocumentModal
          documentPath="docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("docs/privacy.md"),
        );
      });
    });

    it("should render markdown content after loading", async () => {
      const documentContent = "# Privacy Policy\n\nThis is our privacy policy.";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(documentContent),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("markdown")).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("should show error when fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it("should show error when response is not ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load document: 404/),
        ).toBeInTheDocument();
      });
    });

    it("should show error button that closes modal", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        const closeButton = screen.getAllByText("Close")[0];
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should handle non-Error exceptions", async () => {
      global.fetch = vi.fn().mockRejectedValue("String error");

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
      });
    });
  });

  describe("close functionality", () => {
    it("should call onClose when close button is clicked", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: "Close Privacy Policy",
        });
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when footer close button is clicked", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Loading document..."),
        ).not.toBeInTheDocument();
      });

      // Get the footer Close button (primary variant)
      const footerCloseButton = screen.getByRole("button", { name: "Close" });
      fireEvent.click(footerCloseButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when overlay is clicked", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      const overlay = document.querySelector(".modal-overlay");
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when modal content is clicked", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      const modal = document.querySelector(".modal");
      fireEvent.click(modal);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should call onClose when Escape key is pressed", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose for other keys", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      fireEvent.keyDown(document, { key: "Enter" });
      fireEvent.keyDown(document, { key: "Space" });
      fireEvent.keyDown(document, { key: "a" });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("document path changes", () => {
    it("should refetch when document path changes", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# First Document"),
      });

      const { rerender } = render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      global.fetch.mockResolvedValue({
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
    it("should remove event listener on unmount", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve("# Test"),
      });

      const { unmount } = render(
        <LegalDocumentModal
          documentPath="/docs/privacy.md"
          title="Privacy Policy"
          onClose={mockOnClose}
        />,
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
