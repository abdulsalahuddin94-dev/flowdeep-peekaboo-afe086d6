# Nexus PMO — Design System Reference

> **For AI tools and Lovable:** Read this file before generating any new screen, component, or layout. Every design decision must follow these rules. Do not invent colours, radii, or patterns that are not listed here.

---

## 1. Visual Language

**Dark, glassmorphic, data-dense.** Nexus PMO is a professional SaaS dashboard. The aesthetic is:
- Deep navy background with subtle teal radial glow
- Semi-transparent glass cards with soft borders
- Teal (`#51CAAD`) as the single accent colour — used sparingly
- No white surfaces. No light mode. Everything is dark.
- Typography is clean and minimal — Outfit font, medium weight headers

---

## 2. Colour Tokens

Use these CSS variables everywhere. Never hardcode a hex value that isn't defined here.

### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0B1120` | Page background |
| `--surface` | `#0F1729` | Sidebar, popovers, elevated surfaces |
| `--foreground` | `#E2E8F0` | Primary text |
| `--muted-foreground` | `#94A3B8` | Secondary/label text |
| `--border` | `rgba(255,255,255,0.08)` | All borders |
| `--card` | `rgba(255,255,255,0.04)` | Card backgrounds |
| `--secondary` | `rgba(255,255,255,0.06)` | Subtle hover/fill backgrounds |
| `--input` | `rgba(255,255,255,0.06)` | Input field backgrounds |

### Accent (Teal)

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#51CAAD` | Primary CTA buttons, active states, links, icons |
| `--accent-foreground` | `#06231D` | Text on teal backgrounds |
| `--accent-dim` | `rgba(81,202,173,0.12)` | Teal chip backgrounds, selected state fills |
| `--accent-glow` | `rgba(81,202,173,0.25)` | Glow effects, focus rings |
| `--ring` | `rgba(81,202,173,0.4)` | Focus ring on inputs |

### RAG Status Colours

Used exclusively for project health, risk scoring, and status indicators. Never use for decoration.

| Token | Value | Meaning |
|---|---|---|
| `--rag-green` | `#10B981` | On track / healthy / approved |
| `--rag-amber` | `#F59E0B` | At risk / warning / pending |
| `--rag-red` | `#EF4444` | Critical / error / rejected |
| `--rag-blue` | `#3B82F6` | Not started / informational / new |
| `--rag-grey` | `#64748B` | On hold / inactive / archived |

RAG colours have matching dim variants used for backgrounds:
```
bg-rag-green/10   bg-rag-amber/10   bg-rag-red/10   bg-rag-blue/10
border-rag-green/30  border-rag-amber/30  etc.
```

### Role Colours

Each user role has a dedicated colour for badges and indicators.

| Role | Token | Hex |
|---|---|---|
| Executive / C-Level | `--color-role-exec` | `#8B5CF6` (purple) |
| Portfolio Director | `--color-role-director` | `#0EA5E9` (sky blue) |
| Resource Manager | `--color-role-resource` | `#F97316` (orange) |
| Project Manager | `--color-role-pm` | `#10B981` (green) |
| Team Member / Viewer | `--color-role-viewer` | `#64748B` (grey) |

---

## 3. Typography

**Font family:** `Outfit` (Google Fonts) — loaded via CDN. Fallback: `ui-sans-serif, system-ui, sans-serif`.

**Monospace (numbers/IDs):** `Courier New`, `ui-monospace`. Use the `.num-mono` utility class for all numeric values, IDs, and tabular data.

| Element | Tailwind class | Notes |
|---|---|---|
| Page title | `text-2xl font-semibold` | |
| Section header | `text-base font-medium` | |
| Card title / label | `text-sm font-medium` | |
| Body / description | `text-sm text-muted-foreground` | |
| Eyebrow label | `.label-eyebrow` utility | Uppercase, teal, 0.65rem, tracked |
| Small metadata | `text-xs text-muted-foreground` | Dates, IDs, sub-labels |
| Numeric values | `.num-mono` utility | Budgets, scores, percentages, IDs |

