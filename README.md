# OpenBill

OpenBill is a self-hosted, GST‑ready accounting system for Indian micro enterprises. It covers invoicing, payments, expenses, and reporting with a double‑entry posting engine under the hood.

## Features
- Customer management
- GST‑compliant invoices with line items
- Payment allocation and overpayment handling
- Expense tracking with GST split
- Reports: Aging, Customer Ledger, GST Summary, P&L
- PDF generation for invoices and customer statements

## Tech Stack
- SvelteKit + Svelte 5 + TypeScript
- Tailwind CSS + shadcn-svelte components
- SQLite + Drizzle ORM
- Lucia authentication
- Puppeteer PDF engine

## Getting Started

### 1) Install dependencies
```sh
npm install
```

### 2) Configure environment
Copy `.env.example` and edit as needed.

### 3) Run in development
```sh
npm run dev
```

Then open `http://localhost:5173` and complete the `/setup` flow to create the organization and chart of accounts.

## Environment Variables
```env
OPENBILL_DB_PATH=data/openbill.db
PUPPETEER_EXECUTABLE_PATH=
CHROME_PATH=
```

If Puppeteer cannot detect Chrome/Chromium, set `PUPPETEER_EXECUTABLE_PATH` or `CHROME_PATH`.

## Build & Preview
```sh
npm run build
npm run preview
```

## Database
The SQLite database is stored at `data/openbill.db` by default. You can change this using `OPENBILL_DB_PATH`.

## Notes
- The default adapter is `adapter-auto`. If you deploy to a specific environment, consider switching to a fixed adapter.
- PDF rendering requires a working Chrome/Chromium binary.
