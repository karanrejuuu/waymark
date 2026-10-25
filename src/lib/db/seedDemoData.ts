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

  const rFortKochi = {
    id: "reg-fortkochi",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Fort Kochi",
    sort_order: 1,
    created_at: now.toISOString(),
  };
  const rMattancherry = {
    id: "reg-mattancherry",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Mattancherry",
    sort_order: 2,
    created_at: now.toISOString(),
  };
  const rMarineDrive = {
    id: "reg-marinedrive",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    name: "Marine Drive",
    sort_order: 3,
    created_at: now.toISOString(),
  };
  await db.regions.bulkPut([rFortKochi, rMattancherry, rMarineDrive]);

  await db.godowns.put({
    id: "godown-1",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    lat: 9.965,
    lng: 76.242,
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
    name: "Frooti Mango 200ml (Crate of 30)",
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
    id: "shop-stantony",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rFortKochi.id,
    name: "St. Antony's Bakers & Provisions",
    contact: "9847012345",
    lat: 9.965,
    lng: 76.242,
    notes: "Princess Street, near Santa Cruz Basilica. Front counter cash.",
    is_urgent: true,
    sort_order: 1,
    balance_due: 1450.0,
    is_archived: false,
    reminder_date: todayStr,
    reminder_note: "Check Frooti crate return & collect ₹1,450 cheque from manager",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s2 = {
    id: "shop-cochin-spice",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rFortKochi.id,
    name: "Cochin Spice Traders",
    contact: "9847023456",
    lat: 9.968,
    lng: 76.244,
    notes: "Bazaar Road, Fort Kochi. Rear alley loading bay.",
    is_urgent: false,
    sort_order: 2,
    balance_due: 3200.0,
    is_archived: false,
    reminder_date: null,
    reminder_note: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s3 = {
    id: "shop-princess-daily",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rFortKochi.id,
    name: "Princess Street Daily Store",
    contact: "9847034567",
    lat: 9.966,
    lng: 76.241,
    notes: "Princess Street. Drop stock before 8:30 AM school rush.",
    is_urgent: false,
    sort_order: 3,
    balance_due: 0,
    is_archived: false,
    reminder_date: null,
    reminder_note: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s4 = {
    id: "shop-calvathy-super",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rFortKochi.id,
    name: "Calvathy Supermarket",
    contact: "9847045678",
    lat: 9.962,
    lng: 76.247,
    notes: "Calvathy Canal Rd. Weekly bill-to-bill settlement.",
    is_urgent: false,
    sort_order: 4,
    balance_due: 2100.0,
    is_archived: false,
    reminder_date: null,
    reminder_note: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s5 = {
    id: "shop-aspinwall",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rFortKochi.id,
    name: "Aspinwall General Stores",
    contact: "9847056789",
    lat: 9.969,
    lng: 76.245,
    notes: "Calvathy junction. Fast Parle-G biscuit turnover.",
    is_urgent: false,
    sort_order: 5,
    balance_due: 850.0,
    is_archived: false,
    reminder_date: null,
    reminder_note: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s6 = {
    id: "shop-mattancherry-kirana",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rMattancherry.id,
    name: "Mattancherry Kirana Depot",
    contact: "9847067890",
    lat: 9.957,
    lng: 76.258,
    notes: "Jew Town Road, near Synagogue. Cash on delivery.",
    is_urgent: false,
    sort_order: 6,
    balance_due: 1750.0,
    is_archived: false,
    reminder_date: null,
    reminder_note: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const s7 = {
    id: "shop-kayees",
    organisation_id: demoOrgId,
    owner_id: "demo-user",
    region_id: rMattancherry.id,
    name: "Kayees Provision Store",
    contact: "9847078901",
    lat: 9.955,
    lng: 76.259,
    notes: "Gujarati Road, Mattancherry.",
    is_urgent: false,
    sort_order: 7,
    balance_due: 0.0,
    is_archived: false,
    reminder_date: null,
    reminder_note: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  await db.shops.bulkPut([s1, s2, s3, s4, s5, s6, s7]);

  await db.shop_products.bulkPut([
    {
      id: "sp-sa-1",
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
      id: "sp-sa-2",
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
      id: "sp-cs-1",
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
      id: "sp-pd-1",
      organisation_id: demoOrgId,
      shop_id: s3.id,
      product_id: p4.id,
      default_qty: 3,
      interval_days: 7,
      remind_offset_days: 1,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-cv-1",
      organisation_id: demoOrgId,
      shop_id: s4.id,
      product_id: p1.id,
      default_qty: 5,
      interval_days: 5,
      remind_offset_days: 0,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-as-1",
      organisation_id: demoOrgId,
      shop_id: s5.id,
      product_id: p2.id,
      default_qty: 3,
      interval_days: 7,
      remind_offset_days: 0,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
    {
      id: "sp-mk-1",
      organisation_id: demoOrgId,
      shop_id: s6.id,
      product_id: p4.id,
      default_qty: 4,
      interval_days: 10,
      remind_offset_days: 2,
      next_due_date: todayStr,
      snooze_until: null,
      created_at: now.toISOString(),
    },
  ]);
}
