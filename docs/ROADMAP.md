# Slate Development Roadmap

> **Goal**: Build step-by-step with clear validation at each checkpoint.  
> Each checkpoint = 1 commit. AI agent can pick up from any checkpoint.

---

## Phase 0: Project Foundation
**Duration**: ~2 hours | **Commits**: 3

### Checkpoint 0.1: Project Setup
**Commit**: `chore: initialize sveltekit project with dependencies`

**Tasks**:
- [ ] Initialize SvelteKit project with TypeScript
- [ ] Install dependencies:
  - shadcn-svelte, tailwindcss
  - drizzle-orm, better-sqlite3
  - lucia, @lucia-auth/adapter-drizzle
  - zod, sveltekit-superforms
  - lodash-es

**Validation**:
```bash
npm run dev        # ✓ Dev server starts on localhost:5173
npm run check      # ✓ No TypeScript errors
```

---

### Checkpoint 0.2: Tailwind + shadcn Setup
**Commit**: `feat: configure tailwind and shadcn-svelte`

**Tasks**:
- [ ] Configure tailwind.config.js with style guide tokens
- [ ] Initialize shadcn-svelte
- [ ] Add base components: Button, Input, Card, Badge
- [ ] Create app.css with CSS variables from STYLE_GUIDE.md

**Validation**:
```bash
# Visit localhost:5173
# ✓ Page loads with custom font (Inter)
# ✓ Button component renders correctly
```

---

### Checkpoint 0.3: Database Schema
**Commit**: `feat: add drizzle schema for all tables`

**Tasks**:
- [ ] Create schema files:
  - organizations.ts
  - users.ts
  - customers.ts
  - invoices.ts
  - expenses.ts
  - payments.ts
  - accounts.ts
  - journals.ts
- [ ] Create db/index.ts with SQLite connection
- [ ] Run migration to create tables

**Validation**:
```bash
npm run db:push    # ✓ Tables created in SQLite
# Check: data/slate.db exists
# Check: All tables visible in DB browser
```

---

## Phase 1: Authentication & Organization
**Duration**: ~3 hours | **Commits**: 3

### Checkpoint 1.1: Lucia Auth Setup
**Commit**: `feat: add lucia authentication`

**Tasks**:
- [ ] Configure Lucia with Drizzle adapter
- [ ] Create sessions table schema
- [ ] Add auth hooks in hooks.server.ts
- [ ] Create auth helper functions

**Validation**:
```typescript
// Test in REPL or script:
// ✓ Can create user with hashed password
// ✓ Can create session
// ✓ Can validate session
```

---

### Checkpoint 1.2: Login/Logout Pages
**Commit**: `feat: add login and logout pages`

**Tasks**:
- [ ] Create /login page with form
- [ ] Create /logout action
- [ ] Add form validation with Zod
- [ ] Redirect to dashboard on success
- [ ] Show errors on failure

**Validation**:
```bash
# Browser test:
# ✓ /login shows form
# ✓ Invalid credentials show error
# ✓ Valid login redirects to /dashboard
# ✓ /logout clears session
```

---

### Checkpoint 1.3: Organization Setup Wizard
**Commit**: `feat: add organization setup wizard`

**Tasks**:
- [ ] Create /setup page (shown on first login)
- [ ] Collect: name, address, GSTIN, state, FY start
- [ ] Validate GSTIN format
- [ ] Seed Chart of Accounts on completion
- [ ] Create first fiscal year

**Validation**:
```bash
# Browser test:
# ✓ New user redirected to /setup
# ✓ GSTIN validation works
# ✓ After setup, accounts table has 20+ rows
# ✓ fiscal_years table has 1 row
```

---

## Phase 2: App Shell & Navigation
**Duration**: ~2 hours | **Commits**: 2

### Checkpoint 2.1: Layout Shell
**Commit**: `feat: add app layout with sidebar`

**Tasks**:
- [ ] Create (app)/+layout.svelte with auth guard
- [ ] Build Sidebar component (200px)
- [ ] Build Header component (48px)
- [ ] Add navigation links:
  - Dashboard, Invoices, Customers, Expenses, Payments, Reports, Settings

**Validation**:
```bash
# Browser test:
# ✓ Sidebar visible on desktop
# ✓ Navigation links work
# ✓ Active route highlighted
# ✓ Unauthenticated → redirect to /login
```

---

### Checkpoint 2.2: Dashboard Skeleton
**Commit**: `feat: add dashboard with placeholder widgets`

**Tasks**:
- [ ] Create dashboard/+page.svelte
- [ ] Add widget placeholders:
  - Total Receivables
  - Total Payables
  - Overdue Amount
  - DSO
