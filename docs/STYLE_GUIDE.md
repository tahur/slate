# Slate Style Guide

Single source of truth for product UI in the app shell (`src/routes/(app)`), shared components, and print/document views.

Last updated: February 27, 2026

## 1. Design Philosophy

Slate UI follows these principles:

1. Calm first: low-noise surfaces, clear visual hierarchy, and whitespace over decoration.
2. Functional contrast: text and data must read clearly in both screen and print contexts.
3. Token driven: color, radius, type, and motion come from `src/app.css` tokens.
4. Consistent primitives: page headers, content wrappers, and controls use shared utilities.
5. Purposeful motion: short transitions for feedback and orientation, not ornamental animation.
6. Accessibility baseline: visible focus, readable copy, keyboard support, and predictable states.

## 2. Theme Tokens (Source of Truth)

All core tokens live in `src/app.css` under `@theme`.

### 2.1 Typography Tokens

- `--font-sans`: Manrope-based UI body font stack
- `--font-display`: Space Grotesk display stack
- `--font-mono`: JetBrains Mono + fallbacks

Type scale tokens:

- `--text-page-title-size`
- `--text-section-title-size`
- `--text-section-label-size`
- `--text-meta-size`
- `--text-table-size`
- `--text-value-size`

### 2.2 Radius Tokens

- `--radius-control: 0.3rem`
- `--radius-card: 0.75rem`
- `--radius-dialog: 0.9rem`
- `--radius-chip: 999px`

Utilities:

- `.shape-control`
- `.shape-card`
- `.shape-dialog`
- `.shape-chip`

### 2.3 Color Tokens

Core palette:

- Brand: `--color-brand #111111`, `--color-brand-hover #272a2c`
- Surfaces: `surface-0` to `surface-3`
- Text: `text-strong`, `text-subtle`, `text-muted`, `text-placeholder`
- Borders: `border`, `border-strong`, `border-subtle`, `border-dashed`
- Semantic: `positive`, `negative`, `warning`, `info`

Shadcn-compatible aliases are also defined (`primary`, `secondary`, `destructive`, etc.) and should be used through component variants, not manual class overrides.

### 2.4 Motion and Shadow Tokens

- Motion durations: `--motion-fast`, `--motion-base`, `--motion-slow`
- Timing curves: `--ease-standard`, `--ease-emphasized`, `--ease-exit`
- Shadows: `--shadow-hairline`, `--shadow-soft`, `--shadow-focus`

Utilities:

- `.motion-interactive`
- `.motion-enter`
- `.motion-overlay`

`prefers-reduced-motion` is supported globally and must be respected by new motion.

## 3. Layout System

### 3.1 App Shell

Main layout structure:

- Desktop: sidebar + content surface
- Mobile: top header with menu sheet trigger

Files:

- `src/routes/(app)/+layout.svelte`
- `src/lib/components/layout/sidebar.svelte`
- `src/lib/components/layout/header.svelte`

### 3.2 Page Wrappers

Use these shared wrappers:

- `.page-full-bleed`: full-height page column container
- `.page-header`: sticky page header, shared spacing/border/backdrop style
- `.page-body`: scrollable page content region
- `.content-width-standard`: max-width content container

Do not hand-roll per-page equivalents when these utilities fit.

### 3.3 Header Alignment Rules

`page-header` sets baseline behavior. Explicit alignment must be set with classes on the same node:

- `items-start`
- `items-center`
- `items-end`
- Responsive: `sm:items-*`, `md:items-*`, `lg:items-*`

This is required for reliable vertical alignment of action buttons and icon buttons.

### 3.4 Action Bar Pattern

Use `.action-bar` and `.action-bar-group` for fixed bottom action strips on form/detail pages.

## 4. Component Rules

### 4.1 Buttons

Use `<Button>` variants instead of custom color classes.

Variants:

- `default`: primary action
- `outline`: secondary action
- `secondary`: neutral alternate
- `ghost`: low-emphasis/navigation
- `destructive`: destructive action
- `link`: textual action

Sizes:

- `default` (`h-10`)
- `sm` (`h-9`)
- `lg` (`h-11`)
- `icon`, `icon-sm`, `icon-lg`, `icon-touch`

