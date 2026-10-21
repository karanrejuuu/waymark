import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../dexie";
import { enqueueWrite, drainQueue } from "../sync";

describe("Sync Queue Idempotency (Review Focus #1)", () => {
  beforeEach(async () => {
    await db.sync_queue.clear();
    await db.deliveries.clear();
  });

  it("draining queue twice does not duplicate deliveries", async () => {
    const mockDeliveriesDb = new Map<string, any>();

    const mockSupabase = {
      from: (tableName: string) => ({
        upsert: vi.fn(async (payload: any, options?: { onConflict?: string }) => {
          const key = options?.onConflict === "client_id" ? payload.client_id : payload.id;
          mockDeliveriesDb.set(key, payload);
          return { data: payload, error: null };
        }),
        delete: vi.fn(async () => ({ data: null, error: null })),
      }),
    };

    const deliveryPayload = {
      id: "del-uuid-1",
      client_id: "client-stable-uuid-abc",
      shop_id: "shop-1",
      product_id: "prod-1",
      qty: 5,
      delivered_at: new Date().toISOString(),
      synced: false,
    };

    // 1. Enqueue write offline
    await enqueueWrite("deliveries", "upsert", deliveryPayload);
    expect(await db.sync_queue.count()).toBe(1);

    // 2. Drain once (online)
    const result1 = await drainQueue(mockSupabase);
    expect(result1.synced).toBe(1);
    expect(await db.sync_queue.count()).toBe(0);
    expect(mockDeliveriesDb.size).toBe(1);

    // 3. Simulate another item with the same client_id re-queued or drained again
    await enqueueWrite("deliveries", "upsert", deliveryPayload);
    const result2 = await drainQueue(mockSupabase);
    expect(result2.synced).toBe(1);

    // Still only 1 entry in the server map because client_id upsert is idempotent
    expect(mockDeliveriesDb.size).toBe(1);
    expect(mockDeliveriesDb.get("client-stable-uuid-abc")?.qty).toBe(5);
  });
});
