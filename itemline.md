# Product/Service Master & Line Item Enhancement

## Current State

### What Already Exists

#### `invoice_items` Table (`src/lib/server/db/schema/invoices.ts:89-116`)

Line items are already fully functional with these fields:

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | UUID |
| `invoice_id` | text (FK) | Cascade delete on parent invoice |
| `description` | text | Free-text item description |
| `hsn_code` | text | HSN/SAC code for GST |
| `quantity` | real | Default: 1 |
| `unit` | text | Default: 'nos' |
| `rate` | real | Per-unit price |
| `gst_rate` | real | One of 0, 5, 12, 18, 28 |
| `cgst` | real | Central GST amount |
| `sgst` | real | State GST amount |
| `igst` | real | Integrated GST amount |
| `amount` | real | qty * rate |
| `total` | real | amount + gst |
| `sort_order` | integer | Drag-and-drop ordering |

#### Invoice Creation Form (`src/routes/(app)/invoices/new/+page.svelte`)

- ~790 lines, fully functional
- Add/remove multiple line items dynamically
- Drag-and-drop reordering via `sort_order`
- Per-item GST rate dropdown (0, 5, 12, 18, 28%)
- Auto CGST/SGST vs IGST based on customer state vs org state
- Two save modes: "Issue Invoice" (status=issued) or "Save Draft" (status=draft)

#### Invoice Creation Server (`src/routes/(app)/invoices/new/+page.server.ts`)

- ~307 lines
- Idempotency check to prevent duplicate submissions
- Parses line items from form data (`items[0].description`, `items[0].quantity`, etc.)
- Calls `calculateInvoiceTotals(items, isInterState)` for tax math
- Inserts invoice row, then bulk-inserts `invoice_items` rows
- Posts journal entry on issuance
- Updates customer balance on issuance

#### Validation Schema (`src/routes/(app)/invoices/new/schema.ts`)

```typescript
const GST_RATES = [0, 5, 12, 18, 28] as const;

const lineItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    hsn_code: z.string().optional().default(''),
    quantity: z.coerce.number().min(0.01).default(1),
    unit: z.string().default('nos'),
    rate: z.coerce.number().min(0).default(0),
    gst_rate: z.coerce.number().default(18),
});
```

Tax calculation helpers:
- `calculateLineItem(item, isInterState)` — per-line tax breakdown
- `calculateInvoiceTotals(items, isInterState)` — aggregate across all items

### What Does NOT Exist

- No `products` or `services` master table
- No product/service CRUD pages
- No autocomplete/search in invoice line items
- No reusable item templates
- No inventory or stock tracking
- Not mentioned anywhere in ROADMAP.md (10 phases, 31 checkpoints — none cover this)

### Current Pain Point

Every time a user creates an invoice, they must manually type the description, HSN code, unit, rate, and GST rate for each line item — even if they sell the same products/services repeatedly. There is no way to save or reuse items.

---

## Feature Plan: Product/Service Master

### Goal

Allow users to create a catalog of products and services. When adding line items to an invoice, they can search and select from this catalog to auto-fill description, HSN code, unit, rate, and GST rate — while still allowing manual/custom entries.

### Database Schema

#### New Table: `products`

File: `src/lib/server/db/schema/products.ts`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | text (PK) | nanoid | Unique identifier |
| `org_id` | text (FK) | required | Links to organization |
| `name` | text | required | Display name (e.g., "Web Development", "Laptop Stand") |
| `description` | text | '' | Detailed description (used in invoice line item) |
| `type` | text | 'service' | `product` or `service` |
| `hsn_code` | text | '' | HSN code (products) or SAC code (services) |
| `unit` | text | 'nos' | Default unit (nos, hrs, kg, pcs, etc.) |
| `rate` | real | 0 | Default selling price |
| `gst_rate` | real | 18 | Default GST rate (0, 5, 12, 18, 28) |
| `is_active` | integer | 1 | Soft delete / hide from selection |
| `created_at` | text | now | Timestamp |
| `updated_at` | text | now | Timestamp |
| `created_by` | text | null | User ID |
| `updated_by` | text | null | User ID |

Indexes:
- `org_id` — filter by organization
- `org_id + is_active` — active products for dropdown
- `org_id + name` — unique constraint per org

#### Updated Table: `invoice_items`

Add one optional column:

| Column | Type | Description |
|--------|------|-------------|
| `product_id` | text (FK, nullable) | Links back to product master. Null if custom/manual entry. |

This is a soft reference — the line item still stores its own description, rate, etc. as a snapshot at invoice time. Changing a product's price later does NOT affect past invoices.

### File Changes

#### New Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/server/db/schema/products.ts` | Drizzle schema for `products` table |
| 2 | `src/routes/(app)/products/+page.svelte` | Product list page with search, filter, add/edit |
| 3 | `src/routes/(app)/products/+page.server.ts` | Load products, handle delete |
| 4 | `src/routes/(app)/products/new/+page.svelte` | Create product form |
| 5 | `src/routes/(app)/products/new/+page.server.ts` | Insert product action |
| 6 | `src/routes/(app)/products/new/schema.ts` | Zod validation for product form |
| 7 | `src/routes/(app)/products/[id]/+page.svelte` | Edit product form |
| 8 | `src/routes/(app)/products/[id]/+page.server.ts` | Load single product, update action |
| 9 | `src/routes/api/products/search/+server.ts` | API endpoint for autocomplete search (used by invoice form) |