**Heading rule:** All `h1–h5` use `font-weight: 500` and `letter-spacing: -0.01em`. Never bold headings.

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` / `--radius-sm` | `4px` | Badges, chips, small tags |
| `rounded-md` / `--radius-md` | `8px` | Buttons, inputs, small cards |
| `rounded-lg` / `--radius-lg` | `12px` | Main cards (`.glass-card`), dialogs |
| `rounded-xl` / `--radius-xl` | `16px` | Large panels, modals |
| `rounded-full` | `9999px` | Avatars, toggle pills, filter chips |

---

## 5. Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.6)` | Modals, sheets |
| `--shadow-teal` | `0 4px 20px rgba(81,202,173,0.35)` | Primary CTA glow on hover |

---

## 6. Core Components

### Glass Card — `.glass-card`

The primary container for all content blocks.

```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 12px;
backdrop-filter: blur(8px);
transition: all 200ms ease;

/* Hover state */
border-color: rgba(81,202,173,0.2);
background: rgba(255,255,255,0.06);
```

**Rules:**
- All content cards use `.glass-card`
- Never use a solid background colour for cards
- Padding: `p-4` (16px) for compact cards, `p-5` (20px) for standard, `p-6` (24px) for large
- Do not nest `.glass-card` more than 2 levels deep

### Buttons

| Variant | Class | Usage |
|---|---|---|
| Primary CTA | `bg-accent text-accent-foreground hover:bg-accent/90` | Single primary action per screen |
| Outline | `variant="outline"` | Secondary actions |
| Ghost | `variant="ghost"` | Tertiary / icon-only actions |
| Destructive | `variant="destructive"` | Delete, reject, remove |

Button sizes: `size="sm"` for inline table/card actions, default for dialogs and page-level CTAs.

### Badges

```tsx
// Status badge
<Badge variant="outline" className="border-rag-green/30 bg-rag-green/10 text-rag-green">
  On Track
</Badge>

// Accent chip (active filter, tab count)
<Badge className="bg-accent-dim text-accent border-accent/30">
  Active
</Badge>

// Role badge
<Badge className="bg-role-director/10 text-role-director border-role-director/40">
  Director
</Badge>
```

### Eyebrow Labels — `.label-eyebrow`

Use above section titles to categorise content.

```tsx
<div className="label-eyebrow">Portfolio Health</div>
<div className="text-2xl font-medium text-foreground">22</div>
```

### Avatars

```tsx
<Avatar className="h-8 w-8">
  <AvatarFallback className="bg-accent-dim text-xs text-accent">
    SA
  </AvatarFallback>
</Avatar>
```

Always use initials fallback (2 characters, uppercase). No images unless a real user photo is available.

### Dialogs / Modals

- Max width: `max-w-md` for confirmations, `max-w-lg` for forms, `max-w-4xl` for multi-step flows
- Header: `DialogHeader > DialogTitle`
- Footer: `DialogFooter` with Cancel (outline) on the left, primary action on the right
- Destructive actions: red button on the right, Cancel on the left

### Tables

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-muted-foreground text-xs uppercase tracking-wide">
        Column
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-border/40 hover:bg-secondary/40">
      <TableCell className="text-foreground">Value</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 7. Layout Patterns

### App Shell

```
┌─────────────────────────────────────────────┐
│  AppSidebar (240px, collapsible to 44px)    │
│  AppTopbar (48px, fixed top)                │
│  main (flex-1, px-10 py-8, overflow-x-hidden)│
└─────────────────────────────────────────────┘
```

- Sidebar background: `--surface` (`#0F1729`)
- Top bar height: `48px`
- Main content max-width: no constraint (full width)
- Page padding: `px-6 py-6` mobile → `px-10 py-8` desktop

### Bento Grid (Dashboard / Overview)

```tsx
<div className="grid gap-4 md:grid-cols-3">
  <div className="glass-card col-span-2 p-5">Wide widget</div>
  <div className="glass-card p-5">Narrow widget</div>
</div>
```

Use `gap-4` between grid cells. Cells can span 2 columns with `col-span-2`.

### Page Header

Every page starts with `<PageHeader>`:

```tsx
<PageHeader
  title="Pipeline"
  subtitle="Pre-approval funnel"
  actions={<Button>+ New</Button>}
/>
```

### Tab Navigation

