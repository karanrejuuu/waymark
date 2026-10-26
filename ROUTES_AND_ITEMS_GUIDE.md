# Waymark — FMCG Supplier Route & Items Field Manual
> **Operational Guide for Field Suppliers, Tempo Drivers & Agency Dispatchers**  
> *Designed for real-world route distribution in Fort Kochi, Mattancherry, and high-density retail corridors.*

---

## 1. Overview: The Walk-to-Car Workflow

In retail FMCG distribution across India (Kirana stores, bakeries, tea stalls), a supplier visits **30 to 50 shops per day**. You cannot rely on paper diaries or driver memory after returning to the warehouse at night.

**Waymark solves this with the 10-Second Walk-to-Car Protocol:**
1. Drop the stock crates at the counter.
2. While walking back to your car or tempo, open the app on your phone.
3. Tap **Log Visit & Set Reminder** on the shop card.
4. Tap quick crate chips (`+1`, `+2`, `+5`, `+10`), record cash/credit, and select your next visit reminder (`Tomorrow`, `2 Days`, `3 Days`, `1 Week`).
5. Tap **Save & Complete Stop** — the record is saved to the offline database, and the **next shop in the sequence automatically opens**.

---

## 2. Delivery Corridors & Routes

Instead of complex, failure-prone GPS map navigation, Waymark organizes deliveries by **Named Corridors / Territory Beats**. Every shop in that market belongs to the same route beat.

### Pre-Configured Corridors

| Corridor / Route | Territory Description | Typical Stop Density | Key Landmarks |
| :--- | :--- | :--- | :--- |
| **Fort Kochi Beat** (`reg-fortkochi`) | High-density tourist, bakery, and heritage retail stores | 18–25 stores / day | Princess Street, Santa Cruz Basilica, Calvathy Canal, Bazaar Road, Cochin Club |
| **Mattancherry Beat** (`reg-mattancherry`) | Traditional wholesale groceries, spice traders, and provision depots | 14–20 stores / day | Jew Town, Gujarati Road, Palace Road, Synagogue Junction |
| **Marine Drive Beat** (`reg-marinedrive`) | High-traffic commercial counters and convenience stands | 12–16 stores / day | Shanmugham Road, Broadway Junction, Menaka Market |

### Adding a New Route on the Fly
- In the left sidebar under **Routes & Areas**, tap the **`+`** icon.
- Type the new area name (e.g., `Edappally`, `Kaloor`, `Palarivattom`) and press enter.
- The corridor is immediately created and available for shop assignments.

---

## 3. Product Catalog & Crate Units

FMCG wholesale replenishment operates in standardized crate/case packaging units:

| Product Item | Package Specification | Packaging Unit | Typical Drop | Turnover Cycle |
| :--- | :--- | :--- | :--- | :--- |
| **Parle-G Glucose 100g** | 24 packets per outer case | **Case** | 3–6 Cases | Fast (3–5 Days) |
| **Frooti Mango 200ml** | 30 tetra bricks per plastic crate | **Crate** | 2–5 Crates | Daily to 7 Days |
| **Maggi 2-Minute Noodles** | 48 packets per wholesale carton | **Box** | 2–4 Boxes | 6–8 Days |
| **Tata Tea Gold 250g** | 12 carton boxes per master pack | **Pack** | 2–5 Packs | 10–14 Days |
| **Britannia Good Day 100g** | 36 packets per corrugated box | **Box** | 2–4 Boxes | 5–7 Days |
| **Surf Excel Easy Wash** | 12 bags (1kg each) per bale | **Bale** | 1–2 Bales | 14 Days |

---

## 4. The 7 Visit Outcome States

When recording a stop in the Walk-to-Car Slip, suppliers can choose between 4 primary counter interaction states:

```
[ Visit Outcome Selection ]
 ├── 1. Delivered & Paid      -> Stock unloaded + Cash/UPI collected immediately.
 ├── 2. Delivered (Credit)    -> Stock unloaded + Invoice added to retailer's balance due (Khata).
 ├── 3. No Order / Full Stock -> Retailer has sufficient crates; delivery deferred to next cycle.
 └── 4. Shop Closed           -> Counter shutter down; automatically reschedules retry for tomorrow.
```

---

## 5. Scheduled Reminder Engine (Never Forget a Store Request)

### The Problem
During a drop, a Kirana storekeeper might say:
> *"Bhaiya, come back in 3 days on Friday before 11 AM with 2 extra Frooti crates, and I will give you ₹1,450 by cheque."*

If you don't write this down immediately, by the time you complete 40 other shops, the request is lost.

### The Solution: One-Tap Scheduled Reminders
Inside the Walk-to-Car Slip, select one of the single-tap reminder presets:
- **`[ Tomorrow ]`** (+1 day)
- **`[ In 2 Days ]`** (+2 days)
- **`[ In 3 Days ]`** (+3 days)
- **`[ In 1 Week ]`** (+7 days)
- **`[ Pick Date ]`** (select specific calendar day)

Type the instruction note into the reminder box:
`"Check Frooti stock, collect ₹1,450 cheque from manager before 11 AM"`

### What Happens on That Day?
- When the date arrives, Waymark's engine identifies `reminder_date <= today`.
- The shop **automatically appears on your Home Page under Today's Run**, highlighted with a purple reminder alert banner and the exact note displayed above the action buttons.

---

## 6. Fast "New Shop on the Road" Entry

When travelling along a route (e.g., driving down Beach Road in Fort Kochi) and you spot a new Kirana store or bakery:
1. Tap the top-right neon lime **`+ Add Shop`** button.
2. The corridor is **automatically pre-selected as Fort Kochi**.
3. Enter:
   - **Shop Name** (e.g., `Paulson General Store & Bakery`)
   - **Landmark** (e.g., `Near Beach Walk, opposite Cochin Club`)
   - **Phone / Owner Name** (optional)
   - **Initial Crates Dropped** (optional, defaults to 2)
   - **Opening Due Balance** (optional)
4. Tap **Add to Route Now**.
5. The store is immediately written to the local offline database and inserted into today's active route sequence!

---

## 7. Khata Dues & Route Ledger (CDNX Wallet View)

The **Dues & Ledger** tab functions like a real-time digital cash register:
- **Total Route Balance Due**: Displays the total pending credit across all shops in that corridor (e.g., `₹38,450 in Fort Kochi`).
- **Store-by-Store Breakdown**: Lists all shops carrying credit balances.
- **Quick Cash Collection Chips**:
  - `+ ₹500`
  - `+ ₹1,000`
  - `+ ₹2,000`
  - `Full Due (₹...)`
- Tap **Apply & Clear** to instantly deduct the collected amount from the shop's balance due and record the transaction in the audit log.

---

## 8. Summary of Keyboard Shortcuts & Quick Navigation

| Action | Mobile Gesture / Desktop Shortcut | What it Does |
| :--- | :--- | :--- |
| **Search 50 Shops** | `⌘K` or tap search bar | Instant live filter by shop name, contact number, or note |
| **Quick Deliver** | Tap `✓ Quick Deliver` on card | 1-tap marks default crates delivered without opening the slip |
| **Open Slip** | Tap `Log Visit & Set Reminder` | Opens Walk-to-Car Slip (bottom drawer on mobile, pinned on desktop) |
| **Switch Route** | Tap any corridor in sidebar | Filters the view to that specific market beat (e.g. Mattancherry) |
| **Direct Call** | Tap phone icon next to contact | Launches native phone dialer with storekeeper's number |
