# Redesign Master Prompt — Notion-Style Minimal UI

Paste this whole thing into Antigravity. It replaces whatever visual/UX
decisions the first pass made — keep all existing data logic, schema,
and backend functionality exactly as is. This prompt only governs how
it looks and how each screen behaves.

---

## 0. Non-negotiable rule

Do NOT touch business logic, database schema, scheduling/interval
calculations, or API calls. This is a pure UI/UX rebuild on top of the
existing functionality. If a component needs to be restructured to
support the new design, preserve its existing props/data contracts.

---

## 1. Design System (Notion-style minimal)

### Visual language
Flat, calm, content-first. No gradients, no drop shadows beyond a
1px hairline, no rounded-pill buttons, no card-heavy dashboards with
colorful icons. Whitespace and typography do the work, not color or
decoration. Think: a clean document that happens to have interactive
elements, not an "app" with chrome everywhere.

### Color tokens
```
--bg: #FFFFFF
--bg-subtle: #F7F7F5      /* sidebar, hover states */
--bg-hover: #EFEFED
--border: #E9E9E7          /* hairline dividers only, 1px */
--text-primary: #37352F    /* Notion's signature near-black */
--text-secondary: #787774
--text-tertiary: #9B9A97
--accent: #2383E2          /* single blue, used sparingly for links/primary actions */
--red-soft: #EB5757        /* urgent/overdue only */
--yellow-soft: #DFAB01     /* due-soon only */
--green-soft: #0F7B6C      /* ok/fine status only */
```
Status colors (red/yellow/green) are used ONLY as small text labels or
tiny dot indicators — never as full-card background fills. Never use
more than one accent color on a screen at once besides status dots.

### Typography
- Font: Inter or system-ui stack (`-apple-system, "Segoe UI", Inter, sans-serif`)
- One typeface for everything — no separate display font. Notion's
  entire personality comes from weight/size discipline, not font mixing.
- Scale: 14px body (default), 13px secondary/meta text, 20px page
  titles, 16px section headers. Line-height 1.5 for body, 1.3 for
  headers.
- Weight: 400 body, 500 for emphasis/labels, 600 only for page titles.
  Never bold entire sentences.

### Layout
- Max content width ~720-840px on any single-column page, left-aligned,
  generous left/right margin — never edge-to-edge text.
- Sidebar (if present) is 240px, `--bg-subtle` background, hairline
  right border, not a floating card.
- No box-shadow anywhere except a very subtle one (`0 1px 2px
  rgba(0,0,0,0.04)`) on modals/popovers only.
- Border-radius: 6px on buttons/inputs, 8px on larger containers. Never
  fully rounded/pill buttons.
- Spacing scale: 4/8/12/16/24/32/48px — pick from this list only, no
  arbitrary padding values.

### Components
- Buttons: flat, `--bg-subtle` background with hairline border for
  secondary; solid `--accent` only for the single primary action per
  screen. No icon-only buttons without a text label unless it's a
  universally understood icon (search, close, back).