```tsx
<Tabs defaultValue="capital">
  <TabsList className="bg-secondary/40">
    <TabsTrigger value="capital"
      className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
      Capital Projects
    </TabsTrigger>
  </TabsList>
  <TabsContent value="capital" className="mt-5">
    ...
  </TabsContent>
</Tabs>
```

Active tab: teal background (`bg-accent`) with dark foreground. Inactive: muted text on transparent.

### KPI Strip

Horizontal row of metric chips used at the top of modules.

```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
  <div className="glass-card p-4">
    <div className="label-eyebrow">Total Active</div>
    <div className="mt-1 text-2xl font-medium num-mono text-foreground">22</div>
    <div className="mt-0.5 text-xs text-muted-foreground">FY2026</div>
  </div>
</div>
```

---

## 8. Spacing Scale

Follow Tailwind's default spacing. Common values used in this project:

| Token | px | Common use |
|---|---|---|
| `gap-2` | 8px | Inline element gaps |
| `gap-3` | 12px | Tight card grids |
| `gap-4` | 16px | Standard card grids |
| `gap-5` | 20px | Section spacing |
| `p-3` | 12px | Compact card padding |
| `p-4` | 16px | Standard card padding |
| `p-5` | 20px | Spacious card padding |
| `px-4 py-3` | 16/12px | Table row / list item padding |
| `mt-5` | 20px | Tab content top margin |
| `mb-3` | 12px | Label-to-content gap |

---

## 9. Interaction & Animation

- **Hover transitions:** `transition-all duration-200` or `transition-colors`
- **Card hover:** border brightens to `rgba(81,202,173,0.2)`, background to `rgba(255,255,255,0.06)`
- **Button hover:** primary darkens to `bg-accent/90`
- **Pulse animation:** `.pulse-dot` — used on critical RAG indicators only
- **Drag feedback:** dragged item gets `opacity-30 scale-95`
- **Focus ring:** `ring-2 ring-accent/40` on focused inputs

---

## 10. RAG Badge Component

The RAG system is used throughout. Always use the `<RagBadge>` component:

```tsx
<RagBadge rag="green" />          // coloured dot
<RagBadge rag="amber" label="At Risk" />  // dot + label
```

RAG dot sizes: `h-2 w-2` inline, `h-2.5 w-2.5` standalone.

---

## 11. Status Pill Pattern

For pipeline stages, approval statuses, and any lifecycle state:

```tsx
<span className="rounded-full border px-2.5 py-0.5 text-xs font-medium
  border-rag-green/30 bg-rag-green/10 text-rag-green">
  Approved
</span>
```

Map statuses to RAG colours:
- Approved / Active / Completed / Awarded → green
- Under Review / Pending / At Risk → amber
- Rejected / Critical / Overdue / Lost → red
- Submitted / New / Draft → blue
- Deferred / On Hold / Closed → grey (muted)

---

## 12. Empty States

Every list, table, or queue must have an empty state:

```tsx
<div className="glass-card p-8 text-center">
  <div className="text-sm text-muted-foreground">
    No items pending approval
  </div>
</div>
```

For more prominent empty states, add a muted icon above the text.

---

## 13. Background

The page body has a subtle radial gradient applied globally — do not replicate this on individual components:

```css
background-image:
  radial-gradient(1200px 600px at 80% -20%, rgba(81,202,173,0.06), transparent 60%),
  radial-gradient(900px 500px at -10% 100%, rgba(59,130,246,0.05), transparent 60%);
```

---

## 14. Do's and Don'ts

**Do:**
- Use `.glass-card` for every content container
- Use `--accent` / `bg-accent` only for the primary actionable element per section
- Use `.label-eyebrow` to introduce every data section
- Use `.num-mono` for all numbers, IDs, currencies, percentages
- Use RAG colours only for health/status indicators
- Keep padding consistent — `p-4` or `p-5` on cards
- Use `text-muted-foreground` for supporting text, never pure grey hex values

**Don't:**
- Don't use white or light backgrounds
- Don't use more than one primary (teal) button per visible section
- Don't use colour for decoration — every colour carries meaning (RAG, role, status)
- Don't use `font-bold` — max weight is `font-semibold` (600)
- Don't add borders thicker than `1px`
- Don't use `rounded-2xl` or larger — max is `rounded-xl` (16px)
- Don't use inline styles — always use Tailwind classes or CSS variables
