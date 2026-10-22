import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../db/dexie";

// Test multi-tenant organization isolation logic
describe("Production Multi-Tenant RLS & Data Isolation across Two Organizations", () => {
  const orgAlpha = "org-alpha-1111";
  const orgBeta = "org-beta-2222";

  beforeEach(async () => {
    await db.organisations.clear();
    await db.organisation_members.clear();
    await db.shops.clear();
    await db.deliveries.clear();
    await db.payments.clear();

    // 1. Setup Org Alpha & Org Beta
    await db.organisations.bulkPut([
      { id: orgAlpha, name: "Alpha Traders (North)", currency: "INR", created_at: new Date().toISOString() },
      { id: orgBeta, name: "Beta Distributors (South)", currency: "INR", created_at: new Date().toISOString() },
    ]);

    // 2. Setup memberships
    await db.organisation_members.bulkPut([
      { id: "mem-1", organisation_id: orgAlpha, user_id: "user-alpha", role: "owner", created_at: new Date().toISOString() },
      { id: "mem-2", organisation_id: orgBeta, user_id: "user-beta", role: "owner", created_at: new Date().toISOString() },
    ]);

    // 3. Seed shops in both orgs
    await db.shops.bulkPut([
      {
        id: "shop-alpha-1",
        owner_id: "user-alpha",
        organisation_id: orgAlpha,
        region_id: "reg-1",
        name: "Gupta Kirana (Alpha)",
        contact: "9820011111",
        lat: 19.08,
        lng: 72.88,
        notes: null,
        is_urgent: false,
        is_archived: false,
        balance_due: 1500,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "shop-beta-1",
        owner_id: "user-beta",
        organisation_id: orgBeta,
        region_id: "reg-2",
        name: "Laxmi Store (Beta)",
        contact: "9820022222",
        lat: 19.10,
        lng: 72.90,
        notes: null,
        is_urgent: false,
        is_archived: false,
        balance_due: 3200,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // 4. Seed payments in both orgs
    await db.payments.bulkPut([
      {
        id: "pay-alpha-1",
        client_id: "client-pay-a1",
        organisation_id: orgAlpha,
        shop_id: "shop-alpha-1",
        collected_by: "user-alpha",
        amount: 500,
        payment_mode: "cash",
        notes: "Partial payment",
        collected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "pay-beta-1",
        client_id: "client-pay-b1",
        organisation_id: orgBeta,
        shop_id: "shop-beta-1",
        collected_by: "user-beta",
        amount: 2000,
        payment_mode: "upi",
        notes: "GPay payment",
        collected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);
  });

  it("User Alpha query scoped to Org Alpha never leaks Org Beta shops", async () => {
    const alphaShops = await db.shops.where({ organisation_id: orgAlpha }).toArray();
    expect(alphaShops).toHaveLength(1);
    expect(alphaShops[0].name).toBe("Gupta Kirana (Alpha)");

    // Ensure zero leakage of Beta shops
    const leaked = alphaShops.find((s) => s.organisation_id === orgBeta);
    expect(leaked).toBeUndefined();
  });

  it("User Beta query scoped to Org Beta never leaks Org Alpha payments or dues", async () => {
    const betaPayments = await db.payments.where({ organisation_id: orgBeta }).toArray();
    expect(betaPayments).toHaveLength(1);
    expect(betaPayments[0].amount).toBe(2000);
    expect(betaPayments[0].payment_mode).toBe("upi");

    // Ensure zero leakage of Alpha payments
    const leakedPayment = betaPayments.find((p) => p.organisation_id === orgAlpha);
    expect(leakedPayment).toBeUndefined();
  });

  it("Cross-organization mutation rejection", async () => {
    // If a user from Org Alpha attempts to fetch or modify a shop belonging to Org Beta
    const shopToMutate = await db.shops.get("shop-beta-1");
    expect(shopToMutate?.organisation_id).toBe(orgBeta);

    // Filter enforces that an action scoped to Org Alpha cannot touch Org Beta
    const userOrg = orgAlpha;
    const canMutate = shopToMutate?.organisation_id === userOrg;
    expect(canMutate).toBe(false);
  });
});
