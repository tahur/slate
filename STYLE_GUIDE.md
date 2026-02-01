# OpenBill Style Guide

## Design Philosophy: Utilitarian Minimalism

**Core Principle**: Every element must serve a purpose. Remove decoration, maximize function.

> "The interface should be invisible. Users should see their data, not our design."

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Information hierarchy is immediately obvious |
| **Density** | Show more data, less chrome (inspired by Tally) |
| **Speed** | Fast interactions, minimal animations |
| **Consistency** | Same patterns everywhere |
| **Accessibility** | WCAG 2.1 AA compliant |

### Anti-Patterns (What NOT to do)
- ❌ Decorative gradients or shadows
- ❌ Animations without purpose
- ❌ Large padding/margins wasting space
- ❌ Icons without labels (except universal ones)
- ❌ Color for decoration (only for meaning)

---

## 2. Color Palette

### Base Colors (Light Mode - Default)

```css
:root {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f4;
  
  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #5f6368;
  --text-muted: #9aa0a6;
  
  /* Borders */
  --border-light: #e8eaed;
  --border-default: #dadce0;
  --border-strong: #80868b;
  
  /* Interactive */
  --interactive-primary: #1a73e8;
  --interactive-hover: #1557b0;
  --interactive-active: #174ea6;
}
```

### Semantic Colors (Meaning Only)

```css
:root {
  /* Status */
  --status-success: #137333;
  --status-success-bg: #e6f4ea;
  
  --status-warning: #b06000;
  --status-warning-bg: #fef7e0;
  
  --status-error: #c5221f;
  --status-error-bg: #fce8e6;
  
  --status-info: #1a73e8;
  --status-info-bg: #e8f0fe;
  
  /* Financial */
  --amount-positive: #137333;  /* Profit, Credit */
  --amount-negative: #c5221f;  /* Loss, Debit */
  --amount-neutral: #1a1a1a;   /* Zero, pending */
}
```

### Invoice Status Colors

| Status | Color | Background |
|--------|-------|------------|
| Draft | `#5f6368` | `#f1f3f4` |
| Issued | `#1a73e8` | `#e8f0fe` |
| Partially Paid | `#b06000` | `#fef7e0` |
| Paid | `#137333` | `#e6f4ea` |
| Cancelled | `#c5221f` | `#fce8e6` |
| Overdue | `#c5221f` | `#fce8e6` |

---

## 3. Typography

### Font Stack

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Type Scale

| Name | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| `text-xs` | 11px | 400 | 1.4 | Labels, captions |
| `text-sm` | 13px | 400 | 1.4 | Secondary text, table cells |
| `text-base` | 14px | 400 | 1.5 | Body text, form inputs |
| `text-lg` | 16px | 500 | 1.4 | Section headers |
| `text-xl` | 20px | 600 | 1.3 | Page titles |
| `text-2xl` | 24px | 600 | 1.2 | Dashboard numbers |

### Numbers & Currency

```css
.currency {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
```

**Rules:**
- Always right-align numbers
- Use tabular figures for alignment
- Format: `₹1,23,456.00` (Indian numbering)
- Negative: `(₹1,234.00)` or `-₹1,234.00`

---

## 4. Spacing System

**Base unit: 4px**

| Token | Value | Use |
|-------|-------|-----|
| `space-0` | 0 | - |
| `space-1` | 4px | Inline elements, tight |
| `space-2` | 8px | Default gap |
| `space-3` | 12px | Card padding (compact) |
| `space-4` | 16px | Section spacing |
| `space-6` | 24px | Page sections |
| `space-8` | 32px | Major sections |

### Density Guidelines

| Context | Padding | Gap |
|---------|---------|-----|
| Table cells | 8px 12px | - |
| Form inputs | 8px 12px | 8px |
| Buttons | 6px 12px | 8px |
| Cards | 12px | 12px |
| Page | 16px 24px | 16px |

---

## 5. Components

### Buttons

**Primary** (1 per screen max)
```css
.btn-primary {
  background: var(--interactive-primary);
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 500;
}
```

**Secondary** (Most actions)
```css
.btn-secondary {
  background: transparent;
  color: var(--interactive-primary);
  border: 1px solid var(--border-default);
  padding: 6px 16px;
  border-radius: 4px;
}
```

**Ghost** (Inline actions)
```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 4px 8px;
}
```

### Form Inputs

```css
.input {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  font-size: 14px;
}

.input:focus {
  border-color: var(--interactive-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}
```

### Tables (Data Dense)

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 8px 12px;
  background: var(--bg-secondary);
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-default);
}

.table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
}

.table tr:hover {
  background: var(--bg-secondary);
}
```

### Status Badges

```css
.badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
```

### Cards

```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  padding: 12px;
}

