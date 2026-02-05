# Accounting Invariants

> **For Contributors**: This document defines the fundamental rules that MUST hold true for the accounting system. Breaking these rules will corrupt financial data.

## What is an Invariant?

An invariant is a condition that must **always** be true. In accounting software, invariants protect the integrity of financial data. They are not optional rules—they are mathematical truths that, if violated, render the books meaningless.

## The Invariants

### 1. Balanced Entries (The Golden Rule)

```
Total Debits = Total Credits
```

**Every** journal entry must balance. This is the foundation of double-entry bookkeeping.

```typescript
// ✅ Valid: Debits = Credits
[
  { account: 'Cash', debit: 1000, credit: 0 },
  { account: 'Sales', debit: 0, credit: 1000 }
]

// ❌ Invalid: Debits ≠ Credits
[
  { account: 'Cash', debit: 1000, credit: 0 },
  { account: 'Sales', debit: 0, credit: 900 }
]
```

**Why it matters**: If entries don't balance, your Balance Sheet won't balance, and the books are corrupted.

---

### 2. Single-Sided Lines

```
Each line is EITHER a debit OR a credit, never both
```

A single journal line cannot have both a debit and a credit amount.

```typescript
// ✅ Valid
{ account: 'Cash', debit: 1000, credit: 0 }
{ account: 'Sales', debit: 0, credit: 1000 }

// ❌ Invalid: Both debit and credit on same line
{ account: 'Cash', debit: 1000, credit: 500 }
```

**Why it matters**: This prevents ambiguous entries and makes audit trails clear.

---

### 3. Positive Amounts

```
Debit >= 0 AND Credit >= 0
```

All amounts must be zero or positive. To record a "negative" effect, use the opposite side (e.g., instead of negative debit, use a credit).

```typescript
// ✅ Valid: To reduce cash, credit it
{ account: 'Cash', debit: 0, credit: 1000 }

// ❌ Invalid: Negative amounts
{ account: 'Cash', debit: -1000, credit: 0 }
```

**Why it matters**: Negative numbers create confusion and reporting errors.

---

### 4. Immutable Posted Entries

```
Posted entries CANNOT be modified
```

Once a journal entry is posted, it is permanent. The only way to "change" it is to create a reversal entry.

```typescript
// ❌ NEVER do this
await db.update(journal_entries)
  .set({ total_debit: 2000 })
  .where(eq(id, 'posted-entry-id'));

// ✅ Do this instead
await reverse(orgId, 'posted-entry-id', today);
await post(orgId, { /* new corrected entry */ });
```

**Why it matters**: Audit trails require immutability. Regulators and auditors expect to see all entries, including mistakes and their corrections.

---

### 5. Minimum Two Lines

```
Every entry has >= 2 lines
```

Double-entry bookkeeping requires at least two lines per entry.

```typescript
// ❌ Invalid: Only one line
[{ account: 'Cash', debit: 1000, credit: 0 }]

// ✅ Valid: Two or more lines
[
  { account: 'Cash', debit: 1000, credit: 0 },
  { account: 'Sales', debit: 0, credit: 1000 }
]
```

---

### 6. Totals Match Lines

```
journal_entries.total_debit = SUM(journal_lines.debit)
journal_entries.total_credit = SUM(journal_lines.credit)
```

The stored totals on the journal entry must match the actual sum of its lines.

**Why it matters**: Denormalized totals are useful for performance, but they must stay in sync with the source data.

---

### 7. Number Series Never Skip

```
Number series are sequential with no gaps
```

Invoice numbers, payment numbers, and journal entry numbers must be sequential within a fiscal year. Gaps indicate deleted records, which is a red flag for auditors.

```
✅ Valid: INV-2026-0001, INV-2026-0002, INV-2026-0003
❌ Invalid: INV-2026-0001, INV-2026-0003 (gap!)
```

**Why it matters**: Tax authorities require sequential numbering for audit trails.

---

## Enforcement Layers

Invariants are enforced at multiple levels:

### 1. Application Code (First Line)
```typescript
import { validateNewEntry } from '$lib/server/accounting/invariants';

// Before posting
validateNewEntry(lines); // Throws if invalid
await post(orgId, entry);
```

### 2. Database Constraints (Last Line)
```sql
-- These constraints are the final safety net
CHECK (debit >= 0)
CHECK (credit >= 0)
CHECK (NOT (debit > 0 AND credit > 0))
```

### 3. Periodic Integrity Checks
```typescript
// Run periodically or after migrations
const result = await verifyAllEntriesBalanced(orgId);
if (!result.valid) {
  console.error('DATA CORRUPTION DETECTED', result.errors);
}
```

---

## For Contributors

### ⚠️ Before Modifying Accounting Code

1. **Read this document** completely
2. **Understand the invariant** you might affect
3. **Write tests** that verify the invariant holds
4. **Never bypass** invariant checks "for convenience"

### Warning Signs (Code Smells)

```typescript
// 🚨 RED FLAG: Direct update of posted entry
db.update(journal_entries).set({ ... })

// 🚨 RED FLAG: Deleting journal entries
db.delete(journal_entries).where(...)

// 🚨 RED FLAG: Skipping validation
// "I'll add validation later" — No, add it now.
```

### Safe Patterns

```typescript
// ✅ SAFE: Validate before posting
validateNewEntry(lines);
const result = await post(orgId, entry);

// ✅ SAFE: Reverse instead of modify
await reverse(orgId, entryId, today);
await post(orgId, correctedEntry);

// ✅ SAFE: Cancel instead of delete
await db.update(invoices).set({ status: 'cancelled' });
```

---

## Testing Invariants

Every invariant should have tests. The test suite should answer:

> "If these tests pass, is the money safe?"

```typescript
describe('Accounting Invariants', () => {
  it('rejects unbalanced entries', () => {
    expect(() => validateNewEntry([
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 900 } // Unbalanced!
    ])).toThrow('BALANCED_ENTRY');
  });

  it('rejects entries with both debit and credit', () => {
    expect(() => validateNewEntry([
      { debit: 1000, credit: 500 }, // Invalid!
      { debit: 0, credit: 500 }
    ])).toThrow('SINGLE_SIDED_ENTRY');
  });

  // ... more tests
});
```

---

## Summary Table

| Invariant | Rule | DB Constraint | Code Check |
|-----------|------|---------------|------------|
| Balanced | Dr = Cr | ❌ (checked at insert) | `assertBalanced()` |
| Single-sided | Dr OR Cr, not both | `CHECK (NOT (debit > 0 AND credit > 0))` | `assertValidLine()` |
| Positive | Dr >= 0, Cr >= 0 | `CHECK (debit >= 0)`, `CHECK (credit >= 0)` | `assertValidLine()` |
| Immutable | No updates to posted | ❌ (app-level) | `assertEntryMutable()` |
| Min 2 lines | >= 2 lines per entry | ❌ (app-level) | `assertMinimumLines()` |
| Totals match | Stored = calculated | ❌ (checked at insert) | `assertTotalsMatch()` |

---

## Questions?

If you're unsure whether a change might violate an invariant, **ask first**. It's better to discuss than to ship corrupted accounting data.
