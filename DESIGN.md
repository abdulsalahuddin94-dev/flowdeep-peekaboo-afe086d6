# Nexus PMO — Design System Reference

> **For AI tools and Lovable:** Read this file before generating any new screen, component, or layout.
> Check the **ACTIVE DESIGN SYSTEM** line below and apply only that system's tokens.
> Do not mix tokens across systems. Do not invent values not listed here.

---

## ▶ ACTIVE DESIGN SYSTEM: DS01

> To switch: change the line above to `DS02` (or any defined system).
> All colour tokens, card styles, and mode rules come from the active system only.

---

## How to Switch

When asked to "switch to DS02" (or any system):
1. Update the `ACTIVE DESIGN SYSTEM` line at the top of this file
2. Apply all tokens from that system's section to `src/styles.css`
3. Replace CSS variable values in `:root` with the new system's palette
4. If the new system supports Light Mode, add a `[data-theme="light"]` block with light tokens

---

## Design System Catalogue

---

# DS01 — Dark Navy / Teal Glass
**Status:** Active  
**Mode:** Dark only  
**Character:** Deep navy background, semi-transparent glass cards, single teal accent. Professional, data-dense, high-contrast.

## DS01 · Visual Language

- Deep navy background with subtle teal radial glow
- Semi-transparent glass cards with soft borders
- Teal (`#51CAAD`) as the single accent — used sparingly
- No white surfaces. No light mode. Everything is dark.
- Typography: Outfit font, medium weight headers

## DS01 · Colour Tokens

### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0B1120` | Page background |
| `--surface` | `#0F1729` | Sidebar, popovers, elevated surfaces |
| `--foreground` | `#E2E8F0` | Primary text |
| `--muted-foreground` | `#94A3B8` | Secondary / label text |
| `--border` | `rgba(255,255,255,0.08)` | All borders |
| `--card` | `rgba(255,255,255,0.04)` | Card backgrounds |
| `--secondary` | `rgba(255,255,255,0.06)` | Hover / fill backgrounds |
| `--input` | `rgba(255,255,255,0.06)` | Input backgrounds |
| `--popover` | `#111a2e` | Dropdown / popover backgrounds |

### Accent

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#51CAAD` | Primary CTA, active states, links |
| `--accent-foreground` | `#06231D` | Text on teal backgrounds |
| `--accent-dim` | `rgba(81,202,173,0.12)` | Chip backgrounds, selected fills |
| `--accent-glow` | `rgba(81,202,173,0.25)` | Glow effects |
| `--ring` | `rgba(81,202,173,0.4)` | Focus ring |

### RAG Status

| Token | Value | Meaning |
|---|---|---|
| `--rag-green` | `#10B981` | On track / approved / healthy |
| `--rag-amber` | `#F59E0B` | At risk / pending / warning |
| `--rag-red` | `#EF4444` | Critical / rejected / error |
| `--rag-blue` | `#3B82F6` | New / informational / not started |
| `--rag-grey` | `#64748B` | Inactive / on hold / archived |

### Role Colours

| Role | Hex |
|---|---|
| Executive | `#8B5CF6` |
| Portfolio Director | `#0EA5E9` |
| Resource Manager | `#F97316` |
| Project Manager | `#10B981` |
| Team Member | `#64748B` |

### Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.6)` |
| `--shadow-teal` | `0 4px 20px rgba(81,202,173,0.35)` |

### Body Background Gradient

```css
background-image:
  radial-gradient(1200px 600px at 80% -20%, rgba(81,202,173,0.06), transparent 60%),
  radial-gradient(900px 500px at -10% 100%, rgba(59,130,246,0.05), transparent 60%);
```

## DS01 · Card Style — `.glass-card`

```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 12px;
backdrop-filter: blur(8px);
transition: all 200ms ease;
/* hover */
border-color: rgba(81,202,173,0.2);
background: rgba(255,255,255,0.06);
```

## DS01 · Do's and Don'ts

**Do:**
- Use `.glass-card` for every content container
- Use `--accent` only for the primary actionable element per section
- Use `text-muted-foreground` for supporting text
- Use RAG colours only for health/status — never decoration

