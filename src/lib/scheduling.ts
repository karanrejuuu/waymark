/**
 * Scheduling Logic Module
 * Pure functions for delivery round date calculations, interval self-correction,
 * escalation rules, priority ordering, snooze, and overdue carry-over.
 */

import { StockFeedback } from "./supabase/types";

export interface TodayItem {
  shopId: string;
  isUrgent: boolean;
  nextDueDate: Date | string;
  snoozeUntil?: Date | string | null;
  sortOrder?: number;
}

/**
 * Format date to YYYY-MM-DD in Asia/Kolkata (IST: UTC+5:30) timezone.
 */
export function toISTDate(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Normalize a date or YYYY-MM-DD string to start of day in local time.
 */
export function parseDateOnly(dateOrStr: Date | string): Date {
  if (typeof dateOrStr === "string") {
    // Handle both YYYY-MM-DD and full ISO strings
    const datePart = dateOrStr.split("T")[0];
    const [y, m, d] = datePart.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(dateOrStr.getFullYear(), dateOrStr.getMonth(), dateOrStr.getDate(), 0, 0, 0, 0);
}

/**
 * Format a Date to YYYY-MM-DD string based on local date components.
 */
export function formatDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Compute the next due date based on delivery date, interval in days, and remind offset.
 * Handles month-ends, leap years, and daylight shifts correctly via Date arithmetic.
 * Formula: next_due_date = delivered_at::date + interval_days - remind_offset_days
 */
export function computeNextDueDate(
  deliveredAt: Date | string,
  intervalDays: number,
  remindOffsetDays: number = 0
): Date {
  const base = parseDateOnly(deliveredAt);
  const effectiveDays = intervalDays - Math.max(0, Math.min(3, remindOffsetDays));
  base.setDate(base.getDate() + effectiveDays);
  return base;
}

/**
 * Interval self-correction rules:
 * - stock = 'low'    -> decrement by 1 (floor: 1)
 * - stock = 'plenty' -> increment by 1 (ceiling: 60)
 * - stock = 'fine'   -> no change
 * - null/undefined   -> no change
 */
export function adjustInterval(current: number, feedback?: StockFeedback): number {
  if (!feedback || feedback === "fine") return current;
  if (feedback === "low") {
    return Math.max(1, current - 1);
  }
  if (feedback === "plenty") {
    return Math.min(60, current + 1);
  }
  return current;
}

/**
 * Checks if a shop product is due today or overdue.
 * If snoozed until a future date, it is NOT due today.
 * Returns true when effectiveDueDate <= today.
 */
export function isDueToday(
  nextDueDate: Date | string,
  todayInput?: Date | string,
  snoozeUntil?: Date | string | null
): boolean {
  const today = todayInput ? parseDateOnly(todayInput) : parseDateOnly(new Date());

  // Check snooze: if snoozed to a date strictly in the future, it is not due
  if (snoozeUntil) {
    const snooze = parseDateOnly(snoozeUntil);
    if (snooze.getTime() > today.getTime()) {
      return false;
    }
  }

  const due = parseDateOnly(nextDueDate);
  return due.getTime() <= today.getTime();
}

/**
 * Calculate how many days a stop is overdue.
 * If due today or future, returns 0. If due yesterday, returns 1, etc.
 */
export function daysOverdue(nextDueDate: Date | string, todayInput?: Date | string): number {
  const due = parseDateOnly(nextDueDate);
  const today = todayInput ? parseDateOnly(todayInput) : parseDateOnly(new Date());

  const diffMs = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Checks if a shop is escalated (due for 2 or more days unvisited).
 * Returns true when nextDueDate <= today - 2 days
 */
export function isEscalated(nextDueDate: Date | string, todayInput?: Date | string): boolean {
  return daysOverdue(nextDueDate, todayInput) >= 2;
}

/**
 * Calculate snooze date:
 * Can snooze by a number of days (+1, +2, etc.) or to a specific target Date/string.
 */
export function calculateSnoozeDate(
  daysOrDate: number | Date | string,
  fromToday?: Date | string
): string {
  const base = fromToday ? parseDateOnly(fromToday) : parseDateOnly(new Date());

  if (typeof daysOrDate === "number") {
    base.setDate(base.getDate() + daysOrDate);
    return formatDateOnly(base);
  }

  const target = parseDateOnly(daysOrDate);
  return formatDateOnly(target);
}

/**
 * Sorts items for the Today vertical route line:
 * 1. Urgent stops first (chilli red dot on top)
 * 2. Escalated overdue stops (>=2 days overdue, carry-over from earlier)
 * 3. Due today stops
 * Within each category: sort by sortOrder (if present), then earliest due date.
 */
export function sortTodayItems<T extends TodayItem>(items: T[], todayInput?: Date | string): T[] {
  const today = todayInput ? parseDateOnly(todayInput) : parseDateOnly(new Date());

  return [...items].sort((a, b) => {
    // 1. Urgent priority
    if (a.isUrgent !== b.isUrgent) {
      return a.isUrgent ? -1 : 1;
    }

    // 2. Escalated priority
    const aEscalated = isEscalated(a.nextDueDate, today);
    const bEscalated = isEscalated(b.nextDueDate, today);
    if (aEscalated !== bEscalated) {
      return aEscalated ? -1 : 1;
    }

    // 3. Days overdue descending (longest overdue first)
    const aOverdue = daysOverdue(a.nextDueDate, today);
    const bOverdue = daysOverdue(b.nextDueDate, today);
    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue;
    }

    // 4. Sort order if defined
    if (a.sortOrder !== undefined && b.sortOrder !== undefined && a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    // 5. Earliest due date first
    return parseDateOnly(a.nextDueDate).getTime() - parseDateOnly(b.nextDueDate).getTime();
  });
}
