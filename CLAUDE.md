# Slate

Invoicing & accounting app for Indian small businesses. Users create invoices, record payments, track expenses — Slate handles GST, double-entry bookkeeping, and compliance automatically.

## Tech Stack

- **Framework**: SvelteKit 5 (runes mode) with `@sveltejs/adapter-node`
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL (Supabase) via `postgres` driver
- **ORM**: Drizzle ORM — schema in `src/lib/server/db/schema/`, migrations in `migrations/`
- **CSS**: TailwindCSS 4 + custom design tokens in `src/app.css`
- **Auth**: better-auth (email/password, session-based)
- **PDF**: pdfmake (server-side invoice generation)
- **Email**: nodemailer
- **Validation**: Zod 4 + sveltekit-superforms
- **UI Components**: shadcn-svelte (`src/lib/components/ui/`)
- **Money**: decimal.js for all arithmetic

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # svelte-check (type checking)
npm run ci           # check + build + guardrail scripts
npm run db:push      # Push Drizzle schema to database
npm run db:studio    # Open Drizzle Studio
```

## Architecture

```
src/
├── routes/
│   ├── (app)/              # Authenticated app routes
│   │   ├── invoices/       # Invoice CRUD, PDF, issue, settle
│   │   ├── payments/       # Payment recording with invoice allocation
│   │   ├── expenses/       # Expense tracking with GST input tax
│   │   ├── customers/      # Customer management
│   │   ├── reports/        # Cashbook, GST reports
│   │   └── settings/       # Org settings, payment methods
│   ├── login/              # Auth pages
│   ├── register/
│   └── setup/              # First-time org setup
├── lib/
│   ├── components/         # Shared Svelte components
│   │   └── ui/             # shadcn-svelte primitives
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema/     # Drizzle table definitions
│   │   │   └── index.ts    # DB connection
│   │   ├── modules/        # Domain modules
│   │   │   ├── invoicing/  # Invoice workflows & queries
│   │   │   ├── receivables/ # Payment posting & allocation
│   │   │   └── reporting/  # GST report queries
│   │   ├── services/
│   │   │   └── posting-engine.ts  # Double-entry journal engine
│   │   └── seed.ts         # Chart of accounts seeder
│   ├── utils/              # Shared utilities (currency, date, etc.)
│   └── pdf/                # Invoice PDF template
```

## Key Conventions

### Svelte 5 Runes
Use `$state`, `$props`, `$derived`, `$effect` exclusively. No legacy `let` exports or stores.

### Money Math
All monetary calculations use `decimal.js` with `round2()` helper. Never use raw float arithmetic for money.

### Double-Entry Bookkeeping
Every financial transaction (invoice issue, payment, expense) creates journal entries via `posting-engine.ts`. Debits always equal credits.

### Indian GST
- Intra-state: CGST + SGST (rate split in half)
- Inter-state: IGST (full rate)
- HSN/SAC codes on invoice line items
- Tax rates: 0%, 5%, 12%, 18%, 28%

### Payment System
Three tables work together:
- `payment_methods` — cash, UPI, card, netbanking, cheque
- `payment_accounts` — specific bank accounts / wallets
- `payment_method_account_map` — links methods to accounts per org

### Forms
Server-side validation with sveltekit-superforms + Zod schemas. Form actions handle mutations.

### UI
shadcn-svelte components with custom design tokens. Keep UI simple — hide accounting jargon (ledger codes, journal entries) from users.

## Database

Drizzle schema files live in `src/lib/server/db/schema/`. Key tables:
- `organizations`, `users` — multi-tenant, org-scoped
- `customers`, `vendors` — counterparties
- `invoices`, `invoice_items` — GST invoices
- `payments`, `credit_allocations` — payment tracking
- `expenses` — expense tracking with input tax
- `journals`, `journal_lines` — double-entry ledger
- `accounts` — chart of accounts
- `payment_methods`, `payment_accounts`, `payment_method_account_map` — payment config

Run `npm run db:push` to sync schema changes to the database.

## Docker

Multi-stage Dockerfile: deps -> build -> runner (non-root user, healthcheck).
Entry point runs migrations before starting the server.

Required env vars:
- `DATABASE_URL` — Postgres connection string
- `BETTER_AUTH_SECRET` — Auth secret key
- `ORIGIN` — Public URL (e.g. `https://app.example.com`)

```bash
docker build -t slate .
docker run -p 3000:3000 --env-file .env slate
```

## Philosophy

Simple for end users, proper accounting underneath. Users think in business terms (invoices, payments, expenses) — never in journal entries or ledger codes. Every feature must pass the "would a shopkeeper understand this?" test.