**Don't:**
- Don't use white or light backgrounds
- Don't use `font-bold` — max is `font-semibold`
- Don't use `rounded-2xl` or larger
- Don't mix with DS02 tokens

---

# DS02 — TBD / Dark + Light Mode
**Status:** Defined when ready  
**Mode:** Dark + Light  
**Character:** To be specified

> DS02 tokens will be filled in when the new design is ready.
> It will include both a `:root` (dark) and `[data-theme="light"]` block.

```
DS02 · Dark Mode tokens  →  to be defined
DS02 · Light Mode tokens →  to be defined
DS02 · Accent colour     →  to be defined
DS02 · Card style        →  to be defined
DS02 · Typography        →  to be defined
```

---

# Shared Rules (apply to ALL design systems)

These rules are system-agnostic and always apply regardless of active DS.

## Typography

**Font family:** `Outfit` (Google Fonts). Fallback: `ui-sans-serif, system-ui, sans-serif`.  
**Monospace:** `Courier New`, `ui-monospace` — use `.num-mono` class for all numbers, IDs, currencies.

| Element | Tailwind class |
|---|---|
| Page title | `text-2xl font-semibold` |
| Section header | `text-base font-medium` |
| Card title | `text-sm font-medium` |
| Body text | `text-sm text-muted-foreground` |
| Eyebrow label | `.label-eyebrow` (uppercase, accent, 0.65rem, tracked) |
| Metadata | `text-xs text-muted-foreground` |
| Numbers / IDs | `.num-mono` |

All `h1–h5`: `font-weight: 500`, `letter-spacing: -0.01em`. Never use `font-bold`.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | `4px` | Badges, chips, tags |
| `rounded-md` | `8px` | Buttons, inputs |
| `rounded-lg` | `12px` | Cards, dialogs |
| `rounded-xl` | `16px` | Large panels, modals |
| `rounded-full` | `9999px` | Avatars, pills |

## Layout

### App Shell
```
Sidebar (240px, collapsible to 44px) + Topbar (48px) + main (px-10 py-8)
```

### Bento Grid
```tsx
<div className="grid gap-4 md:grid-cols-3">
  <div className="glass-card col-span-2 p-5">Wide</div>
  <div className="glass-card p-5">Narrow</div>
</div>
```

### KPI Strip
```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
  <div className="glass-card p-4">
    <div className="label-eyebrow">Label</div>
    <div className="mt-1 text-2xl font-medium num-mono text-foreground">22</div>
    <div className="mt-0.5 text-xs text-muted-foreground">sub-label</div>
  </div>
</div>
```

### Tab Navigation
```tsx
<Tabs defaultValue="x">
  <TabsList className="bg-secondary/40">
    <TabsTrigger value="x"
      className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
      Tab
    </TabsTrigger>
  </TabsList>
  <TabsContent value="x" className="mt-5">...</TabsContent>
</Tabs>
```

## Components

### Buttons
| Variant | Usage |
|---|---|
| `bg-accent text-accent-foreground hover:bg-accent/90` | Primary CTA — one per section |
| `variant="outline"` | Secondary actions |
| `variant="ghost"` | Tertiary / icon-only |
| `variant="destructive"` | Delete, reject, remove |

### Status Pills
Map to RAG: green=approved/active, amber=pending/risk, red=rejected/critical, blue=new/draft, grey=archived/hold.

```tsx
<span className="rounded-full border px-2.5 py-0.5 text-xs font-medium
  border-rag-green/30 bg-rag-green/10 text-rag-green">Approved</span>
```

### Empty States
```tsx
<div className="glass-card p-8 text-center">
  <div className="text-sm text-muted-foreground">No items found</div>
</div>
```

### Dialogs
- `max-w-md` confirmations · `max-w-lg` forms · `max-w-4xl` multi-step
- Footer: Cancel (outline, left) · Primary action (right)

## Spacing
`gap-3` tight grids · `gap-4` standard grids · `p-4` compact cards · `p-5` standard cards · `mt-5` tab content

## Interaction
- Transitions: `transition-all duration-200`
- Drag: `opacity-30 scale-95` on dragged item
- Focus: `ring-2 ring-accent/40`
- Pulse: `.pulse-dot` on critical RAG only
