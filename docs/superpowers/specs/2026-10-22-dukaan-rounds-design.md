# Waymark — Design Specification

> **Builder note:** This spec is the single source of truth. When the plan and this doc conflict, this doc wins. The plan's Global Constraints section copies the binding requirements from here verbatim.

## Intent and Why

An FMCG distributor's delivery person currently tracks shop restock schedules entirely from memory. The result: missed deliveries, last-minute "call me when you're out of stock" situations, lost sales, and eroded shopkeeper trust.

**The one job:** open the app → instantly know which shops to visit today. Zero navigation, zero mental work.

---

## Goals

- Tell the delivery person which shops are due today the moment they open the app.
- Let them mark a shop delivered in one tap (or two at most).
- Self-correct delivery intervals from cheap optional signals (stock feedback + urgent flag).
- Work reliably with poor mobile network (offline-first, sync later).
- Be fast enough for one-handed field use.

## Non-Goals

- Demand forecasting, ML, or stock counting.
- Warehouse inventory management.
- Survey-grade GPS or route optimisation.
- Any required input beyond "mark delivered."

## Anti-Goals (explicit failures even if it "works")

- A system that requires documenting quantities before marking delivered.
- A UI so complex the delivery person uses WhatsApp instead.
- Losing a delivery record because of a network outage.

---

## Users

| Role | Description | Key need |
|------|-------------|----------|
| **Delivery person** (owner, single user today) | In the field, one-handed, possibly in sunlight | See today's list instantly, mark done fast |
| **Admin/owner** (same person today, separate role later) | Office/home | See staff progress, manage shops/products/routes |

Today there is one user. Build the data model and auth for multi-staff from day one; show it in the UI only behind an owner role flag.

---

## Platform

**Hosted PWA** — installable on Android (primary) and iOS. Deployed on a cheap host (Vercel + Supabase free tier). No native app stores.

---

## Stack (builder's call, justified)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14 App Router** | PWA support, SSR for fast first load, excellent Vercel deploy story |
| Language | **TypeScript** | Catches the scheduling logic bugs that matter most |
| Database | **Supabase** (Postgres + Row Level Security) | Free tier, built-in auth, real-time subscriptions for future multi-staff, hosted |
| Offline | **Dexie.js** (IndexedDB wrapper) + service worker | Lightweight, proven, works without a framework plugin |
| Sync | Write-through to Dexie immediately; background sync to Supabase on reconnect via a sync queue | Simple and reliable for the scale |
| Auth | **Supabase Auth** (magic link / OTP) | No password for a single-person field tool; magic link sent once during setup |
| Push notifications | **Web Push API** + Supabase Edge Function cron | Daily reminder at a configurable time; escalation after 2 days unvisited |
| Styling | **Tailwind CSS** + CSS variables for design tokens | Utility-first, fast iteration, easy to match Notion-style spec |
| Icons | **Lucide** | Matches Notion's own icon style; spec mandates it |
| Maps | **Leaflet** (free, no API key for basic pin-drop) | Only needs tap-to-place pin and static display; no routing |
| State | **Zustand** (client) + React Query (server) | Lightweight; no Redux overhead for this scale |
| Testing | **Vitest** + **Playwright** | Unit/integration for scheduling logic; E2E for core flows |

**My call on hosting:** Vercel (free hobby plan for Next.js) + Supabase (free tier). \$0/month at this scale.

---

## Database Schema

