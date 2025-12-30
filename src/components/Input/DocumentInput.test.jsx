import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentInput } from "./DocumentInput";
import * as validation from "../../utils/validation";

// Mock child components
vi.mock("./URLInput", () => ({
  URLInput: ({ onSubmit, disabled, error }) => (
    <div data-testid="url-input">
      <input
        data-testid="url-input-field"
        disabled={disabled}
        onChange={(e) => onSubmit && onSubmit(e.target.value)}
      />
      {error && <div data-testid="url-input-error">{error}</div>}
    </div>
  ),
}));

vi.mock("./FileUpload", () => ({
  FileUpload: ({ onFileSelect, disabled, error }) => (
    <div data-testid="file-upload">
      <button
        data-testid="file-select-button"
        disabled={disabled}
        onClick={() => {
          const file = new File(["content"], "test.pdf", {
            type: "application/pdf",
          });
          onFileSelect && onFileSelect(file);
        }}
      >
        Select File
      </button>
      {error && <div data-testid="file-upload-error">{error}</div>}
    </div>
  ),
}));

describe("DocumentInput", () => {
  let mockOnDocumentSelected;

  beforeEach(() => {
    mockOnDocumentSelected = vi.fn();
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render with Card wrapper", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);
      expect(screen.getByText("Analyze a Privacy Policy")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Paste a URL or upload a PDF document to get started",
        ),
      ).toBeInTheDocument();
    });

    it("should render mode toggle buttons", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);
      expect(screen.getByRole("tab", { name: /URL/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /PDF Upload/i }),
      ).toBeInTheDocument();
    });

    it("should have tablist role for accessibility", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);
      const tablist = screen.getByRole("tablist", {
        name: "Document input method",
      });
      expect(tablist).toBeInTheDocument();
    });

    it("should default to URL mode", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);
      const urlTab = screen.getByRole("tab", { name: /URL/i });
      expect(urlTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("mode switching", () => {
    it("should render URL input in URL mode", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);
      expect(screen.getByTestId("url-input")).toBeInTheDocument();
      expect(screen.queryByTestId("file-upload")).not.toBeInTheDocument();
    });

    it("should switch to file mode", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      expect(screen.getByTestId("file-upload")).toBeInTheDocument();
      expect(screen.queryByTestId("url-input")).not.toBeInTheDocument();
    });

    it("should update aria-selected when switching modes", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlTab = screen.getByRole("tab", { name: /URL/i });
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });

      expect(urlTab).toHaveAttribute("aria-selected", "true");
      expect(fileTab).toHaveAttribute("aria-selected", "false");

      fireEvent.click(fileTab);

      expect(urlTab).toHaveAttribute("aria-selected", "false");
      expect(fileTab).toHaveAttribute("aria-selected", "true");
    });

    it("should clear errors when switching modes", () => {
      vi.spyOn(validation, "validateUrl").mockReturnValue({
        valid: false,
        errors: [{ message: "Invalid URL" }],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      // Trigger error in URL mode
      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, { target: { value: "invalid-url" } });

      // Switch to file mode
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      // Error should be cleared
      expect(screen.queryByTestId("url-input-error")).not.toBeInTheDocument();
    });

    it("should apply active class to selected tab", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlTab = screen.getByRole("tab", { name: /URL/i });
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });

      expect(urlTab.className).toContain("tab--active");
      expect(fileTab.className).not.toContain("tab--active");

      fireEvent.click(fileTab);

      expect(urlTab.className).not.toContain("tab--active");
      expect(fileTab.className).toContain("tab--active");
    });
  });

  describe("URL submission", () => {
    it("should validate and submit URL", () => {
      vi.spyOn(validation, "validateUrl").mockReturnValue({
        valid: true,
        errors: [],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, {
        target: { value: "https://example.com/privacy" },
      });

      expect(mockOnDocumentSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "url",
          source: "https://example.com/privacy",
          metadata: expect.objectContaining({
            inputMode: "url",
            timestamp: expect.any(String),
          }),
        }),
      );
    });

    it("should show error for invalid URL", () => {
      vi.spyOn(validation, "validateUrl").mockReturnValue({
        valid: false,
        errors: [{ message: "Invalid URL format" }],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, { target: { value: "not-a-url" } });

      expect(screen.getByTestId("url-input-error")).toHaveTextContent(
        "Invalid URL format",
      );
      expect(mockOnDocumentSelected).not.toHaveBeenCalled();
    });

    it("should handle multiple validation errors", () => {
      vi.spyOn(validation, "validateUrl").mockReturnValue({
        valid: false,
        errors: [
          { message: "Invalid URL format" },
          { message: "Protocol not allowed" },
        ],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, { target: { value: "javascript:alert(1)" } });

      expect(screen.getByTestId("url-input-error")).toHaveTextContent(
        "Invalid URL format, Protocol not allowed",
      );
    });

    it("should clear previous errors on valid submission", () => {
      const validateUrlSpy = vi.spyOn(validation, "validateUrl");

      // First submission - invalid
      validateUrlSpy.mockReturnValueOnce({
        valid: false,
        errors: [{ message: "Invalid URL" }],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, { target: { value: "invalid" } });

      expect(screen.getByTestId("url-input-error")).toBeInTheDocument();

      // Second submission - valid
      validateUrlSpy.mockReturnValueOnce({
        valid: true,
        errors: [],
      });

      fireEvent.change(urlInput, { target: { value: "https://valid.com" } });

      expect(screen.queryByTestId("url-input-error")).not.toBeInTheDocument();
    });
  });

  describe("file selection", () => {
    it("should validate and submit file", () => {
      vi.spyOn(validation, "validateFile").mockReturnValue({
        valid: true,
        errors: [],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      // Switch to file mode
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      // Select file
      const fileButton = screen.getByTestId("file-select-button");
      fireEvent.click(fileButton);

      expect(mockOnDocumentSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "file",
          source: expect.any(File),
          metadata: expect.objectContaining({
            inputMode: "file",
            fileName: "test.pdf",
            fileSize: expect.any(Number),
            timestamp: expect.any(String),
          }),
        }),
      );
    });

    it("should show error for invalid file", () => {
      vi.spyOn(validation, "validateFile").mockReturnValue({
        valid: false,
        errors: [{ message: "File too large" }],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      // Switch to file mode
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      // Select file
      const fileButton = screen.getByTestId("file-select-button");
      fireEvent.click(fileButton);

      expect(screen.getByTestId("file-upload-error")).toHaveTextContent(
        "File too large",
      );
      expect(mockOnDocumentSelected).not.toHaveBeenCalled();
    });

    it("should include file metadata in submission", () => {
      vi.spyOn(validation, "validateFile").mockReturnValue({
        valid: true,
        errors: [],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      const fileButton = screen.getByTestId("file-select-button");
      fireEvent.click(fileButton);

      const call = mockOnDocumentSelected.mock.calls[0][0];
      expect(call.metadata).toMatchObject({
        inputMode: "file",
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        timestamp: expect.any(String),
      });
    });
  });

  describe("disabled state", () => {
    it("should disable mode toggle buttons when disabled", () => {
      render(
        <DocumentInput onDocumentSelected={mockOnDocumentSelected} disabled />,
      );

      const urlTab = screen.getByRole("tab", { name: /URL/i });
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });

      expect(urlTab).toBeDisabled();
      expect(fileTab).toBeDisabled();
    });

    it("should pass disabled prop to URLInput", () => {
      render(
        <DocumentInput onDocumentSelected={mockOnDocumentSelected} disabled />,
      );

      const urlInputField = screen.getByTestId("url-input-field");
      expect(urlInputField).toBeDisabled();
    });

    it("should pass disabled prop to FileUpload", () => {
      const { rerender } = render(
        <DocumentInput onDocumentSelected={mockOnDocumentSelected} />,
      );

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      rerender(
        <DocumentInput onDocumentSelected={mockOnDocumentSelected} disabled />,
      );

      const browseButton = screen.getByTestId("file-select-button");
      expect(browseButton).toBeDisabled();
    });

    it("should not switch modes when disabled", () => {
      render(
        <DocumentInput onDocumentSelected={mockOnDocumentSelected} disabled />,
      );

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      // Should still show URL input (mode didn't change)
      expect(screen.getByTestId("url-input")).toBeInTheDocument();
    });
  });

  describe("className prop", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <DocumentInput
          onDocumentSelected={mockOnDocumentSelected}
          className="custom-class"
        />,
      );

      const documentInput = container.querySelector(".document-input");
      expect(documentInput).toBeInTheDocument();
      expect(documentInput.className).toContain("custom-class");
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes for tabs", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlTab = screen.getByRole("tab", { name: /URL/i });
      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });

      expect(urlTab).toHaveAttribute("aria-controls", "tab-url");
      expect(fileTab).toHaveAttribute("aria-controls", "tab-pdf");
    });

    it("should have proper ARIA attributes for tab panels", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const panel = screen.getByRole("tabpanel");
      expect(panel).toHaveAttribute("id", "tab-url");
      expect(panel).toHaveAttribute("role", "tabpanel");
    });

    it("should update tabpanel when switching modes", () => {
      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      const panel = screen.getByRole("tabpanel");
      expect(panel).toHaveAttribute("id", "tab-pdf");
    });
  });

  describe("error propagation", () => {
    it("should pass errors to URLInput", () => {
      vi.spyOn(validation, "validateUrl").mockReturnValue({
        valid: false,
        errors: [{ message: "URL error" }],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, { target: { value: "invalid" } });

      expect(screen.getByTestId("url-input-error")).toHaveTextContent(
        "URL error",
      );
    });

    it("should pass errors to FileUpload", () => {
      vi.spyOn(validation, "validateFile").mockReturnValue({
        valid: false,
        errors: [{ message: "File error" }],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      const fileButton = screen.getByTestId("file-select-button");
      fireEvent.click(fileButton);

      expect(screen.getByTestId("file-upload-error")).toHaveTextContent(
        "File error",
      );
    });
  });

  describe("metadata", () => {
    it("should include timestamp in URL metadata", () => {
      vi.spyOn(validation, "validateUrl").mockReturnValue({
        valid: true,
        errors: [],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const urlInput = screen.getByTestId("url-input-field");
      fireEvent.change(urlInput, { target: { value: "https://example.com" } });

      const call = mockOnDocumentSelected.mock.calls[0][0];
      expect(call.metadata.timestamp).toBeDefined();
      expect(new Date(call.metadata.timestamp)).toBeInstanceOf(Date);
    });

    it("should include timestamp in file metadata", () => {
      vi.spyOn(validation, "validateFile").mockReturnValue({
        valid: true,
        errors: [],
      });

      render(<DocumentInput onDocumentSelected={mockOnDocumentSelected} />);

      const fileTab = screen.getByRole("tab", { name: /PDF Upload/i });
      fireEvent.click(fileTab);

      const fileButton = screen.getByTestId("file-select-button");
      fireEvent.click(fileButton);

      const call = mockOnDocumentSelected.mock.calls[0][0];
      expect(call.metadata.timestamp).toBeDefined();
      expect(new Date(call.metadata.timestamp)).toBeInstanceOf(Date);
    });
  });
});
