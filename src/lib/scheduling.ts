/**
 * Scheduling Logic Module
 * Pure functions for delivery round date calculations, interval self-correction,
 * escalation rules, and priority ordering.
 */

import { StockFeedback } from "./supabase/types";

export interface TodayItem {
  shopId: string;
  isUrgent: boolean;
  nextDueDate: Date;
  sortOrder?: number;
}

/**
 * Format date to YYYY-MM-DD in Asia/Kolkata (IST: UTC+5:30) timezone.
 */
export function toISTDate(date: Date = new Date()): string {
  // Use Intl.DateTimeFormat with Asia/Kolkata timezone
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
    const [y, m, d] = dateOrStr.split("-").map(Number);
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
 * Formula: next_due_date = delivered_at::date + interval_days - remind_offset_days
 */
export function computeNextDueDate(
  deliveredAt: Date | string,
  intervalDays: number,
  remindOffsetDays: number = 0
): Date {
  const base = parseDateOnly(deliveredAt);
  const effectiveDays = intervalDays - remindOffsetDays;
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
 * Returns true when nextDueDate <= today
 */
export function isDueToday(nextDueDate: Date | string, todayInput?: Date | string): boolean {
  const due = parseDateOnly(nextDueDate);
  const today = todayInput ? parseDateOnly(todayInput) : parseDateOnly(new Date());
  return due.getTime() <= today.getTime();
}

/**
 * Checks if a shop is escalated (due for 2 or more days unvisited).
 * Returns true when nextDueDate <= today - 2 days
 */
export function isEscalated(nextDueDate: Date | string, todayInput?: Date | string): boolean {
  const due = parseDateOnly(nextDueDate);
  const today = todayInput ? parseDateOnly(todayInput) : parseDateOnly(new Date());
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 2;
}

/**
 * Sorts items for the Today screen:
 * 1. Urgent shops first (red dot)
 * 2. Escalated shops (>=2 days overdue, yellow dot)
 * 3. Due today shops
 * Within each category, secondary sort by sortOrder (if present), then date.
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

    // 3. Sort order if provided
    if (a.sortOrder !== undefined && b.sortOrder !== undefined && a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    // 4. Earliest next due date first
    return parseDateOnly(a.nextDueDate).getTime() - parseDateOnly(b.nextDueDate).getTime();
  });
}