```sql
-- Users (managed by Supabase Auth, extended here)
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  role        text NOT NULL DEFAULT 'delivery', -- 'owner' | 'delivery'
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- Godown (owner's warehouse, single row per owner)
godowns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES profiles,
  lat         float8 NOT NULL,
  lng         float8 NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- Regions / routes
regions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES profiles,
  name        text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
)

-- Shops (dukaans)
shops (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES profiles,
  region_id       uuid REFERENCES regions,
  name            text NOT NULL,
  contact         text,
  lat             float8,
  lng             float8,
  notes           text,
  is_urgent       bool NOT NULL DEFAULT false,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)

-- Products (catalogue)
products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES profiles,
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- Shop-product relationships with interval config
shop_products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             uuid REFERENCES shops ON DELETE CASCADE,
  product_id          uuid REFERENCES products ON DELETE CASCADE,
  default_qty         int NOT NULL DEFAULT 1,
  interval_days       int NOT NULL DEFAULT 7,   -- current delivery interval
  remind_offset_days  int NOT NULL DEFAULT 0,   -- 0-3: remind this many days early
  next_due_date       date NOT NULL,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(shop_id, product_id)
)

-- Delivery log (immutable append-only)
deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id         uuid REFERENCES shops,
  product_id      uuid REFERENCES products,
  delivered_by    uuid REFERENCES profiles,
  qty             int NOT NULL,
  delivered_at    timestamptz NOT NULL DEFAULT now(),
  stock_feedback  text,   -- 'low' | 'fine' | 'plenty' | null
  notes           text,
  synced          bool NOT NULL DEFAULT false,  -- for offline queue
  created_at      timestamptz DEFAULT now()
)

-- Offline sync queue (local Dexie only, never synced as a table)
-- sync_queue: { id, table, operation, payload, created_at }
```

### Scheduling Logic (the critical module)

`next_due_date` is computed and stored whenever a delivery is recorded. It is **not** recomputed on read. Formula:

```
next_due_date = delivered_at::date + interval_days - remind_offset_days
```

**Interval self-correction rules (applied at mark-delivered time):**

| Signal | Adjustment |
|--------|------------|
| `stock_feedback = 'low'` | `interval_days = max(1, interval_days - 1)` |
| `stock_feedback = 'plenty'` | `interval_days = min(60, interval_days + 1)` |
| `stock_feedback = 'fine'` | No change |
| `is_urgent = true` (shopkeeper called) | `next_due_date = today` immediately; reset `is_urgent = false` on delivery |

**Due today rule:** a shop is shown in the Today list when `shop_products.next_due_date <= today` for any of its active products.

**Escalation rule:** a shop stays at the top of the Today list (with escalation indicator) when `shop_products.next_due_date <= today - 2`.

Shops in the Today list are sorted: urgent first, then escalated (≥2 days overdue), then due today, within each group by region sort order.

---

## Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Today | `/` | Due list, signature screen |
| Routes | `/routes` | Browse all shops by region |
| Shop Detail | `/shops/[id]` | One shop, Notion-page style |
| Add/Edit Shop | `/shops/new`, `/shops/[id]/edit` | Property-list form |
| Add/Edit Product | `/products/new`, `/products/[id]/edit` | Simple form |
| Region Management | `/regions` | Create/reorder regions and shops |
| Team | `/team` | Owner only; staff progress table |
| Settings | `/settings` | Vehicle, notifications, account |
| Onboarding | `/onboarding` | First-run: pin godown, create first region |

---

## Offline Architecture

1. **Dexie.js** mirrors the server schema locally (same table names, same columns).
2. Every write goes to Dexie first, then appends an entry to `sync_queue`.
3. A service worker's `sync` event (Background Sync API) drains the queue when online.
4. On app start, if online, fetch and merge server state into Dexie (server wins on conflict for non-delivery records; delivery records are append-only so no conflict).
5. The Today list and all reads come from Dexie. The UI never awaits a network call for reads.

---

## Notifications

- **Daily reminder:** Supabase Edge Function cron job fires at 7:00 AM (configurable). If there are due shops for a user, send a Web Push notification: "You have N shops due today."
- **Escalation:** Same cron; if a shop has been due for ≥ 2 days unvisited, escalate: "⚠ [Shop Name] is 2 days overdue."
- Push subscription stored in `profiles.push_subscription` (JSON).

---

## Design Tokens (override from redesign-master-prompt.md)

> The redesign spec in `redesign-master-prompt.md` governs all visual decisions. The ui-ux-pro-max skill confirmed Minimalism & Swiss Style. The tokens below are from the spec; use them verbatim.

