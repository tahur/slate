# OpenBill Style Guide

> Single source of truth for all UI decisions. Every contributor and LLM **must** follow these rules.
> Last updated: February 6, 2026

---

## 1. Color System

### 1.1 Design Tokens (the ONLY colors you may use)

All colors live in `src/app.css` under `@theme`. **Never use raw Tailwind palette colors** (`slate-*`, `gray-*`, `zinc-*`, etc.) in app pages. The only exception is the public landing page (`src/routes/+page.svelte`) and SVG logo fills.

#### Surfaces (backgrounds)

| Token | Tailwind class | Value | Use for |
|-------|---------------|-------|---------|
| `surface-0` | `bg-surface-0` | `hsl(0 0% 100%)` | Cards, modals, inputs, table rows |
| `surface-1` | `bg-surface-1` | `hsl(210 20% 98%)` | Page background, content area |
| `surface-2` | `bg-surface-2` | `hsl(210 20% 96%)` | Hover states, disabled inputs, subtle fills |
| `surface-3` | `bg-surface-3` | `hsl(210 20% 92%)` | Active/pressed states |

#### Text

| Token | Tailwind class | Value | Use for |
|-------|---------------|-------|---------|
| `text-strong` | `text-text-strong` | `hsl(220 20% 15%)` | Headings, primary data, names, amounts |
| `text-subtle` | `text-text-subtle` | `hsl(220 10% 45%)` | Secondary info, descriptions |
| `text-muted` | `text-text-muted` | `hsl(220 10% 65%)` | Labels, hints, inactive items, timestamps |
| `text-placeholder` | `placeholder:text-text-placeholder` | `hsl(220 10% 72%)` | Input placeholders only |

> **DEPRECATED:** `text-secondary` (`hsl(220 10% 55%)`) — use `text-subtle` instead.
> **NEVER** use `text-muted-foreground` or `text-foreground` directly in page markup. Use the tokens above.

#### Borders

| Token | Tailwind class | Value | Use for |
|-------|---------------|-------|---------|
| `border` | `border-border` | `hsl(220 15% 92%)` | Default borders (cards, dividers, table rows) |
| `border-strong` | `border-border-strong` | `hsl(220 15% 85%)` | Input borders, emphasized dividers |

> **DEPRECATED:** `border-subtle` and `border-dashed` — use `border-border` for light borders.

#### Brand / Primary

| Token | Tailwind class | Value | Use for |
|-------|---------------|-------|---------|
| `primary` | `bg-primary`, `text-primary` | `#fb631b` | Buttons, links, active indicators, focus rings |
| `primary-foreground` | `text-primary-foreground` | `#ffffff` | Text on primary backgrounds |

> **NEVER** use `brand`, `brand-hover`, `ring`, or `sidebar-primary` directly. They alias `primary`.

#### Semantic Status Colors

Use these for status badges, alerts, and indicators:

| Status | Background | Text | Use for |
|--------|-----------|------|---------|
| Success | `bg-green-50` | `text-green-700` | Paid, active, positive amounts |
| Warning | `bg-amber-50` | `text-amber-700` | Pending, partially paid, due soon |
| Error | `bg-red-50` | `text-red-700` | Overdue, cancelled, errors |
| Info | `bg-blue-50` | `text-blue-700` | Issued, informational |
| Neutral | `bg-surface-2` | `text-text-subtle` | Draft, inactive |

For inline monetary amounts (not inside badges):
- Outstanding/receivable: `text-amber-600`
- Paid/received: `text-green-600`
- Credit/advance: `text-blue-600`
- Zero/settled: `text-text-muted`

> These are the **only** Tailwind palette colors allowed in app pages.

#### Sidebar

| Token | Tailwind class | Value |
|-------|---------------|-------|
| `sidebar-bg` | `bg-sidebar-bg` | `hsl(0 0% 100%)` |
| `sidebar-fg` | `text-sidebar-fg` | `hsl(220 15% 40%)` |
| `sidebar-accent` | `bg-sidebar-accent` | `hsl(24 90% 97%)` |
| `sidebar-border` | `border-sidebar-border` | `hsl(220 15% 93%)` |

### 1.2 Shadcn/UI Component Tokens

These exist **only** for shadcn-svelte components (`Button`, `Input`, `Badge`, `Card`, etc.). Do NOT use them directly in page markup:

- `background`, `foreground` — shadcn base
- `primary`, `primary-foreground` — OK to reference (aliased above)
- `secondary`, `secondary-foreground` — `Button variant="secondary"` only
- `destructive`, `destructive-foreground` — `Button variant="destructive"` only
- `muted`, `muted-foreground` — shadcn internal only
- `card`, `card-foreground` — `Card` component only
- `popover`, `popover-foreground` — `Select`, `Sheet`, etc. only

### 1.3 Forbidden Patterns

