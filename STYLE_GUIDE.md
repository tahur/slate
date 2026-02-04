# OpenBill Radiance Style Guide (2026)

## Design Philosophy: Cloudflare Radiance

**Core Aesthetic**: "Friendly, Professional, Fluid."
Away from the "Old School Boxy" look. We aim for:
- **Friendly Colors**: Warm Oranges, Friendly Greens, Soft Grays.
- **Fluid Layouts**: Rounded corners, organic spacing, no harsh black borders.
- **Legible Typography**: High contrast but not harsh (Arsenic/Graphite).

> "Data-dense but easy on the eyes. Inspired by Cloudflare's Radiance."

---

## 1. Design Tokens

### Colors (HSL)

| Token | HSL | Hex (Approx) | Usage |
|-------|-----|--------------|-------|
| `--primary` | `28 90% 54%` | `#F48120` | **Princeton Orange** (Actions) |
| `--primary-fg`| `0 0% 100%` | `#FFFFFF` | Text on Orange |
| `--accent` | `150 60% 45%` | `#2E8B57` | **Sea Green** (Success/Growth) |

### Surfaces (Friendly Grays)

| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | `0 0% 100%` | **Clean White** App Background |
| `--surface-1` | `210 20% 98%` | **Soft Gray** Panels (Sidebar/Headers) |
| `--surface-2` | `210 20% 96%` | Hover states |
| `--surface-3` | `210 20% 92%` | Pressed / Active |

### Text (Legible & Easy)

| Token | HSL | Usage |
|-------|-----|-------|
| `--foreground` | `220 15% 25%` | **Arsenic** (Primary Text - Softer than black) |
| `--text-strong` | `220 20% 15%` | **Charcoal** (Headings) |
| `--text-subtle` | `220 10% 45%` | **Graphite** (Secondary info) |
| `--text-muted` | `220 10% 65%` | **Dust** (Meta / Placeholders) |

### Borders (No "Boxy" Black)

| Token | HSL | Usage |
|-------|-----|-------|
| `--border` | `220 15% 92%` | Very subtle hairline |
| `--border-strong`| `220 15% 85%` | Input focus / Active |

### Radius

- `--radius`: `0.5rem` (8px) - Friendly rounded corners.
- `--radius-lg`: `0.75rem` (12px) - Cards / Modals.

---

## 2. Typography

**Font**: **Inter** (Standard Cloudflare stack).
- Headings: SemiBold (600), Tight tracking.
- Body: Regular (400), Relaxed reading.

---

## 3. Component Updates

### 1. Cards
- **Old**: Sharp corners, visible border.
- **New**: `rounded-xl`, `border-border`, `shadow-sm` (soft diffuse shadow).
- Background: White on Soft Gray page, or Soft Gray on White page.

### 2. Buttons
- **Primary**: Orange (`bg-primary`). Rounded-md.
- **Secondary**: White with subtle border.

### 3. Dashboard
- **Old**: "Gumroad" KPI stamped cards.
- **New**: Floating cards. White background with soft shadow.
- **Colors**:
    - **Receivables** (Money coming in) -> **Green** accent.
    - **Overdue** (Action needed) -> **Orange** accent.

### 4. Sidebar
- Light gray (`--surface-1`) background, distinct from white content area.
- Active link: White pill with shadow.

---

*Last Updated: February 4, 2026*
