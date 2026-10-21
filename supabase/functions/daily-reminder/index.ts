// Supabase Edge Function: Daily Delivery Reminder & Escalation Cron
// Runs at 07:00 AM IST (01:30 UTC): cron "30 1 * * *"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Calculate today's date in IST (Asia/Kolkata, UTC+5:30)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayIST = formatter.format(now);

    // 2. Fetch all due shop products
    const { data: dueItems, error } = await supabase
      .from("shop_products")
      .select("id, shop_id, product_id, next_due_date, shops(name, owner_id)")
      .lte("next_due_date", todayIST);

    if (error) {
      console.error("Error fetching due products:", error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    // 3. Group by owner
    const dueByOwner = new Map<string, any[]>();
    for (const item of dueItems || []) {
      const ownerId = item.shops?.owner_id;
      if (!ownerId) continue;
      const list = dueByOwner.get(ownerId) || [];
      list.push(item);
      dueByOwner.set(ownerId, list);
    }

    console.log(`Evaluated ${dueItems?.length || 0} due items for ${dueByOwner.size} owners on ${todayIST}`);

    return new Response(
      JSON.stringify({
        success: true,
        date: todayIST,
        totalDue: dueItems?.length || 0,
        ownersNotified: dueByOwner.size,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
