# Slate

<div align="center">

![Slate Logo](https://img.shields.io/badge/Slate-Accounting-4F46E5?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwySCAxMy41VjIwLjVIMTJWMnoiIGZpbGw9IndoaXRlIi8+PC9zdmc+)

**Modern, Self-Hosted Accounting for Indian Small Businesses**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.50+-FF3E00?logo=svelte)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-Latest-C5F74F?logo=drizzle)](https://orm.drizzle.team/)

[Features](#features) • [Demo](#demo) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🎯 What is Slate?

**Slate** is a **self-hosted, open-source accounting system** built specifically for **Indian micro and small businesses**. It provides **GST-compliant invoicing**, payment tracking, expense management, and financial reporting—all powered by a robust **double-entry accounting engine**.

Unlike cloud-based solutions, Slate gives you **complete control** of your financial data with **zero monthly fees**. Run it on your own server, laptop, or VPS.

### 🎨 Business-First, Not Accounting-First

Slate is designed for **business owners, not accountants**. You don't need to understand debits and credits—just create invoices, record payments, and track expenses. The accounting **happens automatically** behind the scenes.

**Business language you understand:**
- "Create Invoice" → System posts: Debit AR, Credit Sales, Credit GST
- "Record Payment" → System posts: Debit Cash, Credit AR
- "Add Expense" → System posts: Debit Expense, Credit Cash

### 🔒 Built on Rock-Solid Foundations

- **Immutable Ledger** - Once posted, transactions can never be edited, only reversed (like a bank statement)
- **Idempotency Guarantees** - Accidentally clicking "Submit" twice? No problem—duplicate transactions are impossible
- **Accounting Invariants** - Database-level checks ensure your books are **always** balanced
- **Complete Audit Trail** - Every change is logged with who, what, and when

### Why "Slate"?

A slate represents a **clean start**—just like double-entry accounting gives you a clear, balanced view of your finances. Every transaction is recorded, every penny is accounted for, and your books are always clean.

---

## ✨ Features

### 🛡️ Core Guarantees

- ✅ **ACID Compliant** - Full database ACID guarantees (Atomicity, Consistency, Isolation, Durability)
- ✅ **Immutable Ledger** - Posted transactions can never be edited, only reversed (complete audit trail)
- ✅ **Idempotency** - Duplicate submissions are automatically prevented (safe to retry)
- ✅ **Always Balanced** - Database constraints ensure debits always equal credits
- ✅ **Atomic Operations** - Transactions either complete fully or not at all (no partial states)
- ✅ **Audit Logging** - Every change is logged with timestamp, user, and action

### �📊 Core Accounting

- ✅ **GST-Compliant Invoicing** - Automatic CGST/SGST/IGST calculation with intra/inter-state routing
- ✅ **Double-Entry Posting Engine** - Every transaction maintains accounting integrity with database-level constraints
- ✅ **Payment Allocation** - Smart payment matching with overpayment handling (advance credits)
- ✅ **Credit Notes** - Handle returns and sales adjustments correctly
- ✅ **Expense Tracking** - Record expenses with input GST split
- ✅ **Multi-Document Linking** - Link payments to multiple invoices, track credit note allocations

### 📈 Financial Management

- ✅ **Chart of Accounts** - Pre-configured Indian accounting structure
- ✅ **Journal Entries** - Full double-entry journal with immutable posting
- ✅ **Account Balances** - Real-time running balances for all accounts
- ✅ **Complete Audit Trail** - Immutable history of all financial transactions
- ✅ **Number Series** - Automatic document numbering (INV-2026-0001, PAY-2026-0042, etc.)

### 📑 Reports & Compliance

- ✅ **Customer Aging Report** - See who owes what, when
- ✅ **Customer Ledger** - Complete transaction history per customer
- ✅ **GST Summary** - Monthly GSTR-1 preparation support
- ✅ **Profit & Loss** - Income and expense breakdown
- ✅ **Activity Log** - Full audit trail of user actions

### 🎨 User Experience

- ✅ **Modern UI** - Built with Svelte 5 and Tailwind CSS v4
- ✅ **Dark Mode** - Easy on the eyes, day or night
- ✅ **PDF Generation** - Print professional invoices and statements
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Progressive Enhancement** - Works without JavaScript (forms submit natively)

### 🔒 Security & Privacy

- ✅ **Self-Hosted** - Your data stays on your server
- ✅ **Session-Based Auth** - Secure authentication via Lucia Auth
- ✅ **Argon2id Password Hashing** - Industry-standard password security
- ✅ **Multi-Tenancy** - Org-level data isolation
- ✅ **No Tracking** - Zero telemetry, zero phone-home

---

## 🖼️ Screenshots

> _Coming soon: Dashboard, Invoice, Payment, and Reports screenshots_

---

## 🛠️ Tech Stack

Slate is built with modern, battle-tested technologies:

### Frontend
- **[Svelte 5](https://svelte.dev/)** - Reactive UI framework (Runes mode)
- **[SvelteKit](https://kit.svelte.dev/)** - Full-stack meta-framework
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn-svelte](https://shadcn-svelte.com/)** - Beautiful UI components (bits-ui)
- **[Lucide Icons](https://lucide.dev/)** - Clean, consistent icons

### Backend
- **[SQLite](https://www.sqlite.org/)** - Embedded SQL database (via better-sqlite3)
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database queries
- **[Lucia Auth](https://lucia-auth.com/)** - Session-based authentication
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[Decimal.js](https://mikemcl.github.io/decimal.js/)** - Precision financial math

### Utilities
- **[sveltekit-superforms](https://superforms.rocks/)** - Advanced form handling
- **[pdfmake](http://pdfmake.org/)** - Client-side PDF generation
- **TypeScript** - End-to-end type safety

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Chrome/Chromium** (for PDF generation)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/slate.git
cd slate

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Start development server
npm run dev
```

Open **http://localhost:5173** and complete the setup wizard!

### First-Time Setup

1. **Navigate to `/register`** - Create your first user account
2. **Navigate to `/setup`** - Configure your organization details:
   - Business name, address, state (for GST)
   - GSTIN (optional, for registered businesses)
   - Bank details, UPI ID
3. **Start using Slate!** - The database and chart of accounts are created automatically

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database path (default: data/slate.db)
SLATE_DB_PATH=data/slate.db

# Chrome path for PDF generation (optional)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
# or on macOS:
# CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

---

## 📁 Project Structure

```
slate/
├── src/
│   ├── lib/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # shadcn-svelte base components
│   │   │   └── forms/       # Form-specific components
│   │   ├── server/          # Server-only code
│   │   │   ├── db/          # Database connection & schemas
│   │   │   ├── services/    # Business logic (posting engine, etc.)
│   │   │   └── auth.ts      # Lucia authentication
│   │   └── utils/           # Shared utilities
│   ├── routes/              # SvelteKit file-based routing
│   │   ├── (app)/          # Protected routes (dashboard, invoices, etc.)
│   │   ├── login/          # Public authentication
│   │   └── api/            # API endpoints
│   └── hooks.server.ts      # Global server hooks (auth middleware)
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System architecture (detailed)
│   ├── ROADMAP.md          # Feature roadmap
│   ├── STYLE_GUIDE.md      # Code style guide
│   └── ACCOUNTING_INVARIANTS.md # Accounting rules
├── migrations/              # Drizzle database migrations
├── static/                  # Static assets
└── data/                    # SQLite database (created on first run)
```

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) folder:

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - Complete system architecture, tech stack decisions, database schema, and gotchas (for developers and LLMs)
- **[Roadmap](./docs/ROADMAP.md)** - Feature roadmap and development plans
- **[Style Guide](./docs/STYLE_GUIDE.md)** - Code style and design patterns
- **[Accounting Invariants](./docs/ACCOUNTING_INVARIANTS.md)** - Double-entry accounting rules enforced by Slate

---

## 🧪 Development

### Database Commands

```bash
# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Type Checking

```bash
# Run type checks
npm run check

# Run type checks in watch mode
npm run check:watch
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

---

## 🐳 Deployment

### Docker (Example)

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

# Install Chromium for PDF generation
RUN apk add --no-cache chromium

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV SLATE_DB_PATH=/app/data/slate.db

EXPOSE 3000
CMD ["node", "build"]
```

### VPS / Bare Metal

1. Clone repository
2. Install dependencies: `npm ci --production`
3. Build: `npm run build`
4. Run with PM2: `pm2 start build/index.js --name slate`
5. Set up reverse proxy (nginx/caddy)

---

## 🔒 Security

Slate takes security seriously:

- **Argon2id password hashing** - Resistant to GPU/ASIC attacks
- **Session-based auth** - No JWT complexity, secure cookie storage
- **SQL injection protection** - Drizzle ORM uses parameterized queries
- **Multi-tenancy isolation** - Every query filters by `org_id`
- **Audit logging** - Complete trail of financial transactions

**Found a security issue?** Please email security@yourproject.com instead of opening a public issue.

---

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

### Development Guidelines

1. **Follow accounting principles** - Never bypass the posting engine
2. **Use Decimal.js** for all currency operations (never use JavaScript's `Number` for money)
3. **Write tests** for critical financial logic
4. **Add audit logs** for sensitive operations
5. **Respect immutability** - Posted journal entries cannot be edited, only reversed

See [`docs/STYLE_GUIDE.md`](./docs/STYLE_GUIDE.md) for detailed code style guidelines.

---

## 🗺️ Roadmap

Slate is under active development. See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the full roadmap.

### Upcoming Features

- [ ] **Vendor Management** - Track purchases and accounts payable
- [ ] **Bank Reconciliation** - Match bank statements with transactions
- [ ] **Recurring Invoices** - Automate subscription billing
- [ ] **Multi-Currency** - Support for foreign currencies
- [ ] **E-Way Bill Integration** - Generate e-way bills for goods transport
- [ ] **GSTR Reports** - Direct GSTR-1, GSTR-3B generation
- [ ] **Mobile App** - Native iOS/Android companion app

---

## 💡 Key Concepts

### ACID Compliance (Financial-Grade Reliability)

Slate provides **full ACID guarantees** for all financial transactions:

#### ⚛️ Atomicity
Transactions are **all-or-nothing**. If creating an invoice fails halfway through, the entire operation rolls back—no partial invoices, no orphaned line items.

```typescript
// Either ALL of these happen, or NONE of them happen:
db.transaction(async (tx) => {
    await tx.insert(invoices).values(invoiceData);      // 1. Insert invoice
    await tx.insert(invoice_items).values(lineItems);   // 2. Insert line items
    await tx.insert(journal_entries).values(journal);   // 3. Create journal entry
    await tx.update(accounts).set({ balance: ... });    // 4. Update account balances
});
```

#### ✅ Consistency
Database constraints **always** enforce accounting rules. Even if there's a bug in the code, the database will reject invalid data:

```sql
-- This transaction will be REJECTED by the database:
INSERT INTO journal_entries (total_debit, total_credit) 
VALUES (1000.00, 999.99);  -- ❌ ERROR: Debits ≠ Credits
```

#### 🔒 Isolation
**WAL (Write-Ahead Logging) mode** ensures readers don't block writers. Multiple users can:
- Read invoices while another user creates a payment
- Generate reports while invoices are being posted
- No "database is locked" errors under normal load

#### 💾 Durability
Once a transaction is committed, it **survives** system crashes, power failures, or app restarts:

```typescript
// After this commits, the invoice EXISTS even if:
// - Server crashes immediately
// - Power goes out
// - Application is force-killed
await db.insert(invoices).values(data);
```

Slate uses `PRAGMA synchronous = FULL`, which means data is **physically written to disk** before the transaction completes.

### Business-First Design Philosophy

You don't need to be an accountant to use Slate. Just do what's natural:

- **Create an invoice** → Accounting happens automatically
- **Record a payment** → Ledger updates in the background
- **Track an expense** → Double-entry posting is transparent

Slate translates business actions into proper accounting entries, so you can focus on running your business.

### Immutable Ledger

Once a transaction is posted, it becomes **permanent**. This is not a bug—it's a feature!

**Why immutability matters:**
- ✅ Complete audit trail (like a bank statement)
- ✅ Prevents accidental data corruption
- ✅ Enables proper financial audits
- ✅ Reversal-based corrections (industry standard)

**Example:** Made a mistake on an invoice? Don't edit it—issue a credit note and create a new invoice. This preserves the history of what actually happened.

### Idempotency Guarantees

**Problem:** User clicks "Create Invoice" twice → Two identical invoices?

**Slate's solution:** Every transaction has a unique idempotency key. If you submit the same request twice, only one invoice is created. Safe to retry!

```typescript
// Behind the scenes
idempotencyKey = generateUniqueKey();
if (invoiceExists(idempotencyKey)) {
    return existingInvoice; // No duplicate!
}
createInvoice(data, idempotencyKey);
```

### Double-Entry Accounting (Transparent)

Slate uses a **double-entry accounting system**. Every transaction affects at least two accounts:

```
Invoice Issued (What you see: "Create Invoice"):
  Debit:  Accounts Receivable (Asset)      +₹11,800
  Credit: Sales Revenue (Income)           -₹10,000
  Credit: Output CGST (Liability)          -₹900
  Credit: Output SGST (Liability)          -₹900
```

This ensures your books are always balanced and provides a complete audit trail—**but you never need to think about it!**

### GST Compliance

Slate automatically handles India's GST tax structure:

- **Intra-State**: CGST + SGST (e.g., 9% + 9% = 18%)
- **Inter-State**: IGST (e.g., 18%)

The system determines this based on your organization's state code vs. customer's state code.

### Accounting Invariants (Database-Level Safety)

Slate enforces strict accounting rules at the **database level** using SQL `CHECK` constraints:

1. ✅ **Balanced Entries** - Total debits MUST equal total credits (enforced by DB)
2. ✅ **Single-Sided Lines** - Each journal line is debit OR credit, never both
3. ✅ **Non-Negative Amounts** - All amounts must be ≥ 0 (no negative debits/credits)
4. ✅ **Immutable Posts** - Posted entries cannot be edited, only reversed
5. ✅ **Minimum Lines** - Every journal entry must have at least 2 lines

**Why this matters:** Even if there's a bug in the code, the database will **reject** any transaction that violates these rules. Your financial data is protected at the lowest level.

```sql
-- Example: Database enforces balanced entries
ALTER TABLE journal_entries ADD CONSTRAINT balanced_entry 
  CHECK(ROUND(total_debit, 2) = ROUND(total_credit, 2));

-- Example: Single-sided journal lines
ALTER TABLE journal_lines ADD CONSTRAINT single_sided 
  CHECK(NOT (debit > 0 AND credit > 0));
```

---

## 📄 License

Slate is open-source software licensed under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2026 Slate Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

Slate is built on the shoulders of giants:

- **[SvelteKit](https://kit.svelte.dev/)** - The amazing full-stack framework
- **[Drizzle ORM](https://orm.drizzle.team/)** - The best TypeScript ORM
- **[shadcn-svelte](https://shadcn-svelte.com/)** - Beautiful UI components
- **[Lucia Auth](https://lucia-auth.com/)** - Simple, secure authentication
- **Indian GST System** - For keeping things... interesting 😅

---

## 🧠 How This Was Really Built

This project grew through a lot of experimenting—trying things, breaking them, fixing them, and starting over more times than I can count. AI helped along the way, but every choice, every tweak, and every "this doesn't feel right" moment came from human judgment. The code carries all those small mistakes, lessons, and iterations. It's not perfect—and that's exactly what makes it real.

---

## 💬 Support

- **Documentation**: [`/docs`](./docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/slate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/slate/discussions)

---

<div align="center">

**Made with ❤️ for Indian small businesses**

[⬆ Back to Top](#slate)

</div>
