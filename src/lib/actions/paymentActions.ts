import { db, LocalPayment } from "../db/dexie";
import { enqueueWrite } from "../db/sync";
import { PaymentMode } from "../supabase/types";

export interface RecordPaymentInput {
  shopId: string;
  amount: number;
  paymentMode?: PaymentMode;
  notes?: string | null;
  collectedBy?: string | null;
}

/**
 * Record a dues collection payment for a shop.
 * Subtracts the collected amount from shop.balance_due and records payment in ledger.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<LocalPayment> {
  if (input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const shop = await db.shops.get(input.shopId);
  if (!shop) {
    throw new Error(`Shop with id ${input.shopId} not found`);
  }

  const nowIso = new Date().toISOString();
  const clientId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const paymentRecord: LocalPayment = {
    id: clientId,
    client_id: clientId,
    organisation_id: shop.organisation_id || "demo-org",
    shop_id: input.shopId,
    collected_by: input.collectedBy || null,
    amount: input.amount,
    payment_mode: input.paymentMode || "cash",
    notes: input.notes?.trim() || null,
    collected_at: nowIso,
    created_at: nowIso,
  };

  // 1. Enqueue payment row
  await enqueueWrite("payments", "upsert", paymentRecord);

  // 2. Deduct from shop.balance_due
  const currentDue = Number(shop.balance_due) || 0;
  const updatedDue = Math.max(0, currentDue - input.amount);

  const updatedShop = {
    ...shop,
    balance_due: updatedDue,
    updated_at: nowIso,
  };

  await enqueueWrite("shops", "upsert", updatedShop);

  return paymentRecord;
}