- Lists over cards: prefer simple row-based lists with hairline
  dividers between rows (Notion table/list style) over boxed cards with
  shadows. Use a card only where visually grouping unrelated
  information genuinely helps (e.g. a single shop's detail summary).
- Inputs: flat, hairline border, no heavy focus glow — a simple border
  color change + 1px accent outline on focus.
- Icons: use a single consistent icon set (Lucide — matches Notion's
  actual icon style), 16-18px, `--text-secondary` color, never colorful
  icon badges.
- Status indicators: small colored dot (8px circle) + text label, not
  colored pill badges with background fill.
- Motion: near-none. 120-150ms ease-out on hover/opacity changes only.
  No slide-ins, no bounce, no page-transition animations.

### The one signature element
Since this is a field-use logistics tool, the signature moment is the
**Due Today list** — treat it like a Notion database view: a clean,
dense, checkbox-driven list where marking a delivery "done" feels as
satisfying and fast as checking off a Notion to-do. This is the one
place worth extra craft (satisfying checkbox tick animation, ~150ms,
nothing else on the page moves).

---

## 2. Page-by-Page UX Spec

### A. Home / Due Today Dashboard
**Job:** delivery person sees exactly who to visit today, in under 2 seconds, zero navigation.

- Page title: "Today" (not "Dashboard" — plain, human language)
- Directly below title: small meta line — "6 shops due · 1 urgent" in `--text-secondary`
- Urgent shops render first, marked with a red dot + "Urgent" label (not a red banner/card)
- Each row: shop name (14px, 500 weight) — region tag (small, `--text-tertiary`, right-aligned) — checkbox on far right
- Tapping the row (not just the checkbox) expands inline to show: products due, quick quantity input, optional 🔴🟡🟢 stock-feedback tap, "Mark delivered" button
- No card backgrounds, no shadows — just rows separated by hairline dividers, exactly like a Notion table
- Empty state (nothing due): plain centered text, "Nothing due today" + secondary line "Check the route view to browse all shops" — no illustration, no emoji-heavy graphic

### B. Route / Region Browse View
**Job:** manually browse all shops in a region regardless of due status.

- Grouped by region as collapsible sections (Notion-style toggle
  triangles ▸/▾), not tabs or separate pages
- Each shop row inside a region shows: name, last delivered date
  (relative — "5 days ago"), small status dot
- Search bar pinned at top, plain text input with a search icon, filters
  live as you type — no separate search page/modal
- No map thumbnail here — keep this view purely list/text based for
  speed; map lives only in shop detail

### C. Shop Detail Page
**Job:** everything about one shop, one clean document.

- Layout mimics a Notion page: title (shop name) at top, editable
  inline on click, small property list right below title in Notion's
  "properties" style:
  - Region: [tag]
  - Contact: [number]
  - Status: [dot + label]
  - Distance from godown: [value] · Est. fuel cost: [value]
- Below properties: a thin divider, then sections in this order:
  1. **Products** — table-style list: product name, interval, last
     delivered, next due, reminder offset — each row editable inline
  2. **Notes** — plain text block, click to edit, auto-saves (exactly
     like a Notion text block, no separate "save" button)
  3. **History** — simple reverse-chronological log, date + qty +
     delivered-by, no pagination needed for MVP (just scroll)
  4. **Map** — small embedded map at the very bottom (least important,
     shown last), pin only, no directions UI needed

### D. Add/Edit Shop
**Job:** fast form, feels like filling in a Notion page's properties, not a "form."

- No modal popup for this — full page, matches the Shop Detail layout
  exactly (same property-list style) so editing and viewing feel
  identical, just with editable fields active immediately
- Map pin: "Tap on map to place shop location" — simple instruction
  text above an embedded map, single pin, no address search bar unless
  they want to type an area name first (optional convenience only)
- After save, immediately show the reminder-offset slider inline (not a
  separate step/page): "Remind me earlier: [0 ── 1 ── 2 ── 3] days"
  styled as a plain horizontal slider with tick marks, Notion doesn't
  have sliders natively so keep this one flat and minimal — thin track,
  small circular handle, no gradient fill

### E. Add/Edit Product
**Job:** trivial, rarely used after initial setup.

- Same property-list page style as shop — name field, default interval
  number input
- Keep this screen boring on purpose — it's not a frequently visited
  page, don't over-invest polish here

### F. Region/Route Management
**Job:** create regions, assign shops, reorder.

- Simple list of regions, "+ New region" as a plain text link/button at
  bottom (Notion's "+ New page" pattern), not a floating action button
- Reordering shops within a region: drag handle (⠿ icon) on the left of
  each row, standard drag-to-reorder, no fancy animation beyond the
  dragged row lifting with the subtle shadow token

### G. Urgent Call-In Flow
**Job:** one-tap escalation when a shopkeeper calls.

- Accessible from the Home dashboard as a plain text button at the top:
  "+ Mark shop urgent" — opens a lightweight search-and-select
  (type shop name, tap to confirm), not a full-page flow
- Confirmation is instant and quiet: shop simply reappears at top of
  Today list with the red dot — no toast/popup celebration needed, the
  list re-sorting itself IS the confirmation

### H. Team/Admin View (owner only)
**Job:** glanceable overview of all staff's progress, for later multi-staff use.

- Table layout: staff name | shops due | shops completed | last active
  — literally a Notion database table view, sortable by column header
  click
- No charts/graphs here for MVP — a clean table is enough, resist the
  urge to add a colorful summary dashboard on top

### I. Expense Estimator (section within Shop/Route view)
**Job:** small, secondary, informational — never the focus of a screen.

- Rendered as a quiet inline text block, not a card or widget:
  "≈ 4.2 km from godown · ₹28 estimated fuel cost"
- Settings (mileage, petrol price) live in a plain Settings page,
  simple label + input rows, nothing decorative

### J. Settings
**Job:** boring utility page, Notion-style simple form.

- Grouped sections with small uppercase `--text-tertiary` section
  labels ("VEHICLE", "NOTIFICATIONS", "ACCOUNT"), each a simple list of
  label-left/control-right rows, hairline dividers between rows —
  exactly like Notion's own settings page

---

## 3. Navigation Structure

- Left sidebar (240px, collapsible on mobile into a bottom tab bar):
  - Today (home)
  - Routes
  - Shops (search/browse all)
  - Team (only visible to owner role)
  - Settings
- On mobile: bottom tab bar with just icons + labels for Today / Routes
  / Search / Settings — keep to 4 max, this is a field tool used
  one-handed, don't overload the tab bar
- No hamburger menu, no nested navigation drawers — Notion-style flat
  structure, everything reachable in one tap from sidebar/tab bar

---

## 4. Explicit "don't" list (things that made it look bad the first time)

- No colorful gradient headers or hero banners
- No card grids with icons and shadows for the dashboard
- No emoji used as UI icons (only allowed as the optional stock-feedback tap: 🔴🟡🟢)
- No rounded pill-shaped buttons or tags
- No dark-mode-only-looking neon accents
- No stock illustration/mascot graphics on empty states
- No more than one accent color per screen besides status dots
- No heavy box-shadows on every card — Notion has almost none

---

## 5. Instruction to the AI tool

Rebuild every screen listed in section 2 using the tokens in section 1.
Keep all existing routes, data fetching, and backend logic untouched —
this is purely a component/style rewrite. After rebuilding, check every
page against section 4's "don't" list before considering it done.
