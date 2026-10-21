import { describe, it, expect } from "vitest";
import {
  computeNextDueDate,
  adjustInterval,
  isDueToday,
  isEscalated,
  sortTodayItems,
  toISTDate,
  formatDateOnly,
  parseDateOnly,
  TodayItem,
} from "../scheduling";

const d = (s: string) => parseDateOnly(s);

describe("Scheduling Module", () => {
  describe("computeNextDueDate", () => {
    it("adds interval and subtracts offset", () => {
      const result = computeNextDueDate("2026-10-01", 7, 2);
      expect(formatDateOnly(result)).toBe("2026-10-06");
    });

    it("with zero offset returns delivered + interval", () => {
      const result = computeNextDueDate("2026-10-01", 7, 0);
      expect(formatDateOnly(result)).toBe("2026-10-08");
    });
  });

  describe("adjustInterval", () => {
    it("low decrements by 1", () => {
      expect(adjustInterval(7, "low")).toBe(6);
    });

    it("plenty increments by 1", () => {
      expect(adjustInterval(7, "plenty")).toBe(8);
    });

    it("fine has no effect", () => {
      expect(adjustInterval(7, "fine")).toBe(7);
    });

    it("low floor is 1", () => {
      // Review Focus #4
      expect(adjustInterval(1, "low")).toBe(1);
    });

    it("plenty ceiling is 60", () => {
      // Review Focus #4
      expect(adjustInterval(60, "plenty")).toBe(60);
    });

    it("null or undefined has no effect", () => {
      expect(adjustInterval(7, null)).toBe(7);
      expect(adjustInterval(7, undefined)).toBe(7);
    });
  });

  describe("isDueToday", () => {
    it("returns true when nextDueDate < today", () => {
      expect(isDueToday("2026-10-21", "2026-10-22")).toBe(true);
    });

    it("returns true when nextDueDate == today", () => {
      expect(isDueToday("2026-10-22", "2026-10-22")).toBe(true);
    });

    it("returns false when nextDueDate > today", () => {
      expect(isDueToday("2026-10-23", "2026-10-22")).toBe(false);
    });
  });

  describe("isEscalated", () => {
    it("true when 2+ days overdue", () => {
      expect(isEscalated("2026-10-20", "2026-10-22")).toBe(true);
    });

    it("false when 1 day overdue", () => {
      expect(isEscalated("2026-10-21", "2026-10-22")).toBe(false);
    });

    it("false when due today", () => {
      expect(isEscalated("2026-10-22", "2026-10-22")).toBe(false);
    });
  });

  describe("sortTodayItems", () => {
    it("urgent first, then escalated, then due today", () => {
      const items: TodayItem[] = [
        { shopId: "a", isUrgent: false, nextDueDate: d("2026-10-22") },
        { shopId: "b", isUrgent: false, nextDueDate: d("2026-10-20") }, // escalated
        { shopId: "c", isUrgent: true, nextDueDate: d("2026-10-22") },  // urgent
      ];
      const sorted = sortTodayItems(items, "2026-10-22");
      expect(sorted.map((i) => i.shopId)).toEqual(["c", "b", "a"]);
    });

    it("preserves sortOrder within same category", () => {
      const items: TodayItem[] = [
        { shopId: "shop-2", isUrgent: false, nextDueDate: d("2026-10-22"), sortOrder: 2 },
        { shopId: "shop-1", isUrgent: false, nextDueDate: d("2026-10-22"), sortOrder: 1 },
      ];
      const sorted = sortTodayItems(items, "2026-10-22");
      expect(sorted.map((i) => i.shopId)).toEqual(["shop-1", "shop-2"]);
    });
  });

  describe("toISTDate", () => {
    // Review Focus #2: Timezone boundary testing
    it("IST today at UTC 18:29 is still yesterday in IST", () => {
      // 18:29 UTC on 2026-10-21 = 23:59 IST on 2026-10-21
      const utcDate = new Date("2026-10-21T18:29:00Z");
      expect(toISTDate(utcDate)).toBe("2026-10-21");
    });

    it("IST today at UTC 18:30 is the next day in IST", () => {
      // 18:30 UTC on 2026-10-21 = 00:00 IST on 2026-10-22
      const utcDate = new Date("2026-10-21T18:30:00Z");
      expect(toISTDate(utcDate)).toBe("2026-10-22");
    });
  });
});