#### Existing Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/server/db/schema/index.ts` | Export new `products` schema |
| 2 | `src/lib/server/db/schema/invoices.ts` | Add optional `product_id` FK to `invoice_items` |
| 3 | `src/routes/(app)/invoices/new/+page.svelte` | Add product search/autocomplete to line items |
| 4 | `src/routes/(app)/invoices/new/+page.server.ts` | Pass products list or setup API call, save `product_id` |
| 5 | `src/routes/(app)/invoices/[id]/+page.svelte` | Show product name if linked |
| 6 | `src/lib/components/layout/sidebar.svelte` | Add "Products" nav link |
| 7 | Migration SQL | New table DDL + alter `invoice_items` |

### Implementation Phases

#### Phase 1: Schema & Migration

1. Create `src/lib/server/db/schema/products.ts` with Drizzle table definition
2. Export from `src/lib/server/db/schema/index.ts`
3. Add `product_id` column to `invoice_items` in schema
4. Run `drizzle-kit generate` and `drizzle-kit push` for migration

#### Phase 2: Product CRUD

1. Create product list page with:
   - Table view (name, type, HSN, rate, GST rate, status)
   - Search by name/HSN
   - Filter by type (product/service) and status (active/inactive)
   - "New Product" button
2. Create product form (shared between new and edit) with:
   - Name (required)
   - Type toggle: Product / Service
   - Description
   - HSN/SAC code
   - Unit dropdown (nos, hrs, kg, pcs, ltrs, mtrs, sqft, box, set)
   - Default rate
   - GST rate dropdown (0, 5, 12, 18, 28)
3. Edit page — same form, pre-filled
4. Soft delete (toggle `is_active`)
5. Add "Products & Services" link in sidebar

#### Phase 3: Invoice Integration

1. Create `/api/products/search` endpoint:
   - Accepts `?q=searchterm`
   - Returns matching active products (name, description, hsn, unit, rate, gst_rate)
   - Limit 10 results
2. Update invoice line item row in `invoices/new/+page.svelte`:
   - Add a search input above or replacing the description field
   - On product select: auto-fill description, hsn_code, unit, rate, gst_rate
   - Allow override of any auto-filled value (snapshot behavior)
   - "Custom item" option to skip product selection and type freely (current behavior)
   - Save `product_id` in the line item if a product was selected
3. Update `invoices/new/+page.server.ts`:
   - Accept and store `product_id` per line item

#### Phase 4: Polish

1. Show product link in invoice detail view
2. Frequently used products shown first in search
3. Quick-add product from invoice form (modal) without leaving the page

### UI/UX for Invoice Line Item (Phase 3 Detail)

Current line item row:
```
[ Description ] [ HSN ] [ Qty ] [ Unit ] [ Rate ] [ GST% ] [ Amount ]
```

Enhanced line item row:
```
[ Product Search (typeahead) ................ ] [ x clear ]
[ Description ] [ HSN ] [ Qty ] [ Unit ] [ Rate ] [ GST% ] [ Amount ]
```

Behavior:
- User starts typing in "Product Search" — shows dropdown with matching products
- Selecting a product fills all fields below
- User can modify any filled field (acts as a starting point)
- User can skip product search entirely and type description manually
- A "Custom Item" option always appears in dropdown for manual entry
- If product is selected, a subtle chip/tag shows the product name for reference

### API: Product Search Endpoint

```
GET /api/products/search?q=web+dev
```

Response:
```json
{
  "products": [
    {
      "id": "prod_abc123",
      "name": "Web Development",
      "description": "Website development and maintenance",
      "type": "service",
      "hsn_code": "998314",
      "unit": "hrs",
      "rate": 2500,
      "gst_rate": 18
    }
  ]
}
```

### Patterns to Follow (from existing codebase)

- **Schema style**: Follow `src/lib/server/db/schema/customers.ts` pattern — same org_id FK, audit columns, nanoid for PK
- **Page structure**: Follow `src/routes/(app)/customers/` pattern — list page, new page, [id] detail/edit page
- **Form validation**: Use Zod schemas like `src/routes/(app)/invoices/new/schema.ts`
- **Server actions**: Follow SvelteKit form actions pattern used in invoice creation
- **Sidebar nav**: Follow existing pattern in `src/lib/components/layout/sidebar.svelte`
- **Toast notifications**: Use existing `toast` store from `src/lib/stores/toast.ts`
- **ID generation**: Use `nanoid` with prefix pattern (check existing usage)

### Estimated Scope

| Area | Files | Effort |
|------|-------|--------|
| Schema + migration | 2-3 | Small |
| Product CRUD (list, new, edit) | 6-7 | Medium |
| Search API endpoint | 1 | Small |
| Invoice form integration | 2-3 | Medium |
| Sidebar + polish | 2 | Small |
| **Total** | **~14 files** | **Medium** |

### Dependencies

- No external packages needed — uses existing Drizzle ORM, Zod, SvelteKit
- No breaking changes to existing invoices — `product_id` is nullable
- Backward compatible — old invoices with no product link continue working
- No impact on GST calculations — tax logic stays in `schema.ts` helpers

### Edge Cases to Handle

1. **Deleted product on existing invoice**: `product_id` references a soft-deleted product — show name but mark as "(discontinued)"
2. **Price changes**: Changing a product's rate does NOT update past invoices — line item stores snapshot
3. **Duplicate names**: Allow same name in different orgs, prevent within same org
4. **Empty catalog**: Invoice form works exactly as today if no products exist — no regression
5. **HSN code format**: Validate 4-8 digit numeric HSN codes
6. **Bulk import**: Out of scope for now, can be Phase 5 (CSV import of product catalog)
