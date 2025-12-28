import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("rendering", () => {
    it("should render spinner", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
    });

    it("should have loading-spinner class", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner.className).toContain("loading-spinner");
    });

    it("should render spinner circle", () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector(".spinner__circle");
      expect(circle).toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("should apply medium size by default", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".spinner");
      expect(spinner.className).toContain("spinner--medium");
    });

    it("should apply small size", () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const spinner = container.querySelector(".spinner");
      expect(spinner.className).toContain("spinner--small");
    });

    it("should apply large size", () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const spinner = container.querySelector(".spinner");
      expect(spinner.className).toContain("spinner--large");
    });
  });

  describe("message prop", () => {
    it("should render without message by default", () => {
      const { container } = render(<LoadingSpinner />);
      expect(
        container.querySelector(".loading-spinner__message"),
      ).not.toBeInTheDocument();
    });

    it("should render with message", () => {
      render(<LoadingSpinner message="Loading data..." />);
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });

    it("should render message in paragraph element", () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);
      const message = container.querySelector(".loading-spinner__message");
      expect(message.tagName).toBe("P");
    });

    it("should apply loading-spinner__message class to message", () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);
      const message = container.querySelector(".loading-spinner__message");
      expect(message).toHaveClass("loading-spinner__message");
    });
  });

  describe("accessibility", () => {
    it("should have role status", () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole("status");
      expect(spinner).toBeInTheDocument();
    });

    it("should have sr-only loading text", () => {
      const { container } = render(<LoadingSpinner />);
      const srText = container.querySelector(".sr-only");
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveTextContent("Loading...");
    });

    it("should hide spinner visual from screen readers", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".spinner");
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });

    it("should provide accessible loading announcement", () => {
      render(<LoadingSpinner />);
      const announcement = screen.getByText("Loading...");
      expect(announcement).toBeInTheDocument();
    });
  });

  describe("component structure", () => {
    it("should have correct structure without message", () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.querySelector(".loading-spinner");
      const spinner = wrapper.querySelector(".spinner");
      const srOnly = wrapper.querySelector(".sr-only");

      expect(wrapper.children).toHaveLength(2);
      expect(wrapper.children[0]).toBe(spinner);
      expect(wrapper.children[1]).toBe(srOnly);
    });

    it("should have correct structure with message", () => {
      const { container } = render(
        <LoadingSpinner message="Loading data..." />,
      );
      const wrapper = container.querySelector(".loading-spinner");
      const spinner = wrapper.querySelector(".spinner");
      const message = wrapper.querySelector(".loading-spinner__message");
      const srOnly = wrapper.querySelector(".sr-only");

      expect(wrapper.children).toHaveLength(3);
      expect(wrapper.children[0]).toBe(spinner);
      expect(wrapper.children[1]).toBe(message);
      expect(wrapper.children[2]).toBe(srOnly);
    });

    it("should nest spinner circle inside spinner", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".spinner");
      const circle = container.querySelector(".spinner__circle");

      expect(spinner).toContainElement(circle);
      expect(spinner.children).toHaveLength(1);
      expect(spinner.children[0]).toBe(circle);
    });
  });

  describe("combined props", () => {
    it("should handle size and message together", () => {
      const { container } = render(
        <LoadingSpinner size="large" message="Please wait..." />,
      );
      const spinner = container.querySelector(".spinner");
      expect(spinner.className).toContain("spinner--large");
      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });

    it("should render with all size variants and messages", () => {
      const { rerender } = render(
        <LoadingSpinner size="small" message="Small" />,
      );
      expect(screen.getByText("Small")).toBeInTheDocument();

      rerender(<LoadingSpinner size="medium" message="Medium" />);
      expect(screen.getByText("Medium")).toBeInTheDocument();

      rerender(<LoadingSpinner size="large" message="Large" />);
      expect(screen.getByText("Large")).toBeInTheDocument();
    });
  });

  describe("visual elements", () => {
    it("should render spinner with base class", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner.className).toContain("spinner");
    });

    it("should render spinner circle element", () => {
      const { container } = render(<LoadingSpinner />);
      const circle = container.querySelector(".spinner__circle");
      expect(circle).toBeInTheDocument();
    });

    it("should hide spinner from assistive technology", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".spinner");
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("empty and edge cases", () => {
    it("should render with empty message", () => {
      const { container } = render(<LoadingSpinner message="" />);
      expect(
        container.querySelector(".loading-spinner__message"),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should render with undefined message", () => {
      render(<LoadingSpinner message={undefined} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should render with null message", () => {
      render(<LoadingSpinner message={null} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should handle long messages", () => {
      const longMessage =
        "Loading a very long message that might span multiple lines in the UI...";
      render(<LoadingSpinner message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe("multiple spinners", () => {
    it("should render multiple spinners independently", () => {
      render(
        <>
          <LoadingSpinner message="Loading 1" />
          <LoadingSpinner message="Loading 2" />
          <LoadingSpinner message="Loading 3" />
        </>,
      );

      expect(screen.getByText("Loading 1")).toBeInTheDocument();
      expect(screen.getByText("Loading 2")).toBeInTheDocument();
      expect(screen.getByText("Loading 3")).toBeInTheDocument();

      const statuses = screen.getAllByRole("status");
      expect(statuses).toHaveLength(3);
    });

    it("should render spinners with different sizes", () => {
      const { container } = render(
        <>
          <LoadingSpinner size="small" />
          <LoadingSpinner size="medium" />
          <LoadingSpinner size="large" />
        </>,
      );

      const spinners = container.querySelectorAll(".spinner");
      expect(spinners[0].className).toContain("spinner--small");
      expect(spinners[1].className).toContain("spinner--medium");
      expect(spinners[2].className).toContain("spinner--large");
    });
  });
});
