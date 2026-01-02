import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileUpload } from "./FileUpload";
import * as formatting from "../../utils/formatting";

// Mock formatFileSize
vi.mock("../../utils/formatting", () => ({
  formatFileSize: vi.fn((size: number) => {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${size} B`;
  }),
}));

// Mock FILE_CONSTRAINTS
vi.mock("../../utils/constants", () => ({
  FILE_CONSTRAINTS: {
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    MAX_SIZE_MB: 10,
    ALLOWED_TYPES: ["application/pdf"],
    ALLOWED_EXTENSIONS: [".pdf"],
  },
}));

// Mock Button component
vi.mock("../Common", () => ({
  Button: ({ children, onClick, disabled, ariaLabel }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; ariaLabel?: string }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

describe("FileUpload", () => {
  let mockOnFileSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnFileSelect = vi.fn();
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dropzone", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(
        screen.getByRole("button", { name: "File upload dropzone" }),
      ).toBeInTheDocument();
    });

    it("should render file input", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const fileInput = screen.getByLabelText("Choose PDF file");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("type", "file");
    });

    it("should render prompt text", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText(/Drop a PDF here/)).toBeInTheDocument();
    });

    it("should render browse button", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText("browse files")).toBeInTheDocument();
    });

    it("should render requirements hint", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText(/PDF format only/)).toBeInTheDocument();
      expect(screen.getByText(/Text-based PDF/)).toBeInTheDocument();
    });

    it("should display max file size", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      // Mock formatFileSize uses .toFixed(2) for MB, so displays "10.00 MB"
      const elements = screen.getAllByText(/10\.00 MB/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe("file input", () => {
    it("should accept PDF files", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      expect(input).toHaveAttribute("accept", ".pdf,application/pdf");
    });

    it("should call onFileSelect when file is selected", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it("should update state with selected file", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText("document.pdf")).toBeInTheDocument();
    });

    it("should not call onFileSelect when no file selected", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");

      fireEvent.change(input, { target: { files: [] } });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe("browse button", () => {
    it("should trigger file input when clicked", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const browseButton = screen.getByText("browse files");
      const fileInput = screen.getByLabelText("Choose PDF file");

      const clickSpy = vi.spyOn(fileInput, "click");

      fireEvent.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it("should be disabled when component is disabled", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} disabled />);
      const browseButton = screen.getByText("browse files");
      expect(browseButton).toBeDisabled();
    });
  });

  describe("drag and drop", () => {
    it("should handle drag over", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");

      fireEvent.dragOver(dropzone!);

      expect(dropzone?.className).toContain("upload-zone--dragging");
    });

    it("should handle drag leave", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");

      fireEvent.dragOver(dropzone!);
      fireEvent.dragLeave(dropzone!);

      expect(dropzone?.className).not.toContain("upload-zone--dragging");
    });

    it("should handle file drop", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");
      const file = new File(["content"], "dropped.pdf", {
        type: "application/pdf",
      });

      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it("should only accept PDF files on drop", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");
      const file = new File(["content"], "document.txt", {
        type: "text/plain",
      });

      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it("should clear dragging state on drop", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.dragOver(dropzone!);
      expect(dropzone?.className).toContain("upload-zone--dragging");

      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(dropzone?.className).not.toContain("upload-zone--dragging");
    });

    it("should not accept drops when disabled", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} disabled />,
      );
      const dropzone = container.querySelector(".upload-zone");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.drop(dropzone!, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it("should not set dragging state when disabled", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} disabled />,
      );
      const dropzone = container.querySelector(".upload-zone");

      fireEvent.dragOver(dropzone!);

      expect(dropzone?.className).not.toContain("upload-zone--dragging");
    });
  });

  describe("selected file display", () => {
    it("should show file name when selected", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "privacy-policy.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText("privacy-policy.pdf")).toBeInTheDocument();
    });

    it("should show file size when selected", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(file, "size", { value: 1024 * 1024 });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText("1.00 MB")).toBeInTheDocument();
    });

    it("should show clear button when file selected", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByLabelText("Clear selected file")).toBeInTheDocument();
    });

    it("should apply has-file class when file selected", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const dropzone = container.querySelector(".upload-zone");
      expect(dropzone?.className).toContain("upload-zone--has-file");
    });
  });

  describe("clear functionality", () => {
    it("should clear selected file", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByText("test.pdf")).toBeInTheDocument();

      const clearButton = screen.getByLabelText("Clear selected file");
      fireEvent.click(clearButton);

      expect(screen.queryByText("test.pdf")).not.toBeInTheDocument();
    });

    it("should reset file input value", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file") as HTMLInputElement;
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const clearButton = screen.getByLabelText("Clear selected file");
      fireEvent.click(clearButton);

      expect(input.value).toBe("");
    });

    it("should show upload prompt after clearing", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const clearButton = screen.getByLabelText("Clear selected file");
      fireEvent.click(clearButton);

      expect(screen.getByText(/Drop a PDF here/)).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("should disable file input when disabled", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} disabled />);
      const input = screen.getByLabelText("Choose PDF file");
      expect(input).toBeDisabled();
    });

    it("should apply disabled class to dropzone", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} disabled />,
      );
      const dropzone = container.querySelector(".upload-zone");
      expect(dropzone?.className).toContain("upload-zone--disabled");
    });

    it("should disable clear button when disabled", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} disabled />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const clearButton = screen.getByLabelText("Clear selected file");
      expect(clearButton).toBeDisabled();
    });

    it("should set tabindex -1 when disabled", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} disabled />,
      );
      const dropzone = container.querySelector(".upload-zone");
      expect(dropzone).toHaveAttribute("tabIndex", "-1");
    });

    it("should set tabindex 0 when enabled", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");
      expect(dropzone).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("error display", () => {
    it("should display error message", () => {
      render(
        <FileUpload onFileSelect={mockOnFileSelect} error="File too large" />,
      );
      expect(screen.getByRole("alert")).toHaveTextContent("File too large");
    });

    it("should not display error when null", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} error={null} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should apply error class to dropzone", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} error="Error" />,
      );
      const dropzone = container.querySelector(".upload-zone");
      expect(dropzone?.className).toContain("upload-zone--error");
    });

    it("should show error icon", () => {
      render(
        <FileUpload onFileSelect={mockOnFileSelect} error="Error message" />,
      );
      const errorDiv = screen.getByRole("alert");
      expect(errorDiv.textContent).toContain("⚠️");
    });

    it("should have aria-live polite on error", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} error="Error" />);
      const errorDiv = screen.getByRole("alert");
      expect(errorDiv).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("className prop", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} className="custom-class" />,
      );
      const fileUpload = container.querySelector(".file-upload");
      expect(fileUpload?.className).toContain("custom-class");
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA label for dropzone", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(
        screen.getByRole("button", { name: "File upload dropzone" }),
      ).toBeInTheDocument();
    });

    it("should have describedby for dropzone", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const dropzone = container.querySelector(".upload-zone");
      expect(dropzone).toHaveAttribute(
        "aria-describedby",
        "file-upload-description",
      );
    });

    it("should have id on description", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const description = screen.getByText(/Maximum file size:/);
      expect(description).toHaveAttribute("id", "file-upload-description");
    });

    it("should have aria-label on file input", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      expect(input).toHaveAttribute("aria-label", "Choose PDF file");
    });

    it("should hide icons from screen readers", () => {
      const { container } = render(
        <FileUpload onFileSelect={mockOnFileSelect} />,
      );
      const icon = container.querySelector(".upload-zone__icon");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("file size formatting", () => {
    it("should format file sizes correctly", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["x".repeat(5 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText("5.00 MB")).toBeInTheDocument();
    });

    it("should call formatFileSize utility", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(formatting.formatFileSize).toHaveBeenCalled();
    });
  });

  describe("component structure", () => {
    it("should have hidden file input", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      const input = screen.getByLabelText("Choose PDF file");
      expect(input.className).toContain("upload-zone__input");
    });

    it("should render requirements hint text", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText(/PDF format only/)).toBeInTheDocument();
      expect(screen.getByText(/scanned images not supported/)).toBeInTheDocument();
    });

    it("should switch between prompt and selected views", () => {
      render(<FileUpload onFileSelect={mockOnFileSelect} />);

      // Initial state - prompt
      expect(screen.getByText(/Drop a PDF here/)).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Clear selected file"),
      ).not.toBeInTheDocument();

      // After file selection
      const input = screen.getByLabelText("Choose PDF file");
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.queryByText(/Drop a PDF here/)).not.toBeInTheDocument();
      expect(screen.getByLabelText("Clear selected file")).toBeInTheDocument();
    });
  });
});
