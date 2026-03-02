# Learn Section UI Plan

## Goal

Add a first-class `Learn` section inside the app that makes Slate's accounting flows visually understandable.

The section should show:

- what each business action does
- which screens are used in each scenario
- how documents connect to each other
- what accounting entry is created underneath
- when to use quotation vs invoice vs receipt vs credit note vs expense vs supplier payment

This is not a static help page. It should feel like an interactive operating map for the product.

## Why This Fits Slate

Slate already has strong workflow coverage, but the product structure is spread across:

- Sales: quotations, invoices, receipts, customers
- Purchase: expenses, suppliers
- Reporting: cashbook, ledger, GST, P&L
- Accounting internals: journal entries, chart of accounts

Users can complete tasks, but they do not get a visual model of:

- "If I start with a quotation, what can happen next?"
- "What happens if an invoice is partially paid?"
- "When should I create a credit note instead of cancelling?"
- "What is the difference between an unpaid expense and a supplier payment?"
- "Which actions affect GST, receivables, payables, cashbook, and ledger?"

The `Learn` section should close that gap.

## Product Positioning

Treat `Learn` as a product section, not a docs dump.

Primary audience:

- founders and operators learning accounting through workflow
- accountants onboarding clients or team members
- internal users trying to understand system behavior before taking action

Secondary audience:

- power users who want to trace document and ledger consequences quickly

## Navigation Placement

Add `Learn` as a top-level sidebar item.

Recommended placement:

- after `Dashboard`
- before `Sales`

Reason:

- it is cross-functional
- it helps orient new users before they start posting documents
- it should not be hidden under `Reports`, because it is instructional, not analytical

Proposed nav label:

- `Learn`

Proposed icon:

- `GitBranch`
- fallback: `Map`
- fallback: `BookOpen`

## Information Architecture

Create a mini-hub with 4 surfaces.

### 1. Learn Home

Route:

- `/learn`

Purpose:

- landing page
- quick entry point into major workflows
- show a high-level system map

Content blocks:

- hero: "How money moves through Slate"
- visual map of core modules
- cards for major workflow families
- scenario shortcuts
- glossary strip

Workflow families:

- Sales Flow
- Purchase Flow
- Settlement Flow
- Returns and Adjustments
- Reports and Audit Trail

### 2. Workflow Explorer

Route:

- `/learn/workflows`

Purpose:

- interactive scenario explorer
- show decision branches and next valid actions

Examples:

- Quotation -> Invoice -> Payment -> Paid
- Invoice -> Part Payment -> Credit Note -> Balance Adjusted
- Expense -> Unpaid Supplier Bill -> Supplier Payment
- Expense -> Paid Immediately
- Supplier Payment -> Overpayment -> Supplier Credit

### 3. Document Relationship Map

Route:

- `/learn/map`

Purpose:

- graph or mind-map view of all business documents
- show how entities connect

Nodes:

- Quotation
- Invoice
- Receipt
- Credit Note
- Expense
- Supplier Payment
- Customer
- Supplier
- Journal Entry
- Cashbook
- GST Reports
- Party Ledger

### 4. Scenario Library

Route:

- `/learn/scenarios`
- optional detail routes like `/learn/scenarios/quotation-to-cash`

Purpose:

- practical examples with step-by-step guidance

Examples:

- Customer asks for estimate
- Quotation accepted and converted
- Invoice issued but not yet paid
- Customer pays partially
- Customer return or discount after invoice
- Purchase on supplier credit
- Immediate business expense paid from bank
- Supplier overpayment creating advance credit

## Visual Model

Do not make this look like a generic FAQ page.

The visual direction should feel like:

- process map
- operating system map
- accounting narrative

Recommended visual primitives:

- node cards
- directional connectors
- status chips
- entry badges like `Creates AR`, `Creates AP`, `Affects GST`, `Cash impact`
- swimlanes
- timeline rows
- accordions for underlying journal logic

Suggested layout system:

- desktop: split pane
- left side: scenario list / filters
- center: main map canvas
- right side: detail panel

On mobile:

- stack vertically
- map becomes horizontal scroll or simplified step cards

## Visual Language

Use consistent colors by domain:

- quotations: sand / muted gold
- invoices: blue
- receipts / customer payments: green
- credit notes: red
- expenses: amber or rust
- supplier payments: teal
- reports / journal / ledger: slate

Use semantic badges:

- `Creates Receivable`
- `Creates Payable`
- `Settles Receivable`
- `Settles Payable`
- `Adjusts Revenue`
- `Adjusts Expense`
- `Affects GST`
- `No Cash Movement`
- `Cash/Bank Movement`