Guidance:

- Primary actions should be `default`.
- Back buttons in headers should be `ghost` + icon size.
- Keep icon-only controls labeled with `aria-label` where needed.

### 4.2 Inputs, Textareas, Select Triggers

All form controls use:

- `border-border-strong`
- `bg-surface-0`
- `text-text-strong`
- `placeholder:text-text-placeholder`
- `focus-visible:border-blue-400` + ring

Do not create one-off input color systems.

### 4.3 Badges and Status

Use `<Badge>` variants and `<StatusBadge>` mapping:

- success: paid/completed
- warning: partial/pending risk
- info: issued/sent/draft informational
- destructive: overdue/error
- outline/default: neutral states

Keep badge text uppercase and concise.

### 4.4 Tables

Use shared table primitives from `$lib/components/ui/table`.

Defaults:

- Header background: `bg-surface-2/70`
- Header text: section-label style
- Cell border: `border-border-subtle`
- Row hover: subtle blue-tinted feedback

Avoid ad hoc table typography and border systems in app views.

### 4.5 Sidebar

Sidebar style language:

- Atmospheric layered background (`.sidebar-atmosphere`)
- Strong active nav state (border, subtle bg, primary indicator rail)
- Compact utility-first spacing for navigation density

Do not add unrelated accent colors to navigation.

## 5. Document Views (Invoice, Quotation, Receipt, Credit Note, Supplier Payment, Expense)

Document pages intentionally use a print-first style model.

### 5.1 Sheet and Width

Use:

- `max-w-[210mm]` container
- `.invoice-a4-sheet`
- `.print-sheet`

This keeps rendering predictable for A4 and browser print/PDF.

### 5.2 Contrast Policy for Documents

For readable digital + print output, document templates may use explicit high-contrast classes such as:

- `text-[#111]`
- `text-slate-700`
- `text-slate-800`
- `border-slate-300`

This exception is intentional and preferred over faint UI-muted styles in legal/financial documents.

### 5.3 Company Identity Block Requirements

Document headers should always show:

- Organization name
- Address (or fallback text)
- State
- GSTIN (or `UNREGISTERED`)

### 5.4 Print Rules

`@media print` in `src/app.css` is authoritative:

- Hides app navigation/chrome
- Removes decorative backgrounds
- Forces A4 geometry and border normalization
- Preserves table borders and readable output contrast

Do not add page-level print hacks that conflict with these shared rules.

## 6. Color Usage Policy

### 6.1 App UI (default)

Prefer theme tokens (`text-text-*`, `bg-surface-*`, `border-border*`) for consistency and maintainability.

### 6.2 Controlled Exceptions

Allowed in specific contexts:

1. Document/print views for legibility.
2. Status signaling (success/warning/error/info).
3. Public landing page visual language.

Outside these contexts, avoid arbitrary palette use.

## 7. Accessibility Rules

Minimum standards:

1. Keyboard focus must always be visible.
2. Interactive targets should remain usable at mobile touch sizes.
3. Placeholder text cannot be the only label.
4. Status should not rely on color alone where feasible (icon/text pairing preferred).
5. Text contrast must remain readable, especially for financial values and metadata.

## 8. Do and Do Not

Do:

1. Use shared layout primitives (`page-header`, `page-body`, `content-width-standard`).
2. Use component variants rather than inline color overrides.
3. Keep document pages print-safe and dark enough.
4. Preserve typography hierarchy with token-based utilities.

Do not:

1. Reintroduce overly rounded controls beyond tokenized radius.
2. Use faint gray text in invoices/quotations/receipts.
3. Add duplicated local header spacing when shared header utilities already handle it.
4. Fork button/input/table styling per page without design-system reason.

## 9. Contributor Checklist

Before merging UI changes:

1. Verify token usage in changed files.
2. Check header alignment on desktop and mobile.
3. Validate at least one document page in print preview.
4. Confirm focus states and keyboard traversal for new controls.
5. Run `npm run check`.

When updating design rules, update this file and keep it aligned with `src/app.css` and shared UI components.
