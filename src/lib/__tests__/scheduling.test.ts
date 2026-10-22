import { describe, it, expect } from "vitest";
import {
  computeNextDueDate,
  adjustInterval,
  isDueToday,
  isEscalated,
  daysOverdue,
  calculateSnoozeDate,
  sortTodayItems,
  toISTDate,
  formatDateOnly,
  parseDateOnly,
  TodayItem,
} from "../scheduling";

describe("Scheduling Module — Production Hardening Due-Date Tests", () => {
  // 1. IST Timezone Tests
  describe("IST Timezone Boundaries", () => {
    it("IST today at UTC 18:29 is still yesterday in IST (UTC+5:30)", () => {
      // 18:29 UTC on 2026-10-21 = 23:59 IST on 2026-10-21
      const utcDate = new Date("2026-10-21T18:29:00Z");
      expect(toISTDate(utcDate)).toBe("2026-10-21");
    });

    it("IST today at UTC 18:30 is the next day in IST (UTC+5:30)", () => {
      // 18:30 UTC on 2026-10-21 = 00:00 IST on 2026-10-22
      const utcDate = new Date("2026-10-21T18:30:00Z");
      expect(toISTDate(utcDate)).toBe("2026-10-22");
    });
  });

  // 2. Month-End Rollovers
  describe("Month-End Rollover Arithmetic", () => {
    it("rolls over January 31 to February correctly", () => {
      const due = computeNextDueDate("2026-01-31", 7, 0);
      expect(formatDateOnly(due)).toBe("2026-02-07");
    });

    it("rolls over March 31 to April correctly", () => {
      const due = computeNextDueDate("2026-03-31", 3, 0);
      expect(formatDateOnly(due)).toBe("2026-04-03");
    });

    it("rolls over December 31 to New Year correctly", () => {
      const due = computeNextDueDate("2026-12-31", 5, 0);
      expect(formatDateOnly(due)).toBe("2027-01-05");
    });
  });

  // 3. Leap Year Tests
  describe("Leap Year Handling", () => {
    it("in leap year 2028, Feb 28 + 1 day rolls to Feb 29", () => {
      const due = computeNextDueDate("2028-02-28", 1, 0);
      expect(formatDateOnly(due)).toBe("2028-02-29");
    });

    it("in leap year 2028, Feb 29 + 1 day rolls to March 1", () => {
      const due = computeNextDueDate("2028-02-29", 1, 0);
      expect(formatDateOnly(due)).toBe("2028-03-01");
    });

    it("in non-leap year 2027, Feb 28 + 1 day rolls directly to March 1", () => {
      const due = computeNextDueDate("2027-02-28", 1, 0);
      expect(formatDateOnly(due)).toBe("2027-03-01");
    });
  });

  // 4. Remind Offset Arithmetic
  describe("Remind Offset (0 to 3 days earlier)", () => {
    it("offset 0: delivery + 7 days", () => {
      const due = computeNextDueDate("2026-10-10", 7, 0);
      expect(formatDateOnly(due)).toBe("2026-10-17");
    });

    it("offset 2: delivery + 7 - 2 = 5 days", () => {
      const due = computeNextDueDate("2026-10-10", 7, 2);
      expect(formatDateOnly(due)).toBe("2026-10-15");
    });

    it("clamps offset to max 3 days", () => {
      const due = computeNextDueDate("2026-10-10", 7, 5); // 5 clamped to 3
      expect(formatDateOnly(due)).toBe("2026-10-14");
    });
  });

  // 5. Snooze / Reschedule Tests
  describe("Snooze / Reschedule Integrity", () => {
    it("snooze in the future makes stop NOT due today", () => {
      const nextDue = "2026-10-20"; // was due yesterday
      const today = "2026-10-21";
      const snoozeUntil = "2026-10-24"; // snoozed to 3 days later

      expect(isDueToday(nextDue, today, snoozeUntil)).toBe(false);
    });

    it("snooze date reached makes stop due today", () => {
      const nextDue = "2026-10-20";
      const today = "2026-10-24";
      const snoozeUntil = "2026-10-24"; // today is the snooze date!

      expect(isDueToday(nextDue, today, snoozeUntil)).toBe(true);
    });

    it("calculates snooze date for +2 days", () => {
      const snoozeDate = calculateSnoozeDate(2, "2026-10-22");
      expect(snoozeDate).toBe("2026-10-24");
    });
  });

  // 6. Overdue & Carry-over Tests
  describe("Overdue & Carry-Over Handling", () => {
    it("reports 0 days overdue on due date", () => {
      expect(daysOverdue("2026-10-22", "2026-10-22")).toBe(0);
    });

    it("reports 1 day overdue when due yesterday (carried over)", () => {
      expect(daysOverdue("2026-10-21", "2026-10-22")).toBe(1);
      expect(isEscalated("2026-10-21", "2026-10-22")).toBe(false);
    });

    it("reports 3 days overdue and escalates for 2+ days", () => {
      expect(daysOverdue("2026-10-19", "2026-10-22")).toBe(3);
      expect(isEscalated("2026-10-19", "2026-10-22")).toBe(true);
    });
  });

  // 7. Interval Self-Correction
  describe("Interval Self-Correction Boundaries", () => {
    it("low decrements interval by 1", () => expect(adjustInterval(7, "low")).toBe(6));
    it("plenty increments interval by 1", () => expect(adjustInterval(7, "plenty")).toBe(8));
    it("fine keeps interval unchanged", () => expect(adjustInterval(7, "fine")).toBe(7));
    it("clamps floor at 1 day (never 0 or negative)", () => expect(adjustInterval(1, "low")).toBe(1));
    it("clamps ceiling at 60 days", () => expect(adjustInterval(60, "plenty")).toBe(60));
  });

  // 8. Vertical Route Priority Sorting
  describe("Vertical Route Order", () => {
    it("sorts urgent first with chilli dot, then oldest overdue, then due today", () => {
      const items: TodayItem[] = [
        { shopId: "due-today", isUrgent: false, nextDueDate: "2026-10-22" },
        { shopId: "overdue-3d", isUrgent: false, nextDueDate: "2026-10-19" },
        { shopId: "overdue-1d", isUrgent: false, nextDueDate: "2026-10-21" },
        { shopId: "urgent-stop", isUrgent: true, nextDueDate: "2026-10-22" },
      ];

      const sorted = sortTodayItems(items, "2026-10-22");
      expect(sorted.map((i) => i.shopId)).toEqual([
        "urgent-stop", // 1. Urgent on top
        "overdue-3d",  // 2. Oldest overdue carried over
        "overdue-1d",  // 3. Yesterday's carry-over
        "due-today",   // 4. Today's stop
      ]);
    });
  });
});