- [ ] Use Card component from shadcn

**Validation**:
```bash
# Browser test:
# ✓ Dashboard shows 4 widget cards
# ✓ Cards show ₹0 / placeholder data
# ✓ Layout matches STYLE_GUIDE
```

---

## Phase 3: Customer Management
**Duration**: ~3 hours | **Commits**: 3

### Checkpoint 3.1: Customer List
**Commit**: `feat: add customer list page`

**Tasks**:
- [ ] Create GET /api/customers endpoint
- [ ] Create customers/+page.svelte
- [ ] Build data table with columns:
  - Name, Phone, GSTIN, Balance, Status
- [ ] Add [+ New Customer] button

**Validation**:
```bash
# API test:
curl localhost:5173/api/customers
# ✓ Returns JSON with empty array

# Browser test:
# ✓ Table renders (empty state shown)
# ✓ New Customer button visible
```

---

### Checkpoint 3.2: Customer Form
**Commit**: `feat: add customer create/edit form`

**Tasks**:
- [ ] Create POST /api/customers endpoint
- [ ] Create customers/new/+page.svelte
- [ ] Build form with fields:
  - Name, Company, Email, Phone
  - Address, City, State, Pincode
  - GSTIN, GST Treatment
- [ ] Validate GSTIN matches state

**Validation**:
```bash
# Browser test:
# ✓ Form renders with all fields
# ✓ GSTIN validation error shown for wrong format
# ✓ Submit creates customer
# ✓ Redirects to customer list
```

---

### Checkpoint 3.3: Customer View & Edit
**Commit**: `feat: add customer detail page with edit`

**Tasks**:
- [ ] Create GET /api/customers/[id] endpoint
- [ ] Create PUT /api/customers/[id] endpoint
- [ ] Create customers/[id]/+page.svelte
- [ ] Show customer details with Edit button
- [ ] Show invoices list for customer (empty for now)

**Validation**:
```bash
# Browser test:
# ✓ Customer detail page loads
# ✓ Edit updates customer
# ✓ Balance shows ₹0.00
```

---

## Phase 4: Invoice Core
**Duration**: ~4 hours | **Commits**: 4

### Checkpoint 4.1: Invoice List
**Commit**: `feat: add invoice list page`

**Tasks**:
- [ ] Create GET /api/invoices endpoint
- [ ] Create invoices/+page.svelte
- [ ] Build table with columns:
  - Date, Number, Customer, Amount, Status
- [ ] Add status badge colors
- [ ] Add [+ New Invoice] button

**Validation**:
```bash
# Browser test:
# ✓ Empty state shown
# ✓ Table header matches style guide
```

---

### Checkpoint 4.2: Invoice Form - Basic
**Commit**: `feat: add invoice form with line items`

**Tasks**:
- [ ] Create invoices/new/+page.svelte
- [ ] Customer dropdown (from API)
- [ ] Date pickers (invoice date, due date)
- [ ] Line items table:
  - Description, HSN, Qty, Rate, Amount
  - Add row, remove row
- [ ] Calculate subtotal

**Validation**:
```bash
# Browser test:
# ✓ Customer dropdown populated
# ✓ Can add/remove line items
# ✓ Subtotal updates on change
# ✓ Keyboard navigation works
```

---

### Checkpoint 4.3: Invoice Form - GST
**Commit**: `feat: add gst calculation to invoice`

**Tasks**:
- [ ] Add GST rate dropdown per item (0, 5, 12, 18, 28)
- [ ] Detect intra/inter state from customer
- [ ] Calculate CGST/SGST or IGST
- [ ] Show tax summary:
  - Subtotal, CGST, SGST, IGST, Total

**Validation**:
```bash
# Browser test (intra-state):
# ✓ CGST + SGST shown (equal)
# ✓ IGST = 0

# Browser test (inter-state):
# ✓ IGST shown
# ✓ CGST = SGST = 0
```

---

### Checkpoint 4.4: Invoice Save (Draft)
**Commit**: `feat: save invoice as draft`

**Tasks**:
- [ ] Create POST /api/invoices endpoint
- [ ] Validate with Zod schema
- [ ] Generate invoice number (draft)
- [ ] Save invoice + invoice_items
- [ ] Redirect to invoice detail

**Validation**:
```bash
# API test:
curl -X POST localhost:5173/api/invoices -d '{...}'
# ✓ Returns invoice with id

# DB check:
# ✓ invoices table has row with status='draft'
# ✓ invoice_items table has rows
```

---

## Phase 5: Posting Engine
**Duration**: ~3 hours | **Commits**: 3