```svelte
<!-- BAD: raw Tailwind palette -->
<p class="text-slate-500">...</p>
<div class="bg-gray-100">...</div>
<span class="border-zinc-200">...</span>

<!-- GOOD: design tokens -->
<p class="text-text-muted">...</p>
<div class="bg-surface-2">...</div>
<span class="border-border">...</span>

<!-- BAD: shadcn tokens in page markup -->
<p class="text-muted-foreground">...</p>
<div class="bg-card">...</div>

<!-- GOOD: semantic tokens -->
<p class="text-text-muted">...</p>
<div class="bg-surface-0">...</div>

<!-- BAD: explicit color classes on Button -->
<Button class="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">

<!-- GOOD: let the component handle it -->
<Button>
```

---

## 2. Typography

### 2.1 Font Stacks

| Token | Font | Use for |
|-------|------|---------|
| `font-sans` | Inter | All UI text (default, no class needed) |
| `font-mono` | JetBrains Mono | Numbers, invoice/payment numbers, GSTIN, amounts |
| `font-display` | Space Grotesk | Logo/brand text only |

### 2.2 Text Sizes (standardized scale)

| Element | Classes | Notes |
|---------|---------|-------|
| Page title | `text-xl font-bold tracking-tight text-text-strong` | All pages, including dashboard |
| Page subtitle | `text-sm text-text-muted` | Below page title |
| Section heading | `text-xs font-semibold uppercase tracking-wider text-text-muted` | Card headers, tab labels |
| Table header | (automatic via `data-table`) | Do not style manually |
| Body text | `text-sm text-text-strong` | Default content |
| Small metadata | `text-xs text-text-muted` | Timestamps, refs, secondary info |
| Paper views only | `text-[10px] font-bold uppercase tracking-wider` | Invoice/receipt print layout only |

> **NEVER** use `text-2xl` for page titles, `text-[11px]`, or `text-[12px]`. Stick to this scale.

---

## 3. Layout Patterns

### 3.1 Page Wrappers

Every page under `src/routes/(app)/` **must** use `page-full-bleed`:

```svelte
<div class="page-full-bleed">
    <header>...</header>
    <div class="flex-1 overflow-y-auto bg-surface-1">
        <!-- content -->
    </div>
</div>
```

Report pages may use `max-w-6xl mx-auto` **inside** the scrollable content area.

> **DEPRECATED wrappers:** `flex flex-col h-full`, `space-y-4`, bare `max-w-* mx-auto`.

### 3.2 Page Headers

#### List page header

```svelte
<header class="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20">
    <div>
        <h1 class="text-xl font-bold tracking-tight text-text-strong">Page Title</h1>
        <p class="text-sm text-text-muted">Short description</p>
    </div>
    <Button href="/path/new">
        <Plus class="mr-2 size-4" />
        New Thing
    </Button>
</header>
```

#### Detail page header (with back button)

```svelte
<header class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/parent" size="icon" class="h-8 w-8">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">{title}</h1>
            {#if subtitle}
                <p class="text-sm text-text-muted">{subtitle}</p>
            {/if}
        </div>
    </div>
    <div class="flex items-center gap-2">
        <!-- action buttons -->
    </div>
</header>
```

### 3.3 Layout Header

The layout header (`src/lib/components/layout/header.svelte`) is `h-14` to align with the sidebar logo section. It contains only:
- Mobile menu trigger (hamburger + Sheet)
- Org avatar on the right

Page titles are owned by each page's own header, not the layout header.

### 3.4 Button Rules

| Action type | Pattern |
|------------|---------|
| Primary (New, Create, Save) | `<Button>` (default variant, no extra classes) |
| Secondary (Edit, Filter) | `<Button variant="outline" size="sm">` |
| Navigation (Back) | `<Button variant="ghost" size="icon" class="h-8 w-8">` |
| Destructive (Delete, Cancel) | `<Button variant="destructive">` |

> **NEVER** add `class="bg-primary text-primary-foreground ..."` to `<Button>`. The default variant handles it.

### 3.5 Summary Cards

```svelte
<div class="px-6 py-4 bg-surface-1 border-b border-border">
    <div class="grid grid-cols-3 gap-4 max-w-3xl">
        <div class="bg-surface-0 rounded-lg border border-border p-4">
            <div class="flex items-center gap-2 text-text-muted mb-1">
                <Icon class="size-4" />
                <span class="text-xs font-medium uppercase tracking-wider">Label</span>
            </div>
            <p class="text-2xl font-bold text-text-strong">{value}</p>
        </div>
    </div>
</div>
```

---

## 4. Components

### 4.1 Tables

**Always** use the `data-table` CSS class:

