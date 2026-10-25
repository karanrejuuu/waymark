import { db, LocalShop } from "../db/dexie";
import { enqueueWrite } from "../db/sync";
import { markDelivered, ProductDeliveryInput } from "./markDelivered";
import { recordPayment } from "./paymentActions";
import { snoozeShop } from "./snoozeShop";
import { PaymentMode } from "../supabase/types";
import { formatDateOnly } from "../scheduling";

export type VisitOutcome =
  | "delivered_paid"
  | "delivered_unpaid"
  | "bill_to_bill"
  | "follow_up"
  | "shop_closed"
  | "no_order"
  | "update_note";

export interface RecordShopVisitOutcomeInput {
  shopId: string;
  outcome: VisitOutcome;
  productDeliveries?: ProductDeliveryInput[];
  paymentCollected?: number;
  paymentMode?: PaymentMode;
  previousBillSettled?: number;
  billAmount?: number;
  billNumber?: string;
  followUpDate?: string | Date | number;
  notes?: string;
  deliveredBy?: string | null;
}

export interface VisitOutcomeResult {
  success: boolean;
  message: string;
  shop: LocalShop;
}

/**
 * Record a comprehensive visit outcome for a retail shop.
 * Supports:
 * - Full Delivery & Cash/UPI Collected
 * - Delivery Unpaid (adds invoice to khata dues)
 * - Bill-to-Bill Credit (clears previous bill, logs new bill)
 * - Follow-up Needed (snoozes with callback date and note)
 * - Shop Closed (snoozes stop)
 * - Overstocked / No Order
 * - Direct Note & Update Mention
 */
