# OpenBill Architecture & Tech Stack

## Technology Stack

### Core Framework
-   **Framework**: [SvelteKit](https://kit.svelte.dev/) (Full-stack meta-framework)
-   **Language**: TypeScript
-   **Runtime**: Node.js (Adapter: `@sveltejs/adapter-node`)

### Frontend
-   **UI Library**: Svelte 5 (Runes mode)
-   **Styling**: Tailwind CSS v4
-   **Component Library**: Custom set based on [Shadcn-Svelte](https://shadcn-svelte.com/) (using `bits-ui`)
-   **Icons**: Lucide Svelte

### Backend & Database
-   **Database Engine**: SQLite (via `better-sqlite3`)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Authentication**: [Lucia Auth](https://lucia-auth.com/) v3 (Session-based)

### Utilities
-   **Validation**: Zod (Schema validation)
-   **Forms**: `sveltekit-superforms` (Form handling & server-side validation)
-   **PDF Generation**: `pdfmake`
-   **Math**: `decimal.js` (Financial calculations)

---

## Architecture Overview

OpenBill follows a standard **SvelteKit Server-Side Rendering (SSR)** architecture with progressive enhancement.

### Client-Server Communication

1.  **Data Loading (GET Requests)**:
    -   Requests hit `+page.server.ts` `load` functions.
    -   Server fetches data from SQLite via Drizzle.
    -   Data is serialized and sent to the client as specific JSON (SvelteKit data).
    -   `+page.svelte` receives this data via the `data` prop.

2.  **State Muation (POST Requests)**:
    -   Forms submit to **Form Actions** defined in `+page.server.ts` (`export const actions = { ... }`).
    -   `use:enhance` is used on `<form>` elements to enable progressive enhancement (AJAX submission without page reload).
    -   Server validates inputs using `zod` and `superforms`.
    -   Server performs DB writes via Drizzle.
    -   Server returns a result (success/failure) or redirects.

### Directory Structure

-   `src/lib/server/db`: Database schema (`schema.ts`) and connection setup.
-   `src/lib/server/services`: Business logic layer (Posting Engine, Number Series).
-   `src/lib/components`: Reusable UI components.
-   `src/routes/(app)`: Authenticated application routes (Dashboard, Invoices, etc.).
-   `src/routes/(auth)`: Public authentication routes (Login, Register).

---

## Key Dependencies

| Dependency | Purpose |
| :--- | :--- |
| `svelte` | UI Component framework (Version 5+) |
| `@sveltejs/kit` | Application framework (Routing, SSR, API) |
| `drizzle-orm` | Type-safe SQL interaction |
| `better-sqlite3` | SQLite driver for Node.js |
| `tailwindcss` | Utility-first CSS framework |
| `lucia` | Authentication library |
| `zod` | TypeScript-first schema validation |
| `decimal.js` | Arbitrary-precision decimal arithmetic (Critical for finance) |

## Data Flow Example: Creating an Invoice

1.  **User Interaction**: User fills out the form at `/invoices/new`.
2.  **Client**: Svelte component captures input. Local state manages dynamic line items.
3.  **Submission**: User clicks "Save". Form data is sent via POST to `actions.default`.
4.  **Server Action**:
    -   Validates data against Zod schema.
    -   Calls `postInvoiceIssuance` service (Ledger posting).
    -   Inserts record into `invoices` table.
    -   Inserts items into `invoice_items` table.
5.  **Response**: Server redirects to `/invoices/[id]` or returns validation errors.
