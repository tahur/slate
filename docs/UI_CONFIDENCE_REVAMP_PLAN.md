# UI Confidence Revamp Plan

Date: February 26, 2026  
Status: Proposed (project-wide)

## 1. Why This Revamp

Slate has strong accounting workflows, but UI consistency and visual confidence still vary across modules.  
This revamp standardizes the entire product around a modern SaaS direction while preserving functional behavior.

## 2. Design Direction (2025-26 Aligned)

This plan is built around these principles:

1. Leaner, calmer interfaces.
2. Purposeful motion.
3. Expressive typography + shape system.
4. Human visual warmth (less sterile, still professional).
5. Adaptive personalization.
6. Accessibility as baseline.
7. Design-system maturity and governance.

## 3. Program Goals

1. Make every module feel part of one product system.
2. Improve trust and readability for accounting-heavy screens.
3. Reduce visual noise and one-off styles.
4. Improve accessibility outcomes without reducing density.
5. Enable faster future UI work through reusable primitives.

## 4. Non-Goals

1. No changes to accounting logic or domain behavior.
2. No API or database contract changes for visual work.
3. No navigation IA rewrite in this program.
4. No redesign of report calculations or business rules.

## 5. Scope (Entire Project)

Public and auth:
1. Landing (`/`)
2. Login / Register / Forgot / Reset
3. Setup

Application shell:
1. `src/routes/(app)/+layout.svelte`
2. Header/sidebar components
3. Shared app frame, page containers, action bars

Core domains:
1. Dashboard
2. Invoices (list/new/edit/detail)
3. Quotations (list/new/detail)
4. Payments and Vendor Payments (list/new/detail)
5. Expenses (list/new/detail)
6. Customers and Vendors (list/new/detail)
7. Items (list/new/detail)
8. Credit Notes (list/new/detail)

Analytics and admin:
1. Reports (all sub-pages)
2. Settings
3. Activity Log
4. Journals
5. Accounts

Design primitives and foundations:
1. `src/app.css`
2. UI primitives under `src/lib/components/ui/*`
3. Layout primitives under `src/lib/components/layout/*`

## 6. Delivery Model

1. Token-first.
2. Primitive-first.
3. Page rollout in waves.
4. Hard QA gate at each phase.

## 7. Phase Roadmap

## Phase 0 - Baseline and Alignment (2-3 days)

Objective:
1. Lock scope, baseline screens, and measurable quality targets.

Work:
1. Capture before screenshots for all high-traffic routes.
2. Build UI inventory: colors, spacing, typography, shadows, motion, component variants.
3. Define success metrics (consistency, accessibility, regression rate).

Deliverables:
1. Baseline deck (before states).
2. UI debt register (one-off classes, duplicated patterns, hardcoded values).
3. Approved revamp checklist.

Exit criteria:
1. Baseline approved for public/auth/shell/core/admin pages.

## Phase 1 - Lean, Calmer Layout Foundation (4-5 days)

Objective:
1. Reduce noise and enforce strong visual hierarchy globally.

Work:
1. Normalize page containers, vertical rhythm, and spacing scale.
2. Standardize page header pattern (title, context, actions, status).
3. Standardize list page pattern (header, filters, table/card body, empty state).
4. Standardize detail page pattern (summary blocks, sections, sticky actions).
5. Remove ad-hoc negative margin and inconsistent full-bleed behaviors where possible.

Deliverables:
1. Shared page layout recipes in docs.
2. Updated global utility classes in `src/app.css`.
3. Refactored shell/page wrappers to common structure.

Exit criteria:
1. No new page-level layout pattern is introduced without a shared recipe.

## Phase 2 - Typography and Shape Identity (3-4 days)

Objective:
1. Build a clear brand voice via type hierarchy and shape language.

Work:
1. Finalize font stack strategy (UI, display, data/mono).
2. Define scale for headings, section labels, metadata, table text, and financial values.
3. Standardize corner radius tiers for controls, cards, dialogs, and chips.
4. Apply tabular/mono treatment for all key financial values and identifiers.

Deliverables:
1. Type and shape spec in this document.
2. Updated primitives for button/input/card/table/badge/select.

Exit criteria:
1. All high-traffic pages reflect consistent title/section/meta hierarchy.

## Phase 3 - Purposeful Motion (2-3 days)

Objective:
1. Improve feedback and clarity using minimal, meaningful animation.

