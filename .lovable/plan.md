## Goal

Centralize all theme colors for sidebar, header, and cards into CSS variables in `src/styles.css`, and remove hardcoded hex/rgba values scattered across components. After the refactor, changing any color (light or dark mode) happens in **one place only**: the `:root` / `[data-theme="dark"]` token blocks.

## Current problems

- `src/components/AppSidebar.tsx` defines a `SIDEBAR_COLORS` JS object with hardcoded hex values (`#0B154B`, `#DEC9FF`, `#1C274C`, gradients, rgba whites) used via inline `style={{...}}` on ~15 elements.
- `src/styles.css` repeats the same hex values (`#0B154B`, `#121318`, `#DEC9FF`, lavender gradient) inside `.ds02-sidebar` rules with `!important`, duplicating what should be tokens.
- `src/components/AppTopbar.tsx` mixes utility classes and is fine, but the header background is hard-pinned via `bg-card/80`; we'll keep token-driven but rename intent.
- Theme tokens exist (`--sidebar`, `--card`, etc.) but the sidebar component bypasses them with inline styles.

## Token model (new)

Add a single source of truth in `src/styles.css`, defined once per theme:

```text
Sidebar          Header           Cards
--sidebar        --header         --card
--sidebar-fg     --header-fg      --card-foreground
--sidebar-border --header-border  --border
--sidebar-muted-fg
--sidebar-hover-bg
--sidebar-active-bg     (gradient or solid)
--sidebar-active-fg
--sidebar-logo-bg
--sidebar-logo-fg
--sidebar-badge-bg
--sidebar-badge-fg
--sidebar-badge-danger-bg
--sidebar-badge-danger-fg
```

Light and dark blocks each set every token. No `!important`, no hex anywhere outside these two blocks.

## Changes

### 1. `src/styles.css`
- Extend `:root` (light) and `[data-theme="dark"]` with the full sidebar token set above plus `--header` / `--header-fg` / `--header-border`.
- Map them under `@theme inline` so Tailwind utilities (`bg-sidebar`, `bg-header`, `text-sidebar-foreground`, etc.) work.
- Replace the `.ds02-sidebar` block (and the duplicate dark override) with token-driven rules — no hex, no `!important`. The class becomes a thin styling hook: `background: var(--sidebar); color: var(--sidebar-foreground); border-color: var(--sidebar-border);`.
- Keep the active-item gradient as a token (`--sidebar-active-bg`) so themes can swap solid vs gradient.

### 2. `src/components/AppSidebar.tsx`
- Delete the `SIDEBAR_COLORS` constant.
- Remove every `style={{...}}` color override. Replace with Tailwind utilities bound to tokens: `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, `hover:bg-sidebar-accent`, `data-[active=true]:bg-sidebar-primary`, etc.
- Badges use `bg-sidebar-badge` / `bg-sidebar-badge-danger` utilities (added via `@theme inline`).
- Logo chip and avatar use `bg-sidebar-primary text-sidebar-primary-foreground`.

### 3. `src/components/AppTopbar.tsx`
- Change `bg-card/80` → `bg-header/80`, and the bottom border uses `border-header-border` (falls back to `--border` token if we alias).
- No other behavioral changes.

### 4. Card surfaces
- Already token-driven via `.glass-card { background: var(--card); border-color: var(--border); }`. No code changes — just confirm KpiCard and other consumers don't hardcode colors. (Spot check: `KpiCard.tsx` uses semantic classes only ✓.)

## Result

To recolor the sidebar, header, or cards (in either theme), edit only the token block in `src/styles.css`. No component file needs to change. The `ds02-sidebar` class stays as a structural hook but contains zero color literals.

## Out of scope

- RAG colors, role colors, accent — already tokenized, untouched.
- Auth/route logic, layout structure, fonts — untouched.
- No new components, no design changes; pixels stay visually identical.