export async function recordShopVisitOutcome(
  input: RecordShopVisitOutcomeInput
): Promise<VisitOutcomeResult> {
  const shop = await db.shops.get(input.shopId);
  if (!shop) {
    throw new Error(`Shop with id ${input.shopId} not found`);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  let updatedNotes = shop.notes || "";

  // Helper to append a timestamped update note
  const appendNote = (tag: string, text?: string) => {
    const timeFormatted = now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const entry = `[${tag} · ${timeFormatted}] ${text || ""}`.trim();
    return updatedNotes ? `${entry}\n${updatedNotes}` : entry;
  };

  switch (input.outcome) {
    case "delivered_paid": {
      // 1. Mark products delivered
      if (input.productDeliveries && input.productDeliveries.length > 0) {
        await markDelivered(input.shopId, input.productDeliveries, input.deliveredBy, {
          notes: input.notes,
        });
      }

      // 2. Record payment if collected
      if (input.paymentCollected && input.paymentCollected > 0) {
        await recordPayment({
          shopId: input.shopId,
          amount: input.paymentCollected,
          paymentMode: input.paymentMode || "cash",
          collectedBy: input.deliveredBy,
          notes: input.notes || "Collected at delivery",
        });
      }

      // 3. Append note
      const billRef = input.billNumber ? `Bill #${input.billNumber} · ` : "";
      const payRef = input.paymentCollected ? `₹${input.paymentCollected.toLocaleString("en-IN")} paid via ${input.paymentMode || "cash"}` : "Delivered";
      updatedNotes = appendNote("Delivered & Paid", `${billRef}${payRef}${input.notes ? ` · ${input.notes}` : ""}`);
      break;
    }

    case "delivered_unpaid": {
      // 1. Mark products delivered without payment
      if (input.productDeliveries && input.productDeliveries.length > 0) {
        await markDelivered(input.shopId, input.productDeliveries, input.deliveredBy, {
          notes: input.notes ? `Cash pending · ${input.notes}` : "Cash pending",
        });
      }

      // 2. Add new invoice bill to shop.balance_due
      let newBalance = Number(shop.balance_due) || 0;
      if (input.billAmount && input.billAmount > 0) {
        newBalance += input.billAmount;
      }

      const billRef = input.billNumber ? `Bill #${input.billNumber}` : "Invoice";
      const amtRef = input.billAmount ? `₹${input.billAmount.toLocaleString("en-IN")}` : "Unpaid";
      updatedNotes = appendNote("Delivered Unpaid", `${billRef} for ${amtRef} added to khata dues${input.notes ? ` · ${input.notes}` : ""}`);

      await enqueueWrite("shops", "upsert", {
        ...shop,
        balance_due: newBalance,
        notes: updatedNotes,
        updated_at: nowIso,
      });
      break;
    }

    case "bill_to_bill": {
      // 1. Mark products delivered
      if (input.productDeliveries && input.productDeliveries.length > 0) {
        await markDelivered(input.shopId, input.productDeliveries, input.deliveredBy, {
          notes: `Bill-to-bill delivery · ${input.notes || ""}`,
        });
      }

      // 2. Settle previous bill amount
      if (input.previousBillSettled && input.previousBillSettled > 0) {
        await recordPayment({
          shopId: input.shopId,
          amount: input.previousBillSettled,
          paymentMode: input.paymentMode || "cash",
          collectedBy: input.deliveredBy,
          notes: `Bill-to-bill clearance of previous dues`,
        });
      }

      // 3. Add new bill amount to balance
      const currentShop = await db.shops.get(input.shopId);
      let balance = Number(currentShop?.balance_due) || 0;
      if (input.billAmount && input.billAmount > 0) {
        balance += input.billAmount;
      }

      const prevRef = input.previousBillSettled ? `Cleared previous bill: ₹${input.previousBillSettled.toLocaleString("en-IN")}` : "";
      const newRef = input.billAmount ? `New Bill #${input.billNumber || "N/A"}: ₹${input.billAmount.toLocaleString("en-IN")}` : "";
      updatedNotes = appendNote("Bill-to-Bill Credit", `${prevRef} | ${newRef}${input.notes ? ` · ${input.notes}` : ""}`);

      await enqueueWrite("shops", "upsert", {
        ...(currentShop || shop),
        balance_due: balance,
        notes: updatedNotes,
        updated_at: nowIso,
      });
      break;
    }

    case "follow_up": {
      const followUp = input.followUpDate || 1; // default snooze 1 day
      await snoozeShop(input.shopId, followUp, input.notes || "Follow-up requested");

      updatedNotes = appendNote("Follow-Up Needed", `${input.notes || "Callback requested"}`);
      const freshShop = await db.shops.get(input.shopId);
      await enqueueWrite("shops", "upsert", {
        ...(freshShop || shop),
        notes: updatedNotes,
        updated_at: nowIso,
      });
      break;
    }

    case "shop_closed": {
      await snoozeShop(input.shopId, 1, "Counter closed / Shutter down");
      updatedNotes = appendNote("Shop Closed", input.notes || "Counter shutters closed upon arrival");

      const freshShop = await db.shops.get(input.shopId);
      await enqueueWrite("shops", "upsert", {
        ...(freshShop || shop),
        notes: updatedNotes,
        updated_at: nowIso,
      });
      break;
    }

    case "no_order": {
      // Overstocked / no delivery today: snooze 3 days
      await snoozeShop(input.shopId, 3, "Overstocked / No order needed");
      updatedNotes = appendNote("No Order Needed", input.notes || "Retailer has full stock on counter");

      const freshShop = await db.shops.get(input.shopId);
      await enqueueWrite("shops", "upsert", {
        ...(freshShop || shop),
        notes: updatedNotes,
        updated_at: nowIso,
      });
      break;
    }

    case "update_note": {
      updatedNotes = appendNote("Update Mention", input.notes || "");
      await enqueueWrite("shops", "upsert", {
        ...shop,
        notes: updatedNotes,
        updated_at: nowIso,
      });
      break;
    }
  }

  // If followUpDate / reminder date was provided for any outcome, update shop's scheduled reminder
  if (input.followUpDate) {
    let reminderDateStr = "";
    if (typeof input.followUpDate === "number") {
      const d = new Date();
      d.setDate(d.getDate() + input.followUpDate);
      reminderDateStr = formatDateOnly(d);
    } else if (input.followUpDate instanceof Date) {
      reminderDateStr = formatDateOnly(input.followUpDate);
    } else if (typeof input.followUpDate === "string") {
      reminderDateStr = input.followUpDate;
    }

    if (reminderDateStr) {
      const currentShop = (await db.shops.get(input.shopId)) || shop;
      await enqueueWrite("shops", "upsert", {
        ...currentShop,
        reminder_date: reminderDateStr,
        reminder_note: input.notes || "Scheduled follow-up",
        updated_at: nowIso,
      });
    }
  }

  const latestShop = (await db.shops.get(input.shopId)) || shop;
  return {
    success: true,
    message: `Outcome recorded for ${latestShop.name}`,
    shop: latestShop,
  };
}

/**
 * Quick helper to update a shop's update note mention without altering delivery state.
 */
export async function updateShopNote(shopId: string, noteText: string): Promise<void> {
  await recordShopVisitOutcome({
    shopId,
    outcome: "update_note",
    notes: noteText,
  });
}