Work:
1. Define motion tokens (duration/easing for hover, focus, transitions, panels).
2. Add motion only for interaction feedback and state change comprehension.
3. Remove decorative or attention-seeking animation.
4. Support `prefers-reduced-motion` across components.

Deliverables:
1. Motion policy and allowed patterns.
2. Updated transitions for sidebar, dialogs, popovers, toasts, action confirmations.

Exit criteria:
1. Every motion pattern has a purpose statement and reduced-motion fallback.

## Phase 4 - Humanized Visual Layer (3-4 days)

Objective:
1. Keep enterprise trust while reducing sterile/template feel.

Work:
1. Introduce subtle texture/noise or tonal surface variation in non-critical areas.
2. Add restrained brand personality in landing/auth/shell accents.
3. Improve icon treatment and section cues for warmth without clutter.
4. Keep data-heavy screens mostly neutral and precise.

Deliverables:
1. Humanized visual tokens/patterns (limited, documented).
2. Updated landing/auth visuals consistent with in-app language.

Exit criteria:
1. Brand feels distinct while preserving accounting-grade clarity.

## Phase 5 - Accessibility Baseline (4-5 days)

Objective:
1. Make accessibility a default quality gate.

Work:
1. Enforce focus visibility and keyboard flow in all interactive areas.
2. Verify target size for touch interactions (minimum 44x44 where needed).
3. Audit contrast across text, controls, status badges, and data states.
4. Ensure form validation messages and semantic states are clear.
5. Validate table readability at small viewports.

Deliverables:
1. Accessibility checklist and test matrix.
2. Fixed issues across primitives and top routes.

Exit criteria:
1. Keyboard navigation and focus behavior are reliable on all core workflows.

## Phase 6 - Adaptive Personalization (4-6 days)

Objective:
1. Add safe personalization without fragmentation.

Work:
1. Theme presets (for example: Neutral, Warm, High Contrast) mapped to semantic tokens.
2. Role/context-aware UI emphasis (owner/accountant/operator) for density and cueing.
3. Persist user visual preferences.
4. Keep one component API; adapt via tokens and role context only.

Deliverables:
1. Theme token sets and preference storage.
2. Role surface rules documented and applied in shell + key pages.

Exit criteria:
1. Personalization works without component duplication or style drift.

## Phase 7 - Design-System Maturity (5-7 days)

Objective:
1. Move from page styling to governed system styling.

Work:
1. Complete semantic token map in `src/app.css`.
2. Remove hardcoded color/spacing values from primitives and major pages.
3. Strengthen variant APIs for button/input/select/card/table/badge/sidebar.
4. Add documentation examples for each variant and state.
5. Add lint guardrails for design-token and button class usage.

Deliverables:
1. Stable primitive library and usage rules.
2. Guardrail scripts integrated in CI/local checks.

Exit criteria:
1. New UI work can be built with primitives/tokens only for 90%+ cases.

## Phase 8 - Page Rollout Waves (2-3 weeks total)

Objective:
1. Apply the new system to every route group with low regression risk.

Wave A (Core revenue workflows):
1. Dashboard
2. Invoices (all pages)
3. Payments and Vendor Payments (all pages)
4. Expenses (all pages)

Wave B (Master data + documents):
1. Customers and Vendors (all pages)
2. Items (all pages)
3. Quotations and Credit Notes (all pages)

Wave C (Control + analytics):
1. Reports (all pages)
2. Settings
3. Activity Log
4. Journals
5. Accounts
6. Public/auth/setup final consistency pass

Deliverables:
1. Updated pages per wave with before/after snapshots.
2. Wave QA report and known-issues log.

Exit criteria:
1. Each wave passes all quality gates before next wave begins.

## Phase 9 - QA, Release, and Governance (3-4 days)

Objective:
1. Ship safely and prevent regressions.

Work:
1. Run `npm run check`, `npm run lint:buttons`, `npm run build` for each release candidate.
2. Responsive QA: mobile, tablet, desktop on priority pages.
3. Accessibility regression checks.
4. Update `docs/STYLE_GUIDE.md` with final system rules.
5. Create a lightweight UI review checklist for PRs.

Deliverables:
1. Release-ready UI revamp build.
2. Governance checklist for future features.

Exit criteria:
1. Revamp accepted and guardrails active for ongoing development.

## 8. Quality Gates (Applied Every Phase)

