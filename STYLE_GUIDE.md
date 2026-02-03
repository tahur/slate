# OpenBill Style Guide

## Design Philosophy: Structured Clarity

**Core Principle**: Use strong contrast to separate navigation from content. Highlight key actions with vibrancy.

> "A professional, fintech-grade interface that balances density with breathing room."

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Contrast** | Dark navigation vs. Light content area |
| **Hierarchy** | Yellow accents guide the eye to primary actions |
| **Structure** | Cards define content boundaries on a gray canvas |
| **Clarity** | Breadcrumbs and distinct headers provide context |

---

## 2. Color Palette

### Theme Structure

| Area | Color | Value |
|------|-------|-------|
| **Sidebar** | Dark Gray | `#1e1e1e` |
| **Content Bg** | Light Gray | `#f8f9fa` |
| **Card Bg** | White | `#ffffff` |
| **Primary** | Gold/Yellow | `#eeb00d` |
| **Text Main** | Dark Slate | `#1f2937` |

### CSS Variables (Tailwind)

```css
:root {
  /* Main */
  --background: 210 20% 98%;   /* #f8f9fa */
  --foreground: 222 47% 11%;   /* #1f2937 */
  
  /* Sidebar (Dark Theme) */
  --sidebar-bg: 220 15% 15%;   /* #1e1e1e */
  --sidebar-fg: 220 10% 80%;   /* #d1d5db */
  
  /* Primary Action */
  --primary: 45 93% 47%;       /* #eeb00d */
  --primary-foreground: 222 47% 11%;
}
```

---

## 3. Typography

**Font**: Inter (UI), JetBrains Mono (Numbers)

### key Patterns

- **Breadcrumbs**: `Section (Grey)` > **Page (Dark/Bold)**
- **Section Headers**: Uppercase, tracked small text in Sidebar/Tables
- **Numbers**: Monospace, tabular-nums, right-aligned

---

## 4. Layout Patterns

### App Shell

```
┌─────────────────┬───────────────────────────────────┐
│                 │ Header (60px)                     │
│                 │ Breadcrumbs             [Actions] │
│  Sidebar        ├───────────────────────────────────┤
│  (Dark)         │ Content Area (Light Gray)         │
│  220px          │                                   │
│                 │  ┌─────────────────────────────┐  │
│                 │  │ Card (White, Shadow-sm)     │  │
│                 │  │                             │  │
│                 │  └─────────────────────────────┘  │
│                 │                                   │
└─────────────────┴───────────────────────────────────┘
```

### Components

#### Cards
- **Background**: White
- **Border**: 1px Solid Light Gray (`border`)
- **Shadow**: `shadow-sm`
- **Padding**: `p-6` (Key for breathing room)

#### Sidebar Navigation
- **Grouped**: CRM, CLIENTS, FINANCE
- **Active State**: Darker background card + Yellow indicator dot

---

*Last Updated: February 3, 2026*