### Checkpoint 5.1: Number Series
**Commit**: `feat: add number series generator`

**Tasks**:
- [ ] Create NumberSeriesService
- [ ] Implement atomic increment
- [ ] Format: {PREFIX}-{FY}-{NNNN}
- [ ] Handle FY boundary

**Validation**:
```typescript
// Test:
const num1 = await getNextNumber(orgId, 'invoice', '2025-26');
const num2 = await getNextNumber(orgId, 'invoice', '2025-26');
// ✓ num1 = 'INV-2025-26-0001'
// ✓ num2 = 'INV-2025-26-0002'
// ✓ No duplicates under concurrency
```

---

### Checkpoint 5.2: Journal Engine
**Commit**: `feat: add posting engine for journals`

**Tasks**:
- [ ] Create PostingEngine service
- [ ] Implement posting rules from research.md
- [ ] Create journal entry + lines
- [ ] Validate: SUM(debit) = SUM(credit)
- [ ] Update account balances

**Validation**:
```typescript
// Test:
const je = await postingEngine.post('INVOICE_ISSUED', invoice);
// ✓ journal_entries row created
// ✓ journal_lines: AR debit, Sales credit, GST credits
// ✓ accounts.balance updated
// ✓ Total debit = Total credit
```

---

### Checkpoint 5.3: Invoice Issue Action
**Commit**: `feat: implement invoice issue with posting`

**Tasks**:
- [ ] Create POST /api/invoices/[id]/issue endpoint
- [ ] Validate FY not locked
- [ ] Generate final invoice number
- [ ] Call PostingEngine
- [ ] Update invoice status to 'issued'
- [ ] Update customer balance

**Validation**:
```bash
# Browser test:
# ✓ "Issue" button on draft invoice
# ✓ After issue: status = 'issued'
# ✓ Invoice number finalized
# ✓ Journal entry linked
# ✓ Customer balance increased
```

---

## Phase 6: Payments
**Duration**: ~3 hours | **Commits**: 3

### Checkpoint 6.1: Payment Form
**Commit**: `feat: add payment form`

**Tasks**:
- [ ] Create payments/new/+page.svelte
- [ ] Customer dropdown
- [ ] Amount, Date, Payment Mode, Reference
- [ ] Show unpaid invoices for customer
- [ ] Allocate to invoices

**Validation**:
```bash
# Browser test:
# ✓ Shows customer's unpaid invoices
# ✓ Can allocate amount to invoices
# ✓ Cannot over-allocate
```

---

### Checkpoint 6.2: Payment Recording
**Commit**: `feat: record payment with posting`

**Tasks**:
- [ ] Create POST /api/payments endpoint
- [ ] Create payment_allocations rows
- [ ] Post journal: Bank/Cash Dr, AR Cr
- [ ] Update invoice.amount_paid
- [ ] Update invoice.status if fully paid

**Validation**:
```bash
# Test full payment:
# ✓ Invoice status → 'paid'
# ✓ Invoice balance_due = 0
# ✓ Customer balance decreased

# Test partial payment:
# ✓ Invoice status → 'partially_paid'
# ✓ balance_due = original - paid
```

---

### Checkpoint 6.3: Overpayment Handling
**Commit**: `feat: handle payment overpayment as advance`

**Tasks**:
- [ ] Detect overpayment (amount > allocated)
- [ ] Create customer_advances row
- [ ] Flash message: "Excess ₹X added as advance"

**Validation**:
```bash
# Test overpayment:
# Invoice total: ₹1000
# Payment: ₹1200
# ✓ Advance created: ₹200
# ✓ customer_advances.balance = 200
```

---

## Phase 7: Expenses
**Duration**: ~2 hours | **Commits**: 2

### Checkpoint 7.1: Expense Form
**Commit**: `feat: add expense form`

**Tasks**:
- [ ] Create expenses/new/+page.svelte
- [ ] Category dropdown (from accounts)
- [ ] Amount, GST, Date, Vendor, Description
- [ ] Paid Through dropdown (Cash/Bank)

**Validation**:
```bash
# Browser test:
# ✓ Category shows expense accounts
# ✓ GST calculates correctly
```

---

### Checkpoint 7.2: Expense Recording
**Commit**: `feat: record expense with posting`

**Tasks**:
- [ ] Create POST /api/expenses endpoint
- [ ] Post journal: Expense Dr, Input GST Dr, Cash/Bank Cr
- [ ] Update account balances

**Validation**:
```bash
# DB check after expense:
# ✓ Expense account balance increased
# ✓ Cash/Bank balance decreased
# ✓ Input GST balance increased (if applicable)
```

