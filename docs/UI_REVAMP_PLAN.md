# OpenBill UI/UX Revamp Plan

## Executive Summary

The codebase has a solid Radiance design foundation but suffers from:
- **Text readability issues** - `text-muted` (65% brightness) is too faint for labels
- **Inconsistent form patterns** - Input backgrounds, labels, required indicators vary
- **Button hierarchy unclear** - No clear secondary action button, confusing cancel hover states
- **Naming confusion** - `text-muted` is actually lighter than `text-subtle` (backwards!)

---

## Phase 1: CSS Variable Fixes (Global Impact)

### 1.1 Fix Text Color Hierarchy

**Current Problem:**
```css
--text-subtle: hsl(2 1% 52%);   /* 52% = DARKER */
--text-muted: hsl(220 10% 65%); /* 65% = LIGHTER (backwards!) */
```

**Solution - Update `src/app.css`:**
```css
/* Rename for clarity - muted should be lightest */
--text-secondary: hsl(220 9% 46%);  /* NEW: ~#6b7280 - readable secondary text */
--text-muted: hsl(220 10% 60%);     /* Bump up from 65% to 60% for better contrast */
--text-placeholder: hsl(220 10% 70%); /* NEW: For input placeholders only */
```

### 1.2 Add Secondary Button Color

**Add to CSS variables:**
```css
--secondary: hsl(220 14% 96%);
--secondary-foreground: hsl(220 9% 30%);
--secondary-hover: hsl(220 14% 92%);
```

### 1.3 Standardize Form Colors

```css
/* Form-specific tokens */
--input-bg: var(--surface-0);
--input-border: var(--border-strong);
--input-border-focus: var(--primary);
--label-color: hsl(220 9% 35%);  /* Darker than current muted */
```

---

## Phase 2: Component Updates

### 2.1 Button Component Revamp

**File:** `src/lib/components/ui/button/button.svelte`

**New Variant System:**
| Variant | Use Case | Style |
|---------|----------|-------|
| `default` | Primary action (Save, Submit, Confirm) | Orange bg, white text |
| `secondary` | Secondary action (Apply Filter, Add Item) | Light gray bg, dark text |
| `outline` | Tertiary action (Edit, View) | White bg, border, dark text |
| `ghost` | Minimal action (Back, Close) | Transparent, subtle hover |
| `destructive` | Dangerous action (Delete, Cancel order) | Red bg, white text |
| `link` | Inline navigation | Underlined text link |

**Cancel Button Fix:**
```svelte
<!-- WRONG: Red hover is confusing -->
<Button variant="ghost" class="hover:text-destructive">Cancel</Button>

<!-- CORRECT: Neutral hover -->
<Button variant="ghost">Cancel</Button>
```

### 2.2 Form Label Component

**Create:** `src/lib/components/ui/form-label.svelte`
```svelte
<script lang="ts">
    let { required = false, children } = $props();
</script>

<label class="text-xs font-semibold uppercase tracking-wide text-label">
    {@render children()}
    {#if required}<span class="text-destructive ml-0.5">*</span>{/if}
</label>
```

### 2.3 Input Component Update

**File:** `src/lib/components/ui/input/input.svelte`

**Standardize:**
```svelte
class="h-10 w-full rounded-md border border-input-border bg-input-bg px-3 py-2
       text-sm text-text-strong
       placeholder:text-text-placeholder
       focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20
       disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-muted"
```

---

## Phase 3: Page-by-Page Updates

### 3.1 Form Pages Pattern

**Standard Layout:**
```
┌─────────────────────────────────────────────────────┐
│ HEADER (sticky)                                     │
│ ← Back    Page Title                                │
│           Subtitle                                  │
├─────────────────────────────────────────────────────┤
│ CONTENT (scrollable)                                │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Section Card (bg-surface-0, border)          │   │
│  │ ┌─────────────────────────────────────────┐ │   │
│  │ │ Section Header with Icon                 │ │   │
│  │ └─────────────────────────────────────────┘ │   │
│  │ Form fields...                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│ FOOTER (sticky)                                     │
│ [Primary Action]  [Cancel]              [Optional]  │
└─────────────────────────────────────────────────────┘
```

### 3.2 Pages to Update

| Page | Priority | Key Changes |
|------|----------|-------------|
| `/vendors/new` | ✅ Done | Bottom action bar added |
| `/customers/new` | High | Add bottom bar, fix labels |
| `/customers/[id]` | High | Match vendor pattern |
| `/invoices/new` | High | Fix label colors, standardize inputs |
| `/invoices/[id]` | Medium | Fix text contrast in details |
| `/expenses/new` | Medium | Already good, minor label fixes |
| `/credit-notes/new` | High | New page - build with new patterns |
| `/payments` | Low | Already decent |
| `/journals` | Low | Minor fixes |
| `/settings` | Medium | Tab content label fixes |

### 3.3 Specific Fixes Per Page