```svelte
<div class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0">
    <table class="data-table w-full">
        <thead><tr><th>Column</th></tr></thead>
        <tbody>
            <tr class="group cursor-pointer">
                <td class="data-cell--muted font-medium">
                    <a href="/item/{id}" class="data-row-link">{value}</a>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

Cell classes: `data-cell--muted`, `data-cell--number`, `data-cell--primary`

> This applies to **all** tables: list pages, detail page tabs, reports. Do NOT write manual tailwind table styles.

### 4.2 Empty States

```svelte
<div class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0">
    <Icon class="size-12 text-text-muted/30 mb-4" />
    <h3 class="text-lg font-bold text-text-strong">No {items} yet</h3>
    <p class="text-sm text-text-muted mb-6">Description text</p>
    <Button href="/path/new">
        <Plus class="mr-2 size-4" />
        Create {Item}
    </Button>
</div>
```

Search-aware variant:

```svelte
{#if searchQuery}
    <h3 class="text-lg font-medium text-text-strong">No {items} found</h3>
    <p class="text-sm text-text-muted mt-1">Try a different search term</p>
{:else}
    <!-- standard empty state with CTA button -->
{/if}
```

### 4.3 Action Bar (form footers)

```svelte
<footer class="action-bar">
    <Button variant="ghost" type="button">Cancel</Button>
    <Button type="submit" disabled={submitting}>
        <Save class="mr-2 size-4" />
        {submitting ? "Saving..." : "Save"}
    </Button>
</footer>
```

---

## 5. Shared Utilities

### 5.1 NEVER duplicate these functions

Import from shared modules instead of defining inline:

```ts
// Currency
import { formatINR } from "$lib/utils/currency";
formatINR(1234.56)  // "₹1,234.56"
formatINR(null)     // "₹0.00"

// Date
import { formatDate } from "$lib/utils/date";
formatDate("2026-01-15")  // "15 Jan 2026"
formatDate(null)           // ""
```

If you need a new utility (e.g., `getStateName`, `getModeLabel`), add it to `src/lib/utils/` and import.

### 5.2 CSS Utility Classes

| Class | Use for |
|-------|---------|
| `page-full-bleed` | Full-height page wrapper (cancels layout padding) |
| `data-table` | All data tables |
| `data-cell--muted` | Muted table cell text |
| `data-cell--number` | Right-aligned mono numbers |
| `data-cell--primary` | Primary-colored cell text |
| `data-row-link` | Full-cell clickable link |
| `action-bar` | Sticky bottom form footer |
| `form-label` | Uppercase form labels |
| `status-pill` | Status badge base (use with `--positive`, `--warning`, `--info`, `--negative`) |
| `print-hide` | Hide element when printing |
| `print-sheet` | Print-optimized container |
| `font-display` | Space Grotesk font |

---

## 6. File Organization

```
src/
  app.css                  -- All design tokens + global CSS classes
  lib/
    utils/
      currency.ts          -- formatINR, round2, calculateGST, etc.
      date.ts              -- formatDate
    components/
      ui/                  -- shadcn-svelte (do NOT modify component styles)
      layout/
        header.svelte      -- Layout header (mobile menu + org avatar, h-14)
        sidebar.svelte     -- Navigation sidebar (h-14 logo section)
      dashboard/           -- Dashboard-specific components (StatCard, AlertCard)
  routes/
    (app)/                 -- All authenticated app pages
    +page.svelte           -- Public landing (exception: may use Tailwind palette)
    login/                 -- Auth pages (exception: may use Tailwind palette)
```

---

## 7. Checklist for New Pages

Before submitting, verify:

- [ ] Uses `page-full-bleed` wrapper
- [ ] Header follows list or detail pattern (section 3.2)
- [ ] No inline `formatCurrency` / `formatDate` — imported from `$lib/utils`
- [ ] No raw Tailwind palette colors (`slate-*`, `gray-*`, `zinc-*`) in app pages
- [ ] Buttons use component variants, not explicit color classes
- [ ] Tables use `data-table` class
- [ ] Empty state follows section 4.2 pattern
- [ ] Monetary amounts use `font-mono`
- [ ] Text colors use only `text-strong`, `text-subtle`, `text-muted` tokens
- [ ] Page title is `text-xl` (not `text-2xl`)
- [ ] Section headings use `text-xs font-semibold uppercase tracking-wider text-text-muted`

---

## 8. Known Debt (to be cleaned up)

These are existing violations that should be fixed incrementally:

1. **24 files** have inline `formatCurrency()` — replace with `formatINR` import
2. **12 files** have inline `formatDate()` — replace with utility import
3. **5 files** have unused functions (`getStatusClass`, `getCellClass`, `formatRelativeTime`)
4. **Auth/landing pages** use `slate-*` colors (acceptable exception for now)
5. **`--color-text-secondary`** is still referenced in some files — migrate to `text-subtle`
6. **`--color-border-dashed`** is defined but unused — remove
7. **`hover:bg-secondary-hover`** in `button.svelte` references undefined token — fix
8. **Invoices/Payments/Expenses list pages** still use `flex flex-col h-full` — migrate to `page-full-bleed`
9. **Detail page tab tables** use manual tailwind instead of `data-table` class
10. **Some list page buttons** have explicit `bg-primary text-primary-foreground` — remove