---

## Phase 8: Reports
**Duration**: ~3 hours | **Commits**: 3

### Checkpoint 8.1: Aging Report
**Commit**: `feat: add accounts receivable aging report`

**Tasks**:
- [ ] Create GET /api/reports/aging endpoint
- [ ] Group invoices by age buckets:
  - Current, 1-30, 31-60, 61-90, 90+
- [ ] Create reports/aging/+page.svelte
- [ ] Show table with customer totals

**Validation**:
```bash
# API test with sample data:
# ✓ Invoices grouped correctly
# ✓ Totals match
```

---

### Checkpoint 8.2: Customer Ledger
**Commit**: `feat: add customer ledger report`

**Tasks**:
- [ ] Create GET /api/customers/[id]/ledger
- [ ] Show all transactions:
  - Invoice: Debit
  - Payment: Credit
  - Running balance
- [ ] Add to customer detail page

**Validation**:
```bash
# Browser test:
# ✓ Ledger shows chronological transactions
# ✓ Running balance correct
# ✓ Final balance = customer.balance
```

---

### Checkpoint 8.3: Dashboard Widgets (Live)
**Commit**: `feat: populate dashboard with live data`

**Tasks**:
- [ ] Total Receivables (sum of AR)
- [ ] Total Overdue
- [ ] DSO calculation
- [ ] Recent invoices list

**Validation**:
```bash
# Browser test after creating data:
# ✓ Widgets show real numbers
# ✓ DSO formula correct
```

---

## Phase 9: PDF Generation
**Duration**: ~2 hours | **Commits**: 2

### Checkpoint 9.1: Invoice PDF
**Commit**: `feat: add invoice pdf generation`

**Tasks**:
- [ ] Create PDF service (puppeteer or react-pdf)
- [ ] Invoice template with:
  - Header (logo, org info)
  - Customer info
  - Line items table
  - GST summary
  - Footer (terms, bank details)
- [ ] GET /api/invoices/[id]/pdf endpoint

**Validation**:
```bash
# Browser test:
# ✓ PDF download works
# ✓ PDF renders correctly
# ✓ GST shown correctly
```

---

### Checkpoint 9.2: Customer Statement
**Commit**: `feat: add customer statement pdf`

**Tasks**:
- [ ] Create statement template
- [ ] Show all transactions in period
- [ ] Opening + closing balance
- [ ] GET /api/customers/[id]/statement

**Validation**:
```bash
# ✓ PDF shows all invoices/payments
# ✓ Balances correct
```

---

## Phase 10: Polish & Production
**Duration**: ~3 hours | **Commits**: 3

### Checkpoint 10.1: Error Handling
**Commit**: `feat: add global error handling`

**Tasks**:
- [ ] Error boundary page
- [ ] Toast notifications for success/error
- [ ] Form validation messages
- [ ] API error responses

**Validation**:
```bash
# ✓ Errors show toast, not crash
# ✓ Form errors inline
```

---

### Checkpoint 10.2: Settings Page
**Commit**: `feat: add settings page`

**Tasks**:
- [ ] Organization details edit
- [ ] Tax settings
- [ ] Number series customization
- [ ] User profile

**Validation**:
```bash
# ✓ Can update org details
# ✓ Changes saved to DB
```

---

### Checkpoint 10.3: Production Build
**Commit**: `chore: prepare for production deployment`

**Tasks**:
- [ ] Environment variables
- [ ] Build optimization
- [ ] Docker setup (optional)
- [ ] README with setup instructions

**Validation**:
```bash
npm run build    # ✓ No errors
npm run preview  # ✓ Works
```

---

## Summary

| Phase | Checkpoints | Commits |
|-------|-------------|---------|
| 0. Foundation | 3 | 3 |
| 1. Auth & Org | 3 | 3 |
| 2. App Shell | 2 | 2 |
| 3. Customers | 3 | 3 |
| 4. Invoices | 4 | 4 |
| 5. Posting | 3 | 3 |
| 6. Payments | 3 | 3 |
| 7. Expenses | 2 | 2 |
| 8. Reports | 3 | 3 |
| 9. PDFs | 2 | 2 |
| 10. Polish | 3 | 3 |
| **Total** | **31** | **31** |

---

## How to Use This Roadmap

1. **Work checkpoint by checkpoint** - Each is ~30-60 mins
2. **Run validation before commit** - All checks must pass
3. **Commit message matches** - Use exact commit message
4. **AI can resume anywhere** - Just specify checkpoint number
5. **Skip if exists** - Check if code already exists before implementing

---

*Last Updated: February 1, 2026*