#### `/customers/new/+page.svelte`
```diff
- <Label class="text-xs uppercase tracking-wider text-text-muted font-bold">
+ <Label class="text-xs uppercase tracking-wide text-label font-semibold">

- <Button variant="outline" href="/customers">Cancel</Button>
+ <Button variant="ghost" href="/customers">Cancel</Button>

+ Add bottom action bar (copy from vendors/new)
```

#### `/invoices/new/+page.svelte`
```diff
- class="text-xs uppercase tracking-wider text-text-muted font-bold"
+ class="text-xs uppercase tracking-wide text-label font-semibold"

- bg-surface-2 (various inputs)
+ bg-surface-0 (standardize all inputs)

- Table headers: text-text-muted
+ Table headers: text-text-secondary
```

#### `/invoices/[id]/+page.svelte`
```diff
- "Invoice Date" label: text-text-muted (too faint)
+ "Invoice Date" label: text-text-secondary

- Bill To section labels: text-text-muted
+ Bill To section labels: text-text-secondary
```

---

## Phase 4: Design Token Documentation

### 4.1 Color Usage Guide

| Token | Brightness | Use For |
|-------|------------|---------|
| `text-strong` | 9% | Headlines, primary content, data values |
| `text-secondary` | 46% | **NEW** - Labels, column headers, secondary info |
| `text-subtle` | 52% | Metadata, timestamps, less important info |
| `text-muted` | 60% | Disabled text, hints, tertiary info |
| `text-placeholder` | 70% | **NEW** - Input placeholders only |

### 4.2 Button Usage Guide

| Action Type | Variant | Example |
|-------------|---------|---------|
| Primary/Confirm | `default` | Save, Submit, Create, Confirm |
| Secondary/Alternate | `secondary` | Apply Filter, Add Row, Export |
| Tertiary/Neutral | `outline` | Edit, View Details, Settings |
| Minimal/Navigation | `ghost` | Back, Cancel, Close |
| Dangerous | `destructive` | Delete, Remove, Discard |

### 4.3 Input Background Guide

| Context | Background |
|---------|------------|
| Standard input | `bg-surface-0` (white) |
| Disabled input | `bg-surface-2` (light gray) |
| Read-only display | `bg-surface-1` |
| Calculated field | `bg-surface-1` with `text-text-strong` |

---

## Phase 5: Implementation Checklist

### Step 1: CSS Variables (30 min)
- [ ] Update `--text-muted` to 60% brightness
- [ ] Add `--text-secondary` at 46%
- [ ] Add `--text-placeholder` at 70%
- [ ] Add `--label-color`
- [ ] Add `--input-bg`, `--input-border`, `--input-border-focus`

### Step 2: Button Component (20 min)
- [ ] Update secondary variant styling
- [ ] Ensure ghost variant has neutral hover (not red)
- [ ] Add better disabled state styling

### Step 3: Form Pages - High Priority (2 hrs)
- [ ] `/customers/new` - Add bottom bar, fix labels
- [ ] `/customers/[id]` - Match edit pattern
- [ ] `/invoices/new` - Fix all label colors, standardize inputs
- [ ] `/credit-notes/new` - Build with new patterns

### Step 4: Form Pages - Medium Priority (1 hr)
- [ ] `/invoices/[id]` - Fix detail label contrast
- [ ] `/expenses/new` - Minor label fixes
- [ ] `/settings` - Tab content fixes

### Step 5: Validation (30 min)
- [ ] Visual review all forms
- [ ] Check WCAG contrast ratios
- [ ] Test on different screen sizes

---

## Visual Reference

### Before (Current Issues)
```
┌──────────────────────────────────┐
│ INVOICE DATE          ← Too faint (65%)
│ [  01/15/2024  ]
│
│ CUSTOMER *            ← Too faint
│ [  Select...    ▼]
│
│ [Cancel] [Save Invoice]  ← Cancel hover = red (confusing)
└──────────────────────────────────┘
```

### After (Fixed)
```
┌──────────────────────────────────┐
│ INVOICE DATE          ← Readable (46%)
│ [  01/15/2024  ]
│
│ CUSTOMER *            ← Readable with red asterisk
│ [  Select...    ▼]
│
│ [Save Invoice] [Cancel]  ← Primary first, neutral cancel
└──────────────────────────────────┘
```

---

## Secondary Color Recommendation

Based on the primary orange `hsl(20 96% 55%)`:

**Complementary Secondary (Cool Gray-Blue):**
```css
--secondary: hsl(220 14% 96%);        /* Light gray with blue tint */
--secondary-foreground: hsl(220 13% 26%); /* Dark blue-gray text */
--secondary-hover: hsl(220 14% 92%);  /* Slightly darker on hover */
```

This provides:
- Visual contrast with warm orange primary
- Professional, neutral appearance for secondary actions
- Good readability on both light and dark backgrounds

---

## Success Metrics

After revamp:
- [ ] All form labels readable at arm's length
- [ ] Clear visual hierarchy: Primary → Secondary → Ghost
- [ ] Consistent input styling across all forms
- [ ] Required fields clearly marked (red asterisk)
- [ ] Cancel buttons don't look dangerous
- [ ] WCAG AA contrast compliance (4.5:1 for text)