Use connector styles:

- solid line: standard next step
- dashed line: optional path
- red branch: reversal / reduction / cancellation path
- dotted line: reporting output or downstream visibility

## Core Flows To Model

These should ship in v1.

### Sales

#### Flow 1: Quotation to Invoice

- Create quotation
- Send / discuss
- Convert to invoice
- Invoice posts receivable and sales tax
- Then move to payment outcomes

#### Flow 2: Invoice to Full Payment

- Invoice issued
- Receipt recorded
- Invoice settled
- Appears in cashbook and customer ledger

#### Flow 3: Invoice to Partial Payment

- Invoice issued
- One or more receipts
- Balance remains due
- Final payment closes invoice

#### Flow 4: Invoice to Credit Note

- After return / discount / correction
- Credit note reduces receivable and output tax
- Invoice status changes depending on amount and allocations

### Purchase

#### Flow 5: Expense Paid Immediately

- Record expense
- Cash or bank credited
- Expense and input GST debited
- Appears in expense ledger and cashbook

#### Flow 6: Expense on Supplier Credit

- Record expense as unpaid
- Accounts payable created
- Supplier balance increases
- Later settled via supplier payment

#### Flow 7: Supplier Payment

- Select supplier
- allocate against open expense bills
- reduce payable
- cash/bank goes down

#### Flow 8: Supplier Overpayment

- supplier payment exceeds open bills
- extra becomes supplier credit
- future bill can consume that credit

### Adjustments and Audit

#### Flow 9: Credit Note / Cancellation Path

- customer-side reduction scenarios
- map user intent to correct document

#### Flow 10: Reports Visibility

- after each transaction, show where it appears:
- cashbook
- party ledger
- GST summary
- GSTR-1 / GSTR-3B
- P&L
- journal entries

## Interaction Design

### Main Explorer Interactions

- click node -> open detail drawer
- hover edge -> explain relationship
- toggle by audience:
  - `Business view`
  - `Accounting view`
- toggle by domain:
  - `Sales`
  - `Purchase`
  - `Returns`
  - `Reports`
- toggle by consequence:
  - `Cash impact`
  - `GST impact`
  - `Receivable / Payable impact`

### Detail Drawer Contents

Each node or transition should show:

- what this action is
- when to use it
- what screen in Slate creates it
- what can happen next
- which reports reflect it
- optional underlying journal entry

Example sections:

- `Business Meaning`
- `Use This When`
- `Created From`
- `Next Valid Actions`
- `Accounting Impact`
- `Seen In Reports`

### Business vs Accounting Toggle

This is important.

Business view example:

- "You sent a bill to the customer"
- "You received money"
- "You owe this supplier"

Accounting view example:

- "Debit Accounts Receivable, Credit Sales"
- "Debit Bank, Credit Accounts Receivable"
- "Debit Expense + Input GST, Credit Accounts Payable"

## Suggested Technical Approach

### Option A: React Flow / XYFlow

Recommended if you want a true interactive map.

Pros:

- mature node-edge graph UI
- zoom / pan / fit view
- custom nodes and edges
- easy branching workflow visuals

Cons:

- more UI complexity
- needs careful mobile fallback

Fit:

- best for `/learn/map` and `/learn/workflows`

### Option B: Mermaid

Recommended only for fast prototype or static diagrams.

Pros:

- quick to author
- simple flowchart definitions

Cons:

- limited UI richness
- weaker interaction model
- harder to make feel product-grade

Fit:

- prototype only

### Option C: Custom SVG / HTML Canvas

Best if design must be highly custom and branded.

Pros:

- full control

Cons:

- highest engineering effort
- more maintenance

Fit:

- v2 after validating the feature

## Recommendation

Use:

- `@xyflow/svelte`

Reason:

- this codebase is Svelte
- the feature needs graph-style branching
- we want interactive nodes, not just static diagrams
- it supports future additions like node filters, walkthrough highlighting, and guided tours

## Content Model

Keep content data-driven so the UI can scale.

Recommended shape:

- `src/lib/learn/workflows.ts`
- `src/lib/learn/scenarios.ts`
- `src/lib/learn/glossary.ts`

Each workflow definition should include:

- `id`
- `title`
- `domain`
- `summary`
- `startingPoints`
- `nodes`
- `edges`
- `scenarios`
- `reportsAffected`

Each node should include:

