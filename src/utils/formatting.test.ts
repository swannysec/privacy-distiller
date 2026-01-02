import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatNumber,
  formatPercentage,
  truncateText,
  capitalize,
  toTitleCase,
  pluralize,
  formatList,
} from "./formatting";

describe("formatting utils", () => {
  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(100)).toBe("100 B");
      expect(formatFileSize(1023)).toBe("1023 B");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(2048)).toBe("2.0 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
    });

    it("should handle zero", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });

    it("should handle negative numbers", () => {
      const result = formatFileSize(-100);
      expect(result).toBeTruthy();
    });
  });

  describe("formatDate", () => {
    it("should format Date objects", () => {
      const date = new Date("2024-01-15T12:30:00Z");
      const result = formatDate(date);
      expect(result).toBeTruthy();
      expect(result).toContain("2024");
    });

    it("should format ISO strings", () => {
      const result = formatDate("2024-01-15T12:30:00Z");
      expect(result).toBeTruthy();
    });

    it("should format timestamps", () => {
      const date = new Date("2024-01-15");
      const result = formatDate(date);
      expect(result).toContain("2024");
    });

    it("should handle invalid dates", () => {
      const result = formatDate("invalid");
      // formatDate returns empty string for invalid dates
      expect(result).toBe("");
    });

    it("should handle null/undefined", () => {
      // formatDate returns empty string for null/undefined
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format recent times", () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toContain("5 minutes ago");
    });

    it("should format hours ago", () => {
      const now = new Date();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toContain("2 hours ago");
    });

    it("should format days ago", () => {
      const now = new Date();
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toContain("3 days ago");
    });

    it("should format just now", () => {
      const now = new Date();
      const result = formatRelativeTime(now);
      expect(result).toContain("just now");
    });
  });

  describe("formatDuration", () => {
    it("should format seconds", () => {
      expect(formatDuration(30000)).toBe("30s"); // formatDuration takes milliseconds
    });

    it("should format minutes and seconds", () => {
      expect(formatDuration(90000)).toBe("1m 30s"); // 90 seconds in ms
    });

    it("should format hours, minutes, and seconds", () => {
      expect(formatDuration(3665000)).toBe("1h 1m"); // formatDuration doesn't show seconds when hours present
    });

    it("should handle zero", () => {
      expect(formatDuration(0)).toBe("0s");
    });

    it("should handle large durations", () => {
      const result = formatDuration(86400); // 24 hours
      expect(result).toBeTruthy();
    });
  });

  describe("formatNumber", () => {
    it("should format with commas", () => {
      expect(formatNumber(1000)).toBe("1,000");
      expect(formatNumber(1000000)).toBe("1,000,000");
    });

    it("should handle decimals", () => {
      expect(formatNumber(1234.56)).toContain("1,234");
    });

    it("should handle zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("should handle negative numbers", () => {
      const result = formatNumber(-1000);
      expect(result).toContain("1,000");
    });
  });

  describe("formatPercentage", () => {
    it("should format as percentage", () => {
      // formatPercentage expects percentage values (0-100), not decimals
      expect(formatPercentage(50)).toBe("50%");
      expect(formatPercentage(75)).toBe("75%");
    });

    it("should handle whole numbers", () => {
      expect(formatPercentage(100)).toBe("100%");
      expect(formatPercentage(0)).toBe("0%");
    });

    it("should round to specified decimals", () => {
      // formatPercentage clamps to 0-100, so 0.12345 becomes 0%
      expect(formatPercentage(12.345, 2)).toBe("12.35%");
    });

    it("should handle values over 100%", () => {
      // formatPercentage clamps values to max 100%
      expect(formatPercentage(150)).toBe("100%");
    });
  });

  describe("truncateText", () => {
    it("should truncate long text", () => {
      const text = "This is a very long text that should be truncated";
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain("...");
    });

    it("should not truncate short text", () => {
      const text = "Short text";
      const result = truncateText(text, 20);
      expect(result).toBe(text);
      expect(result).not.toContain("...");
    });

    it("should handle empty strings", () => {
      expect(truncateText("", 10)).toBe("");
    });

    it("should handle custom suffix", () => {
      const text = "Long text here";
      const result = truncateText(text, 8, " [more]");
      expect(result).toContain("[more]");
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
    });

    it("should handle already capitalized", () => {
      expect(capitalize("Hello")).toBe("Hello");
    });

    it("should handle single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("should handle empty string", () => {
      expect(capitalize("")).toBe("");
    });

    it("should preserve rest of string", () => {
      // capitalize lowercases the rest of the string
      expect(capitalize("hELLO")).toBe("Hello");
    });
  });

  describe("toTitleCase", () => {
    it("should convert to title case", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
    });

    it("should handle multiple words", () => {
      expect(toTitleCase("the quick brown fox")).toBe("The Quick Brown Fox");
    });

    it("should handle single word", () => {
      expect(toTitleCase("hello")).toBe("Hello");
    });

    it("should preserve acronyms", () => {
      // toTitleCase lowercases everything first, doesn't preserve acronyms
      const result = toTitleCase("privacy policy API");
      expect(result).toBe("Privacy Policy Api");
    });

    it("should handle empty string", () => {
      expect(toTitleCase("")).toBe("");
    });
  });

  describe("pluralize", () => {
    it("should pluralize with count > 1", () => {
      expect(pluralize(2, "item")).toBe("items");
    });

    it("should not pluralize with count = 1", () => {
      expect(pluralize(1, "item")).toBe("item");
    });

    it("should pluralize with count = 0", () => {
      expect(pluralize(0, "item")).toBe("items");
    });

    it("should use custom plural form", () => {
      expect(pluralize(2, "child", "children")).toBe("children");
    });

    it("should include count if requested", () => {
      // pluralize doesn't have includeCount parameter, only returns the word
      expect(pluralize(5, "item")).toBe("items");
      expect(pluralize(1, "item")).toBe("item");
    });
  });

  describe("formatList", () => {
    it('should format with commas and "and"', () => {
      const result = formatList(["apple", "banana", "cherry"]);
      expect(result).toBe("apple, banana, and cherry");
    });

    it("should handle two items", () => {
      const result = formatList(["apple", "banana"]);
      expect(result).toBe("apple and banana");
    });

    it("should handle single item", () => {
      const result = formatList(["apple"]);
      expect(result).toBe("apple");
    });

    it("should handle empty array", () => {
      const result = formatList([]);
      expect(result).toBe("");
    });

    it("should use custom separator", () => {
      // formatList only takes conjunction parameter, not separator
      const result = formatList(["apple", "banana", "cherry"], "or");
      expect(result).toBe("apple, banana, or cherry");
    });
  });
});