/* No shadows by default - utilitarian */
```

---

## 6. Layout Patterns

### Page Layout

```
┌─────────────────────────────────────────────────────┐
│ Header (48px fixed)                                 │
├────────┬────────────────────────────────────────────┤
│        │ Page Title + Actions                       │
│ Side   ├────────────────────────────────────────────┤
│ bar    │                                            │
│ (200px)│ Content Area                               │
│        │                                            │
│        │                                            │
└────────┴────────────────────────────────────────────┘
```

### Form Layout (Compact)

```
┌─────────────────────────────────────────────────────┐
│ Form Title                              [Cancel][Save]│
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Field 1      │ │ Field 2      │ │ Field 3      │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────────────────────┐   │
│ │ Field 4      │ │ Field 5 (wider)              │   │
│ └──────────────┘ └──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- 3-4 columns on desktop
- 2 columns on tablet
- 1 column on mobile
- Labels above inputs (not beside)
- Group related fields

### Invoice Form (Special)

```
┌─────────────────────────────────────────────────────┐
│ Customer: [Dropdown    ▼]    Date: [01/02/2026]    │
├─────────────────────────────────────────────────────┤
│ # │ Item Description    │ HSN  │ Qty │ Rate │ Amt  │
│───┼─────────────────────┼──────┼─────┼──────┼──────│
│ 1 │ [                 ] │[    ]│[   ]│[    ]│ ₹0   │
│ 2 │ [+ Add line item  ] │      │     │      │      │
├─────────────────────────────────────────────────────┤
│                                   Subtotal │ ₹0.00 │
│                                   CGST 9%  │ ₹0.00 │
│                                   SGST 9%  │ ₹0.00 │
│                                   ─────────┼───────│
│                                   Total    │ ₹0.00 │
└─────────────────────────────────────────────────────┘
```

---

## 7. Icons

**Use**: [Lucide Icons](https://lucide.dev/) (consistent with shadcn)

**Size**: 16px default, 20px for emphasis

**Rules:**
- Icons accompany text, rarely standalone
- Use semantic meaning (✓ for success, not random checkmark)
- Stroke width: 1.5px

### Common Icons

| Action | Icon |
|--------|------|
| Add/Create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| View | `Eye` |
| Download | `Download` |
| Print | `Printer` |
| Settings | `Settings` |
| Search | `Search` |
| Filter | `Filter` |
| Sort | `ArrowUpDown` |

---

## 8. Motion & Transitions

**Philosophy**: Fast and functional. No flourishes.

```css
:root {
  --transition-fast: 100ms ease-out;
  --transition-normal: 150ms ease-out;
}
```

**Use transitions for:**
- ✅ Hover states (fast)
- ✅ Focus states (fast)
- ✅ Dropdown open/close (normal)
- ✅ Toast notifications (normal)

**Never animate:**
- ❌ Page loads (show immediately)
- ❌ Data loading (use skeleton, no fade)
- ❌ Form submissions (instant feedback)

---

## 9. Responsive Breakpoints

```css
/* Mobile first */
--bp-sm: 640px;   /* Large phone */
--bp-md: 768px;   /* Tablet */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Large desktop */
```

### Component Behavior

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Sidebar | Hidden (hamburger) | Collapsed (icons) | Full |
| Tables | Card view | Horizontal scroll | Full |
| Forms | 1 column | 2 columns | 3-4 columns |
| Actions | Bottom sheet | Inline | Inline |

---

## 10. Accessibility

### Requirements

- [x] Color contrast: 4.5:1 minimum (text on bg)
- [x] Focus visible: 2px outline on all interactive
- [x] Keyboard navigation: Full support
- [x] Screen reader: Proper ARIA labels
- [x] Touch targets: 44px minimum

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--interactive-primary);
  outline-offset: 2px;
}
```

---

## 11. Do's and Don'ts

### ✅ Do

- Use consistent 4px spacing grid
- Right-align all currency values
- Show loading states immediately
- Use status colors only for status
- Keep forms compact
- Show errors inline, near the field

### ❌ Don't

- Add decorative elements
- Use color for emphasis (use weight)
- Center-align data tables
- Hide information behind hovers
- Use modals for forms (use pages)
- Add "fun" microcopy

---

## 12. Reference

### Inspiration

- **Tally ERP** - Data density, keyboard-first
- **Stripe Dashboard** - Clean typography, clear hierarchy  
- **Linear** - Utilitarian, fast, no decoration
- **Notion** - Minimal chrome, content focus

### shadcn Components to Use

| Component | Use Case |
|-----------|----------|
| `Button` | All actions |
| `Input` | Form fields |
| `Select` | Dropdowns |
| `Table` | Data lists |
| `Dialog` | Confirmations only |
| `Dropdown Menu` | Actions menu |
| `Tabs` | Section switching |
| `Badge` | Status indicators |
| `Skeleton` | Loading states |
| `Toast` | Notifications |

---

*Last Updated: February 1, 2026*