- `id`
- `type`
- `title`
- `shortLabel`
- `description`
- `businessMeaning`
- `accountingImpact`
- `screenHref`
- `statusKinds`
- `tags`

Each edge should include:

- `from`
- `to`
- `label`
- `condition`
- `kind`

## Route Plan

### New routes

- `src/routes/(app)/learn/+page.svelte`
- `src/routes/(app)/learn/workflows/+page.svelte`
- `src/routes/(app)/learn/map/+page.svelte`
- `src/routes/(app)/learn/scenarios/+page.svelte`
- optional: `src/routes/(app)/learn/scenarios/[slug]/+page.svelte`

### Supporting files

- `src/lib/learn/workflows.ts`
- `src/lib/learn/scenarios.ts`
- `src/lib/learn/glossary.ts`
- `src/lib/components/learn/WorkflowMap.svelte`
- `src/lib/components/learn/WorkflowNode.svelte`
- `src/lib/components/learn/WorkflowDetailPanel.svelte`
- `src/lib/components/learn/ScenarioCard.svelte`
- `src/lib/components/learn/AccountingImpactCard.svelte`

### Existing files to update

- `src/lib/components/layout/sidebar.svelte`

## v1 Scope

Ship enough to be useful without boiling the ocean.

### v1 includes

- sidebar navigation entry
- Learn home page
- workflow explorer with 6 to 8 major flows
- business vs accounting toggle
- right-side detail panel
- report visibility tags
- mobile-safe simplified experience

### v1 does not include

- animated walkthrough tutorial engine
- user progress tracking
- admin-editable workflow CMS
- full ledger drilldowns from the map

## v2 Enhancements

- guided "tour mode"
- click-through from node to actual route
- report preview cards inside the detail panel
- glossary hover dictionary
- search across scenarios
- filter by role:
  - owner
  - accountant
  - operator
- onboarding checklist integration

## Design Notes

Avoid:

- generic documentation layout
- purple gradient tutorial style
- giant walls of text
- static screenshots without structure

Prefer:

- intentional maps
- strong connector hierarchy
- branded colors by workflow
- tactile cards with visible state
- labels that explain cause and effect

## Example UX Narrative

User opens `Learn`.

They see:

- `How Sales Works`
- `How Purchases Work`
- `How Cash Moves`
- `How Adjustments Work`

They click `Quotation -> Invoice -> Payment`.

They see:

- a left-to-right flow
- an optional branch for partial payments
- a red branch for credit note
- a detail panel saying:
  - what invoice creation means
  - which route creates it
  - journal effect
  - where it appears in reports

Then they switch to `Accounting view` and immediately understand the entry flow.

## Implementation Phases

### Phase 1: Foundation

- add sidebar nav item
- create route shell for `/learn`
- define shared workflow data structure
- seed first 4 core flows

### Phase 2: Explorer UI

- build node-edge map component
- add detail drawer / side panel
- add business vs accounting toggle
- add domain filters

### Phase 3: Scenario Library

- add card-based scenario pages
- create reusable scenario template
- link scenarios back to relevant routes

### Phase 4: Polish

- mobile simplification
- motion and transition tuning
- improve empty states
- add glossary and search

## Success Criteria

The feature succeeds if:

- a new user can understand the difference between quotation, invoice, receipt, credit note, expense, and supplier payment in under 5 minutes
- users can see what downstream reports a transaction affects
- users can understand partial settlement and adjustment paths visually
- the section feels native to the app, not like external documentation

## Build Order Recommendation

1. Create `/learn` landing page and top-level nav.
2. Implement workflow data model.
3. Build interactive explorer using `@xyflow/svelte`.
4. Ship sales and purchase flows first.
5. Add scenario pages and accounting view toggle.
6. Add reports visibility overlays and glossary.

## Notes Specific To Current Slate Flows

The first version should explicitly cover these real app paths:

- quotation create -> quotation convert -> invoice
- invoice create -> payment receipt -> full / partial settlement
- invoice -> credit note
- expense paid immediately
- expense on supplier credit
- supplier payment against one or many expenses
- supplier payment excess -> supplier credit
- transaction visibility in:
  - cashbook
  - party ledger
  - GST reports
  - P&L
  - journal entries

## Final Recommendation

Build this as an in-app interactive workflow system, not as markdown docs rendered in the UI.

Use a graph library for the map layer, keep the content data-driven, and ship a small but polished v1 focused on:

- sales flow
- purchase flow
- adjustments
- reporting visibility

That will make Slate feel significantly more understandable and more trustworthy.
