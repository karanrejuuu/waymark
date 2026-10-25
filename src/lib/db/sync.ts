import { db, SyncQueueItem } from "./dexie";
import { createBrowserClient } from "../supabase/client";

/**
 * Enqueue a write operation to local IndexedDB and write to the local store immediately.
 */
export async function enqueueWrite(
  table: string,
  op: "upsert" | "delete",
  payload: any
): Promise<void> {
  const tableRef = (db as any)[table];

  if (tableRef) {
    if (op === "upsert") {
      await tableRef.put(payload);
    } else if (op === "delete" && payload.id) {
      await tableRef.delete(payload.id);
    }
  }

  await db.sync_queue.add({
    table,
    op,
    payload,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Drain the sync queue by sending changes to Supabase.
 * Idempotent: uses onConflict: 'client_id' for deliveries, 'id' for other tables.
 */
export async function drainQueue(clientOverride?: any): Promise<{ synced: number; failed: number }> {
  const supabase = clientOverride || createBrowserClient();
  const queue = await db.sync_queue.orderBy("id").toArray();

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.op === "upsert") {
        const onConflict =
          (item.table === "deliveries" || item.table === "payments") && item.payload.client_id
            ? "client_id"
            : "id";
        const { error } = await supabase
          .from(item.table)
          .upsert(item.payload, { onConflict });

        if (error) {
          console.error(`Sync error on ${item.table}:`, error);
          failed++;
          continue;
        }
      } else if (item.op === "delete" && item.payload.id) {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq("id", item.payload.id);

        if (error) {
          console.error(`Sync delete error on ${item.table}:`, error);
          failed++;
          continue;
        }
      }

      // If successful, remove from sync queue
      if (item.id) {
        await db.sync_queue.delete(item.id);
      }
      synced++;
    } catch (err) {
      console.error(`Failed to sync item ${item.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Pull and merge server data into local Dexie.
 * Server wins on conflict for entities, deliveries are append-only.
 */
export async function mergeServerState(clientOverride?: any): Promise<void> {
  const supabase = clientOverride || createBrowserClient();

  const tables = [
    "organisations",
    "organisation_members",
    "profiles",
    "godowns",
    "regions",
    "shops",
    "products",
    "shop_products",
    "deliveries",
    "payments",
  ];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.from(tableName).select("*");
      if (!error && Array.isArray(data) && data.length > 0) {
        const localTable = (db as any)[tableName];
        if (localTable) {
          await localTable.bulkPut(data);
        }
      }
    } catch (e) {
      console.warn(`Could not merge server state for table ${tableName}:`, e);
    }
  }
}
