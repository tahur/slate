# OpenBill Precision Utility 2026 Style Guide

## Design Philosophy: Data-First Clarity

**Core Principle**: Use crisp surfaces, hairline borders, and compact spacing to let data lead. Highlight only the primary action and the most important metric.

> "A utilitarian, fintech-grade interface: compact, neutral, and precise."

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Hierarchy** | Primary metrics and actions are visually isolated; supporting data is subdued |
| **Surface Discipline** | Surfaces are layered with subtle contrast; no heavy shadows |
| **Compact Density** | Tight spacing, high information density, and clear alignment |
| **Action Clarity** | One primary action per view, with amber emphasis |

---

## 2. Color System

### Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `hsl(240 25% 98%)` | App background (Ghostwhite) |
| `--surface-1` | `hsl(0 0% 100%)` | Cards / Paper Sheets |
| `--surface-2` | `hsl(240 20% 96%)` | Hover / Secondary |
| `--surface-3` | `hsl(240 15% 92%)` | Active / Tertiary |
| `--grid-dot` | `hsl(220 10% 85%)` | Dotted grid texture |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `hsl(220 15% 90%)` | Default border (Crisp) |
| `--border-strong` | `hsl(220 15% 80%)` | Emphasis border |
| `--input` | `hsl(220 15% 90%)` | Input fields |
| `--ring` | `hsl(221 83% 53%)` | Focus rings |

### Text (Ink)

| Token | Value | Usage |
|-------|-------|-------|
| `--foreground` | `hsl(222 47% 10%)` | Primary Ink |
| `--grayblack` | `hsl(222 47% 8%)` | **Highlights / Strong Text** |
| `--text-strong` | `hsl(222 47% 8%)` | Deepest Ink |
| `--text-subtle` | `hsl(220 10% 40%)` | Graphite / Secondary |
| `--text-muted` | `hsl(220 10% 60%)` | Faint Ink / Meta |

### Status & Feedback

| Token | Value | Usage |
|-------|-------|-------|
| `--positive` | `hsl(150 60% 40%)` | Emerald (Success) |
| `--warning` | `hsl(35 90% 50%)` | Amber (Warning) |
| `--negative` | `hsl(0 70% 50%)` | Red (Destructive) |
| `--info` | `hsl(210 90% 50%)` | Sky (Info) |

### Branding

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `hsl(221 83% 53%)` | Professional Blue |
| `--primary-fg`| `hsl(0 0% 100%)` | Text on primary |

### Sidebar (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-bg` | `hsl(0 0% 100%)` | White Sidebar |
| `--sidebar-fg` | `hsl(220 10% 40%)` | Default text |
| `--sidebar-accent` | `hsl(240 20% 97%)` | Hover state |

---

## 3. Typography

**Font**: **Manrope** (UI), JetBrains Mono (Numbers)

### Type Scale

| Style | Size | Usage |
|-------|------|-------|
| **Page Title** | 24px | Dashboard headers (Grayblack) |
| **Section Title** | 11px Uppercase | Card headers |
| **Body** | 13px | Default UI text |
| **Caption** | 12px | Metadata, sublabels |

### Numeric Data
- Use `JetBrains Mono` for currency and invoice numbers.
- Always right-align numeric columns in tables.

---

## 4. Layout Patterns

### App Shell
- Sidebar: **200px**
- Header: **56px**
- Content gutters: **16–20px**

### Surface Texture
- Apply `app-surface` to large content areas for dotted grid texture.
- Keep dots subtle and never behind dense text blocks.

### KPI Band
- Single row container with 4 compact KPI cells.
- Primary KPI uses a subtle surface highlight (`--surface-2`).

### Data Tables
- Sticky headers, uppercase column labels.
- Row height: compact (8–10px vertical padding).
- Subtle hover surface (`--surface-3`).

### Form Layouts (3-Tier System)
1. **Large (Invoices)**:
   - `max-w-7xl` or full width.
   - For dense tables, multi-item lists, and complex documents.
   - Example: *Invoice Creation*

2. **Split Screen (Payments & Expenses)**:
   - `max-w-[variable]` or flex containers.
   - **2-Column Layout**:
     - **Left**: Data Entry (Form).
     - **Right**: Context/Summary (e.g., Unpaid Invoices, Tax Breakdown).
   - Improves density and allows reference while typing.
   - Example: *New Payment, New Expense*

3. **Standard (Entities)**:
   - `max-w-3xl`.
   - Single column, focused vertical flow.
   - For simple entities like Customers or Items.

### Sticky Actions
- Primary actions (Save, Cancel) are **pinned to the bottom** of the viewport.
- Ensures actions are always accessible without scrolling.
- Background: `--surface-1` with top border.

---

## 5. Component Guidance

### Buttons
- Primary: `bg-primary` only for the top action.
- Compact sizes: `xs`, `sm` for tight layouts.

### Status Pills
- Use `status-pill` + variant classes:
  - `status-pill--positive`
  - `status-pill--warning`
  - `status-pill--negative`
  - `status-pill--info`

### Cards
- Hairline borders only, minimal shadow.
- Default padding: `p-4`.

---

*Last Updated: February 3, 2026*
