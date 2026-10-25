import { db } from "./dexie";
import { formatDateOnly } from "../scheduling";

/**
 * Seed realistic FMCG distribution sample shops, products, and intervals.
 * Pre-seeds 4 high-frequency market counters with real products and dues.
 */
export async function seedDemoData() {
  const now = new Date();
  const todayStr = formatDateOnly(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateOnly(yesterday);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = formatDateOnly(threeDaysAgo);

  const demoOrgId = "org-waymark-demo";

  await db.organisations.put({
    id: demoOrgId,
    name: "Apex FMCG Distributors",
    currency: "INR",
    created_at: now.toISOString(),
  });

  const rNorth = {
    id: "reg-north",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "North Market",
    sort_order: 1,
    created_at: now.toISOString(),
  };
  const rStation = {
    id: "reg-station",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Station Road",
    sort_order: 2,
    created_at: now.toISOString(),
  };
  await db.regions.bulkPut([rNorth, rStation]);

  await db.godowns.put({
    id: "godown-1",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    lat: 19.076,
    lng: 72.8777,
    vehicle_mileage_kmpl: 25.0,
    petrol_price_per_l: 104.5,
    created_at: now.toISOString(),
  });

  const p1 = {
    id: "p-parle",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Parle-G Glucose (Case of 24)",
    default_interval: 5,
    created_at: now.toISOString(),
  };
  const p2 = {
    id: "p-frooti",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Frooti Mango 200ml (Crate)",
    default_interval: 7,
    created_at: now.toISOString(),
  };
  const p3 = {
    id: "p-maggi",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Maggi 2-Minute Noodles (Box of 48)",
    default_interval: 6,
    created_at: now.toISOString(),
  };
  const p4 = {
    id: "p-tata-tea",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Tata Tea Gold 250g (Pack of 12)",
    default_interval: 10,
    created_at: now.toISOString(),
  };
  await db.products.bulkPut([p1, p2, p3, p4]);

  const s1 = {
    id: "shop-gupta",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rNorth.id,
    name: "Gupta Kirana & General Store",
    contact: "9820011223",
    lat: 19.082,
    lng: 72.883,
    notes: "Prefers morning delivery before 11 AM. Cash on delivery.",
    is_urgent: true,
    sort_order: 1,
    balance_due: 1450.0,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s2 = {
    id: "shop-laxmi",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rNorth.id,
    name: "Laxmi Supermarket",
    contact: "9820044556",
    lat: 19.089,
    lng: 72.889,
    notes: "Counter in rear lane. Key is with cashier.",
    is_urgent: false,
    sort_order: 2,
    balance_due: 3200.0,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s3 = {
    id: "shop-anand",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rStation.id,
    name: "Anand Tea Depot",
    contact: "9820077889",
    lat: 19.071,
    lng: 72.872,
    notes: "High tea consumption. Check stock every Friday.",
    is_urgent: false,
    sort_order: 3,
    balance_due: 0,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s4 = {
    id: "shop-bharat",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rStation.id,
    name: "Bharat Daily Needs",
    contact: "9820099001",
    lat: 19.068,
    lng: 72.865,
    notes: "Closed on Tuesdays.",
    is_urgent: false,
    sort_order: 4,
    balance_due: 850.0,
    is_archived: false,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await db.shops.bulkPut([s1, s2, s3, s4]);

  await db.shop_products.bulkPut([
    {
      id: "sp-g-1",
      organisation_id: demoOrgId,
      shop_id: s1.id,
      product_id: p1.id,
      default_qty: 3,
      interval_days: 5,
      remind_offset_days: 0,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-g-2",
      organisation_id: demoOrgId,
      shop_id: s1.id,
      product_id: p2.id,
      default_qty: 2,
      interval_days: 7,
      remind_offset_days: 1,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-l-1",
      organisation_id: demoOrgId,
      shop_id: s2.id,
      product_id: p3.id,
      default_qty: 4,
      interval_days: 6,
      remind_offset_days: 0,
      next_due_date: threeDaysAgoStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-a-1",
      organisation_id: demoOrgId,
      shop_id: s3.id,
      product_id: p4.id,
      default_qty: 5,
      interval_days: 10,
      remind_offset_days: 2,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-b-1",
      organisation_id: demoOrgId,
      shop_id: s4.id,
      product_id: p1.id,
      default_qty: 2,
      interval_days: 7,
      remind_offset_days: 0,
      next_due_date: formatDateOnly(new Date(now.getTime() + 5 * 86400000)),
      snooze_until: null,
      created_at: now.toISOString(),
    },
  ]);
}
