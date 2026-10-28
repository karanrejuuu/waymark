import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db, LocalShop, LocalRegion } from "@/lib/db/dexie";
import { createDatabaseBackup, restoreDatabaseBackup } from "../backup";

describe("Database Backup & Restore Durability", () => {
  beforeEach(async () => {
    await db.shops.clear();
    await db.regions.clear();
    await db.invoices.clear();
  });

  it("exports a complete database backup with metadata and counts", async () => {
    const region: LocalRegion = {
      id: "reg-fort-kochi",
      name: "Fort Kochi",
      organisation_id: "org-demo",
      created_at: new Date().toISOString(),
    };
    await db.regions.put(region);

    const shop: LocalShop = {
      id: "shop-1",
      name: "Seagull Provisions",
      region_id: "reg-fort-kochi",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.shops.put(shop);

    const backup = await createDatabaseBackup();
    expect(backup.app).toBe("Waymark FMCG");
    expect(backup.version).toBe(3);
    expect(backup.counts.shops).toBe(1);
    expect(backup.counts.regions).toBe(1);
    expect(backup.data.shops[0].name).toBe("Seagull Provisions");
  });

  it("restores database backup correctly", async () => {
    const backupJson = JSON.stringify({
      version: 3,
      exportedAt: new Date().toISOString(),
      app: "Waymark FMCG",
      counts: { shops: 1, regions: 1 },
      data: {
        shops: [
          {
            id: "shop-restored-1",
            name: "Bazaar Bakery",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        regions: [
          {
            id: "reg-restored-1",
            name: "Mattancherry",
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    const res = await restoreDatabaseBackup(backupJson);
    expect(res.success).toBe(true);
    expect(res.restoredCounts?.shops).toBe(1);

    const restoredShop = await db.shops.get("shop-restored-1");
    expect(restoredShop?.name).toBe("Bazaar Bakery");
  });

  it("rejects corrupt or non-Waymark backups safely", async () => {
    const invalidJson = JSON.stringify({ app: "Random App", data: {} });
    const res = await restoreDatabaseBackup(invalidJson);
    expect(res.success).toBe(false);
    expect(res.message).toContain("Invalid backup format");
  });
});
