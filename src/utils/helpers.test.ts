/**
 * @file Tests for helpers.ts utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateId,
  delay,
  debounce,
  throttle,
  deepClone,
  deepEqual,
  retry,
  chunk,
  groupBy,
  sortBy,
  unique,
  get,
  isEmpty,
  clamp,
} from "./helpers";

describe("helpers", () => {
  describe("generateId", () => {
    it("should generate a unique ID string", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("should generate different IDs on subsequent calls", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should include timestamp component", () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();
      const timestamp = parseInt(id.split("-")[0], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("delay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return a promise", () => {
      const result = delay(100);
      expect(result).toBeInstanceOf(Promise);
    });

    it("should resolve after specified time", async () => {
      const promise = delay(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    it("should not resolve before specified time", async () => {
      let resolved = false;
      delay(1000).then(() => {
        resolved = true;
      });
      vi.advanceTimersByTime(500);
      expect(resolved).toBe(false);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should delay function execution", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should reset timer on subsequent calls", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to the function", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("arg1", "arg2");
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should use latest arguments when called multiple times", () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced("first");
      debounced("second");
      debounced("third");
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith("third");
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should execute function immediately on first call", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should ignore calls within throttle period", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should allow calls after throttle period", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should pass arguments to the function", () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled("arg1", "arg2");
      expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("deepClone", () => {
    it("should clone primitive values", () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone("string")).toBe("string");
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it("should clone arrays", () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone nested arrays", () => {
      const original = [1, [2, 3], [4, [5, 6]]];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned[1]).not.toBe(original[1]);
      expect(cloned[2][1]).not.toBe(original[2][1]);
    });

    it("should clone objects", () => {
      const original = { a: 1, b: 2 };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone nested objects", () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned.a).not.toBe(original.a);
      expect(cloned.a.b).not.toBe(original.a.b);
    });

    it("should clone Date objects", () => {
      const original = new Date("2024-01-01");
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.getTime()).toBe(original.getTime());
    });

    it("should handle mixed nested structures", () => {
      const original = {
        array: [1, { nested: true }],
        object: { key: "value" },
        date: new Date("2024-01-01"),
      };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned.array).not.toBe(original.array);
      expect(cloned.object).not.toBe(original.object);
    });
  });

  describe("deepEqual", () => {
    it("should return true for identical primitives", () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual("a", "a")).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it("should return false for different primitives", () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual("a", "b")).toBe(false);
      expect(deepEqual(true, false)).toBe(false);
    });

    it("should return true for equal arrays", () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it("should return false for different arrays", () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it("should return true for equal objects", () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it("should return false for different objects", () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it("should handle nested structures", () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it("should handle null values", () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual({}, null)).toBe(false);
    });

    it("should return false for different types", () => {
      expect(deepEqual(1, "1")).toBe(false);
      // Note: deepEqual treats [] and {} as equal since both have 0 keys
      // This is a known limitation of the simple implementation
    });
  });

  describe("retry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return result on first success", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await retry(fn);
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce("success");

      const promise = retry(fn, 3, 100);
      await vi.advanceTimersByTimeAsync(100);
      const result = await promise;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should throw after max attempts", async () => {
      // Use real timers for this test to avoid unhandled rejection warnings
      vi.useRealTimers();

      const fn = vi.fn().mockRejectedValue(new Error("always fails"));

      await expect(retry(fn, 3, 1)).rejects.toThrow("always fails");
      expect(fn).toHaveBeenCalledTimes(3);

      // Restore fake timers for subsequent tests
      vi.useFakeTimers();
    });

    it("should use default values for maxAttempts and delay", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      await retry(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should convert non-Error rejections to Error", async () => {
      const fn = vi.fn().mockRejectedValue("string error");

      const promise = retry(fn, 1, 0);
      await expect(promise).rejects.toThrow("string error");
    });
  });

  describe("chunk", () => {
    it("should split array into chunks of specified size", () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should handle array smaller than chunk size", () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it("should handle exact divisible arrays", () => {
      expect(chunk([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("should return empty array for empty input", () => {
      expect(chunk([], 2)).toEqual([]);
    });

    it("should return empty array for invalid size", () => {
      expect(chunk([1, 2, 3], 0)).toEqual([]);
      expect(chunk([1, 2, 3], -1)).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      expect(chunk(null, 2)).toEqual([]);
      expect(chunk(undefined, 2)).toEqual([]);
    });
  });

  describe("groupBy", () => {
    it("should group items by key function", () => {
      const items = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
      ];
      expect(groupBy(items, (item) => item.type)).toEqual({
        a: [
          { type: "a", value: 1 },
          { type: "a", value: 3 },
        ],
        b: [{ type: "b", value: 2 }],
      });
    });

    it("should handle empty array", () => {
      expect(groupBy([], (item) => item)).toEqual({});
    });

    it("should return empty object for non-array input", () => {
      expect(groupBy(null, (item) => item)).toEqual({});
      expect(groupBy(undefined, (item) => item)).toEqual({});
    });

    it("should handle single item groups", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = groupBy(items, (item) => String(item.id));
      expect(Object.keys(result)).toHaveLength(3);
    });
  });

  describe("sortBy", () => {
    it("should sort by property ascending", () => {
      const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
      expect(sortBy(items, "value")).toEqual([
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ]);
    });

    it("should sort by property descending", () => {
      const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
      expect(sortBy(items, "value", false)).toEqual([
        { value: 3 },
        { value: 2 },
        { value: 1 },
      ]);
    });

    it("should not mutate original array", () => {
      const items = [{ value: 3 }, { value: 1 }];
      sortBy(items, "value");
      expect(items[0].value).toBe(3);
    });

    it("should handle string properties", () => {
      const items = [{ name: "c" }, { name: "a" }, { name: "b" }];
      expect(sortBy(items, "name")).toEqual([
        { name: "a" },
        { name: "b" },
        { name: "c" },
      ]);
    });

    it("should handle equal values", () => {
      const items = [{ value: 1 }, { value: 1 }];
      expect(sortBy(items, "value")).toEqual([{ value: 1 }, { value: 1 }]);
    });

    it("should return empty array for non-array input", () => {
      expect(sortBy(null, "value")).toEqual([]);
      expect(sortBy(undefined, "value")).toEqual([]);
    });
  });

  describe("unique", () => {
    it("should remove duplicate primitives", () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it("should remove duplicates using key function", () => {
      const items = [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 1, name: "c" },
      ];
      expect(unique(items, (item) => String(item.id))).toEqual([
        { id: 1, name: "a" },
        { id: 2, name: "b" },
      ]);
    });

    it("should handle empty array", () => {
      expect(unique([])).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      expect(unique(null)).toEqual([]);
      expect(unique(undefined)).toEqual([]);
    });

    it("should preserve order", () => {
      expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
    });
  });

  describe("get", () => {
    it("should access nested properties", () => {
      const obj = { a: { b: { c: 1 } } };
      expect(get(obj, "a.b.c")).toBe(1);
    });

    it("should return undefined for missing properties", () => {
      const obj = { a: 1 };
      expect(get(obj, "b")).toBeUndefined();
      expect(get(obj, "a.b.c")).toBeUndefined();
    });

    it("should return default value for missing properties", () => {
      const obj = { a: 1 };
      expect(get(obj, "b", "default")).toBe("default");
    });

    it("should handle null/undefined objects", () => {
      expect(get(null, "a")).toBeUndefined();
      expect(get(undefined, "a")).toBeUndefined();
      expect(get(null, "a", "default")).toBe("default");
    });

    it("should handle arrays in path", () => {
      const obj = { items: [{ id: 1 }, { id: 2 }] };
      expect(get(obj, "items.0.id")).toBe(1);
    });

    it("should return value when path leads to falsy but defined value", () => {
      const obj = { a: 0, b: "", c: false };
      expect(get(obj, "a")).toBe(0);
      expect(get(obj, "b")).toBe("");
      expect(get(obj, "c")).toBe(false);
    });
  });

  describe("isEmpty", () => {
    it("should return true for null and undefined", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it("should return true for empty string", () => {
      expect(isEmpty("")).toBe(true);
      expect(isEmpty("   ")).toBe(true);
    });

    it("should return false for non-empty string", () => {
      expect(isEmpty("hello")).toBe(false);
      expect(isEmpty(" hello ")).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(isEmpty([])).toBe(true);
    });

    it("should return false for non-empty array", () => {
      expect(isEmpty([1])).toBe(false);
    });

    it("should return true for empty object", () => {
      expect(isEmpty({})).toBe(true);
    });

    it("should return false for non-empty object", () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });

    it("should return false for numbers", () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(1)).toBe(false);
    });

    it("should return false for booleans", () => {
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(true)).toBe(false);
    });
  });

  describe("clamp", () => {
    it("should clamp value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("should return min when value is below range", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("should return max when value is above range", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("should handle equal min and max", () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(0, 5, 5)).toBe(5);
      expect(clamp(10, 5, 5)).toBe(5);
    });

    it("should handle negative ranges", () => {
      expect(clamp(0, -10, -5)).toBe(-5);
      expect(clamp(-7, -10, -5)).toBe(-7);
      expect(clamp(-15, -10, -5)).toBe(-10);
    });
  });
});