```css
--bg:              #FFFFFF;
--bg-subtle:       #F7F7F5;
--bg-hover:        #EFEFED;
--border:          #E9E9E7;
--text-primary:    #37352F;
--text-secondary:  #787774;
--text-tertiary:   #9B9A97;
--accent:          #2383E2;
--red-soft:        #EB5757;
--yellow-soft:     #DFAB01;
--green-soft:      #0F7B6C;
```

Typography: Inter, 14px body, 13px meta, 20px page titles, 16px section headers. Spacing scale: 4/8/12/16/24/32/48px only. Border-radius: 6px buttons/inputs, 8px containers. Icons: Lucide, 16-18px, `--text-secondary`. Near-zero animation: 120-150ms ease-out hover/opacity only. Exception: checkbox tick on "Today" screen, ~150ms.

---

## Build Order (milestones)

### Milestone 1 — Core Loop (ship this first)
- Project scaffold (Next.js, Tailwind, Supabase, Dexie, Vitest, Playwright)
- Auth (magic link)
- Database schema + RLS policies
- Scheduling logic module (pure functions, fully tested)
- Today screen (due list, mark delivered, urgent flag, inline stock feedback)
- Offline: Dexie mirror + sync queue + service worker

### Milestone 2 — Shop Management
- Add/Edit Shop (with map pin, reminder-offset slider)
- Shop Detail (products, notes, history)
- Add/Edit Product
- Region Management

### Milestone 3 — Routes + Navigation
- Routes browse view (collapsible regions, live search)
- Sidebar + mobile bottom tab bar
- Expense estimator (distance + fuel cost)

### Milestone 4 — Notifications + Team
- Web Push setup + Supabase cron
- Daily + escalation notifications
- Team view (owner only)
- Settings page

### Milestone 5 — Polish + PWA
- PWA manifest + install prompt
- Onboarding flow
- Final UI pass against redesign-master-prompt.md "don't" list
- E2E tests for core flows

---

## Mark-Delivered Flow (approved by owner)

**Option B:** When a shop row is tapped on the Today screen, it expands inline showing each due product with its pre-filled `default_qty` (editable). A single "Confirm" button submits all products at once. Stock feedback (low/fine/plenty) is per-product. Normal case = 2 taps total. Self-correction fires per-product using per-product stock feedback.

- One `deliveries` row is written per product per shop visit.
- `qty` is pre-filled; the user may change it but is not required to.
- `next_due_date` and `interval_days` are updated per-product at confirm time.

---

## Builder's Explicit Calls

1. **Leaflet over Google Maps** — free, no API key, sufficient for a tap-to-place pin. If the owner wants address search, add a free Nominatim geocoder later.
2. **One interval per shop, per-product override** — `shop_products.interval_days` is the per-product interval; for shops with one product it's the shop interval.
3. **Supabase free tier** — 500MB DB, 1GB bandwidth. Sufficient for ~100–200 shops.
4. **Magic link auth** — no password to forget; set up once on WiFi.
5. **No real-time sync in Milestone 1** — reads always come from Dexie; background sync on reconnect.
6. **`remind_offset_days` stored on `shop_products`** — keeps scheduling simple and auditable.
7. **Delivery records are immutable** — no edit/delete. Preserves history; eliminates sync conflicts.
8. **`next_due_date` defaults to `today` on new `shop_products` insert** — shop surfaces immediately; owner visits soon.
9. **`qty` pre-filled from `default_qty`; not required to change** — satisfies "mark delivered in one tap (or two)."
10. **Owner role only** for create/edit/delete of shops, products, regions, intervals. Delivery role: mark delivered, flag urgent, add stock feedback.
11. **`is_urgent`** can be set by delivery person (Today screen) or owner (Team view). Resets to `false` on delivery. Last write wins.
12. **Timezone: IST (UTC+5:30)** hard-coded in server cron. Client reads use browser local date from Dexie.
13. **Expense estimator uses haversine (straight-line)** with `≈` prefix. Route optimisation is a non-goal; Leaflet + one function is sufficient.
14. **App name: Waymark.**