1. No visual changes merged without before/after screenshots.
2. No new hardcoded one-off colors unless approved in token map.
3. No regressions on keyboard navigation in edited screens.
4. `check`, `lint:buttons`, and `build` must pass.
5. Updated docs for every new reusable pattern.

## 9. Success Metrics

Product perception:
1. Users describe UI as clearer, calmer, more trustworthy.

Consistency:
1. Major reduction in hardcoded visual values across routes.
2. Fewer one-off layout exceptions.

Accessibility:
1. Strong focus visibility and keyboard flow on core journeys.

Delivery speed:
1. New feature UI built mostly from existing primitives/tokens.

## 10. Risks and Mitigations

1. Risk: Over-polish reduces information density.  
Mitigation: Protect compact table/form patterns and test with real accounting screens.

2. Risk: Personalization introduces inconsistency.  
Mitigation: Personalization only via semantic tokens and role rules.

3. Risk: Phase spillover across many routes.  
Mitigation: Strict wave boundaries and freeze criteria per wave.

4. Risk: Accessibility regressions during visual updates.  
Mitigation: Accessibility checks embedded into each phase gate.

## 11. Suggested Timeline

1. Phases 0-3: Week 1-2
2. Phases 4-7: Week 3-5
3. Phase 8 rollout waves: Week 6-8
4. Phase 9 release/governance: Week 9

## 12. Immediate Next Steps

1. Approve this phase plan.
2. Start Phase 0 baseline capture and UI debt register.
3. Convert current `src/app.css` tokens into the finalized semantic map.
4. Begin Phase 1 by standardizing shell + page container recipes.

## 13. Phase 2 Type and Shape Spec (Implemented Foundation)

Typography strategy:
1. UI text font: `Manrope` (variable weight support).
2. Display/headline font: `Space Grotesk`.
3. Data/financial font: `JetBrains Mono`.

Type scale tokens:
1. Page title: `--text-page-title-size` (`clamp(1.125rem, 1.02rem + 0.45vw, 1.5rem)`).
2. Section title: `--text-section-title-size`.
3. Section label/meta label: `--text-section-label-size` (uppercase utility usage).
4. Metadata/supporting text: `--text-meta-size`.
5. Table body baseline: `--text-table-size`.
6. Financial value baseline: `--text-value-size` + tabular numerals.

Shape tokens:
1. Control radius: `--radius-control` (inputs, buttons, selects).
2. Card surface radius: `--radius-card`.
3. Dialog radius: `--radius-dialog`.
4. Chip/badge radius: `--radius-chip`.
5. Backward-compatible bridge via `--radius`, `--radius-lg`, `--radius-md`, `--radius-sm`.

Utility classes introduced:
1. `type-page-title`, `type-section-title`, `type-section-label`, `type-meta`.
2. `type-table`, `type-value`, `type-value-lg`.
3. `shape-control`, `shape-card`, `shape-dialog`, `shape-chip`.

Phase 2 primitive targets updated:
1. `button`, `input`, `textarea`, `card`.
2. `badge`.
3. `select` trigger/content/item/label.
4. `table` container/head/header/row/cell/footer.

## 14. Phase 3 and 4 Foundations (Started)

Phase 3 - Purposeful motion foundations:
1. Added motion tokens in `src/app.css`:
   `--motion-fast`, `--motion-base`, `--motion-slow`,
   `--ease-standard`, `--ease-emphasized`, `--ease-exit`.
2. Introduced reusable motion utilities:
   `motion-interactive`, `motion-enter`, `motion-overlay`.
3. Added `surface-rise` keyframe for calm content entry.
4. Added reduced-motion baseline with `prefers-reduced-motion` to suppress non-essential animation.
5. Applied motion token timing to key overlays/components (`sheet`, `alert-dialog`, `tooltip`, sidebar menu actions).

Phase 4 - Humanized visual layer foundations:
1. Introduced restrained shell atmosphere in `app-surface`:
   subtle radial tint + low-noise texture.
2. Added `sidebar-atmosphere` and `header-atmosphere` treatments:
   soft gradient, mild texture, and low-strength blur.
3. Updated sidebar/menu visuals to feel less sterile while preserving enterprise clarity.
4. Kept document/print experiences neutral and explicitly disabled atmosphere layers in print mode.

Current intent:
1. Motion is now feedback-oriented (state change + navigation clarity), not decorative.
2. Humanized styling is limited to shell/navigation surfaces; data tables and financial sheets stay neutral.
