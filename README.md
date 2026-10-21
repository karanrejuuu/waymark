# Waymark

> **A minimal, offline-first delivery round reminder PWA for FMCG distributors.**

Waymark solves the scheduling and remembering problem for FMCG route deliveries. It eliminates missed restocks and last-minute "we are out of stock" emergency calls by providing a zero-navigation daily due list with single/double-tap delivery logging and self-correcting restock intervals.

---

## ✦ Core Features

- **Zero-Navigation "Today" Due List:** The moment you open the app, you see exactly which shops to visit today.
- **Fast 1-2 Tap Field Logging:** Check the box for immediate delivery or expand inline for quantity adjustment and optional stock feedback (🔴 Low / 🟡 Fine / 🟢 Plenty).
- **Self-Correcting Delivery Cycles:** Adapts intervals automatically based on field signals (e.g., low stock reduces gap by 1 day; urgent calls bump the shop to today).
- **Full Offline PWA:** Powered by Dexie.js (IndexedDB) and Background Sync. Reads and writes happen locally first; background sync uploads to Supabase when reconnected.
- **Notion-Style Minimal UI:** Pure content-first visual language. Flat, calm, hairline borders, no heavy shadows, no card clutter, Inter typography.
- **Expense & Fuel Estimator:** Calculates straight-line distance and estimated fuel costs using vehicle mileage and petrol rates set in settings.
- **Route & Region Management:** Group shops by route and reorder visitation sequence with drag-and-drop.
- **Team / Admin Progress:** Sortable database table tracking staff completions and due counts.

---

## 🛠 Tech Stack

| Layer | Choice | Details |
|---|---|---|
| **Framework** | Next.js 14 App Router | React 18, TypeScript, Tailwind CSS |
| **Local Store (Offline)** | Dexie.js (IndexedDB) | Reactive live queries, offline-first |
| **Backend & Database** | Supabase | Postgres with Row Level Security & Auth |
| **Sync Engine** | Background Sync Queue | Idempotent upserts with client-generated UUIDs |
| **Maps** | Leaflet | Tap-to-place pin drop with zero required API keys |
| **Testing** | Vitest & Playwright | 27 unit & integration tests covering scheduling |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-web-push-public-key
```

### 3. Database Migration
Apply the SQL migrations to your Supabase project:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser or mobile device.

### 5. Run Test Suite
```bash
npm test
```

---

## 📐 Scheduling Logic & Rules

`next_due_date` is calculated deterministically upon delivery:
```
next_due_date = delivered_at::date + interval_days - remind_offset_days
```

**Interval Self-Correction:**
- `stock_feedback = 'low'` → `interval_days = max(1, interval_days - 1)`
- `stock_feedback = 'plenty'` → `interval_days = min(60, interval_days + 1)`
- `stock_feedback = 'fine'` → No change
- `is_urgent = true` → Shop moves to today immediately and resets to false upon delivery.
