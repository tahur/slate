import { db, type Tx } from '../db';
import { journal_entries, journal_lines, accounts } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getNextNumberTx } from './number-series';
import { addCurrency, round2, currencyEquals } from '$lib/utils/currency';
import { runInExistingOrNewTx } from '$lib/server/platform/db/tx';
import { logDomainEvent } from '$lib/server/platform/observability';
import {
    validateNewEntry,
    assertEntryMutable,
    AccountingInvariantError,
    type JournalLineData
} from '../accounting/invariants';

export type PostingType =
    | 'INVOICE_ISSUED'
    | 'INVOICE_CANCELLED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_REVERSED'
    | 'EXPENSE_RECORDED'
    | 'EXPENSE_REVERSED'
    | 'CREDIT_NOTE_ISSUED'
    | 'MANUAL_ENTRY';

interface JournalLineInput {
    accountCode: string;
    debit?: number;
    credit?: number;
    partyType?: 'customer' | 'vendor';
    partyId?: string;
    narration?: string;
}

interface PostingInput {
    type: PostingType;
    date: string;
    referenceId?: string;
    narration: string;
    lines: JournalLineInput[];
    userId?: string;
}

export interface PostingResult {
    journalEntryId: string;
    entryNumber: string;
    lines: {
        accountId: string;
        accountCode: string;
        debit: number;
        credit: number;
    }[];
}

// Map account codes to their IDs for a given org
function getAccountIdsByCode(tx: Tx, orgId: string, codes: string[]): Map<string, string> {
    const result = new Map<string, string>();

    if (codes.length === 0) {
        return result;
    }

    const accountRows = tx
        .select({
            id: accounts.id,
            code: accounts.account_code
        })
        .from(accounts)
        .where(
            and(
                eq(accounts.org_id, orgId),
                inArray(accounts.account_code, codes)
            )
        )
        .all();

    for (const row of accountRows) {
        result.set(row.code, row.id);
    }

    return result;
}

/**
 * Post a journal entry with validation — runs inside a transaction.
 *
 * ⚠️ ACCOUNTING INVARIANTS ENFORCED:
 * - Total debits MUST equal total credits
 * - Each line is debit OR credit, not both
 * - All amounts must be positive
 * - Minimum 2 lines per entry
 *
 * See docs/ACCOUNTING_INVARIANTS.md for details.
 */
function postInTx(
    tx: Tx,
    orgId: string,
    input: PostingInput
): PostingResult {
    // Convert to JournalLineData format for validation
    const lineData: JournalLineData[] = input.lines.map(l => ({
        debit: l.debit || 0,
        credit: l.credit || 0
    }));

    // ⚠️ INVARIANT CHECK: Validate all accounting rules before posting
    validateNewEntry(lineData);

    // Calculate totals using decimal.js for precision
    const debits = input.lines.map(l => l.debit || 0);
    const credits = input.lines.map(l => l.credit || 0);
    const totalDebit = addCurrency(...debits);
    const totalCredit = addCurrency(...credits);

    // Get account IDs
    const codes = input.lines.map(l => l.accountCode);
    const accountMap = getAccountIdsByCode(tx, orgId, codes);

    // Validate all accounts exist
    for (const code of codes) {
        if (!accountMap.has(code)) {
            throw new Error(`Account not found: ${code}`);
        }
    }

    // Generate entry number (transaction-aware so it rolls back on failure)
    const entryNumber = getNextNumberTx(tx, orgId, 'journal');
    const journalEntryId = crypto.randomUUID();

    // Create journal entry
    tx.insert(journal_entries).values({
        id: journalEntryId,
        org_id: orgId,
        entry_number: entryNumber,
        entry_date: input.date,
        reference_type: input.type,
        reference_id: input.referenceId,
        narration: input.narration,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'posted',
        created_by: input.userId
    }).run();

    // Create journal lines and update account balances
    const lineResults: PostingResult['lines'] = [];

    for (const line of input.lines) {
        const accountId = accountMap.get(line.accountCode)!;
        const debit = round2(line.debit || 0);
        const credit = round2(line.credit || 0);

        tx.insert(journal_lines).values({
            id: crypto.randomUUID(),
            journal_entry_id: journalEntryId,
            account_id: accountId,
            debit,
            credit,
            party_type: line.partyType,
            party_id: line.partyId,
            narration: line.narration
        }).run();

        // Update account balance
        const balanceChange = round2(debit - credit);

        tx
            .update(accounts)
            .set({
                balance: sql`ROUND(${accounts.balance} + ${balanceChange}, 2)`
            })
            .where(eq(accounts.id, accountId))
            .run();

        lineResults.push({
            accountId,
            accountCode: line.accountCode,
            debit,
            credit
        });
    }

    logDomainEvent('ledger.entry.posted', {
        orgId,
        postingType: input.type,
        journalEntryId,
        entryNumber,
        referenceId: input.referenceId || null,
        totalDebit,
        totalCredit,
        lineCount: input.lines.length
    });

    return {
        journalEntryId,
        entryNumber,
        lines: lineResults
    };
}

/**
 * Post a journal entry.
 * If a transaction is provided, runs within it. Otherwise wraps in a new transaction.
 */
export function post(
    orgId: string,
    input: PostingInput,
    tx?: Tx
): PostingResult {
    return runInExistingOrNewTx(tx, (t) => postInTx(t, orgId, input));
}

/**
 * Reverse a journal entry (creates an opposite entry)
 *
 * ⚠️ ACCOUNTING INVARIANT: Posted entries are IMMUTABLE
 * This is the ONLY way to "undo" a posted entry - by creating a reversal.
 */
function reverseInTx(
    tx: Tx,
    orgId: string,
    journalEntryId: string,
    reversalDate: string,
    userId?: string
): PostingResult {
    // Get original entry
    const original = tx
        .select()
        .from(journal_entries)
        .where(eq(journal_entries.id, journalEntryId))
        .get();

    if (!original) {
        throw new AccountingInvariantError(
            'ENTRY_EXISTS',
            `Journal entry ${journalEntryId} not found`,
            { journalEntryId }
        );
    }

    if (original.status === 'reversed') {
        throw new AccountingInvariantError(
            'NOT_ALREADY_REVERSED',
            `Journal entry ${journalEntryId} has already been reversed`,
            { journalEntryId, status: original.status }
        );
    }

    // Get original lines
    const originalLines = tx
        .select({
            accountId: journal_lines.account_id,
            debit: journal_lines.debit,
            credit: journal_lines.credit,
            partyType: journal_lines.party_type,
            partyId: journal_lines.party_id,
            narration: journal_lines.narration
        })
        .from(journal_lines)
        .where(eq(journal_lines.journal_entry_id, journalEntryId))
        .all();

    // Get account codes for these IDs
    const accountIds = originalLines.map(l => l.accountId);
    const accountRows = tx
        .select({
            id: accounts.id,
            code: accounts.account_code
        })
        .from(accounts)
        .where(inArray(accounts.id, accountIds))
        .all();

    const idToCode = new Map(accountRows.map(r => [r.id, r.code]));

    // Create reversal lines (swap debit/credit)
    const reversalLines: JournalLineInput[] = originalLines.map(line => ({
        accountCode: idToCode.get(line.accountId)!,
        debit: line.credit || 0,
        credit: line.debit || 0,
        partyType: line.partyType as 'customer' | 'vendor' | undefined,
        partyId: line.partyId || undefined,
        narration: `Reversal: ${line.narration || ''}`
    }));

    // Post reversal in same transaction
    const result = postInTx(tx, orgId, {
        type: (original.reference_type + '_REVERSED') as PostingType,
        date: reversalDate,
        referenceId: original.reference_id || undefined,
        narration: `Reversal of ${original.entry_number}: ${original.narration || ''}`,
        lines: reversalLines,
        userId
    });

    // Mark original as reversed
    tx
        .update(journal_entries)
        .set({
            status: 'reversed',
            reversed_by: result.journalEntryId
        })
        .where(eq(journal_entries.id, journalEntryId))
        .run();

    logDomainEvent('ledger.entry.reversed', {
        orgId,
        originalJournalEntryId: journalEntryId,
        reversalJournalEntryId: result.journalEntryId,
        reversalEntryNumber: result.entryNumber,
        reversalDate
    });

    return result;
}

export function reverse(
    orgId: string,
    journalEntryId: string,
    reversalDate: string,
    userId?: string,
    tx?: Tx
): PostingResult {
    return runInExistingOrNewTx(tx, (t) => reverseInTx(t, orgId, journalEntryId, reversalDate, userId));
}

// ============================================================
// INVOICE POSTING RULES
// ============================================================

interface InvoicePostingInput {
    invoiceId: string;
    invoiceNumber: string;
    date: string;
    customerId: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    userId?: string;
}

/**
 * Post an invoice issuance
 *
 * Debit: Accounts Receivable (1200) - Total amount
 * Credit: Sales Revenue (4000) - Subtotal
 * Credit: Output CGST (2100) - if intra-state
 * Credit: Output SGST (2101) - if intra-state
 * Credit: Output IGST (2102) - if inter-state
 */
export function postInvoiceIssuance(
    orgId: string,
    input: InvoicePostingInput,
    tx?: Tx
): PostingResult {
    const totalTax = addCurrency(input.cgst || 0, input.sgst || 0, input.igst || 0);
    // Revenue should always be net of output taxes, regardless of UI pricing mode.
    // This prevents double-crediting tax when invoice prices include GST.
    const revenueAmount = addCurrency(input.total || 0, -totalTax);

    if (revenueAmount < 0) {
        throw new Error('Invalid invoice amounts: taxable value cannot be negative');
    }

    const lines: JournalLineInput[] = [
        {
            accountCode: '1200',
            debit: input.total,
            partyType: 'customer',
            partyId: input.customerId,
            narration: `Invoice ${input.invoiceNumber}`
        },
        {
            accountCode: '4000',
            credit: revenueAmount,
            narration: `Invoice ${input.invoiceNumber}`
        }
    ];

    if (input.cgst > 0) {
        lines.push({
            accountCode: '2100',
            credit: input.cgst,
            narration: `CGST on Invoice ${input.invoiceNumber}`
        });
    }

    if (input.sgst > 0) {
        lines.push({
            accountCode: '2101',
            credit: input.sgst,
            narration: `SGST on Invoice ${input.invoiceNumber}`
        });
    }

    if (input.igst > 0) {
        lines.push({
            accountCode: '2102',
            credit: input.igst,
            narration: `IGST on Invoice ${input.invoiceNumber}`
        });
    }

    return post(orgId, {
        type: 'INVOICE_ISSUED',
        date: input.date,
        referenceId: input.invoiceId,
        narration: `Invoice issued: ${input.invoiceNumber}`,
        lines,
        userId: input.userId
    }, tx);
}

// ============================================================
// PAYMENT POSTING RULES
// ============================================================

interface PaymentPostingInput {
    paymentId: string;
    paymentNumber: string;
    date: string;
    customerId: string;
    amount: number;
    paymentMode: 'cash' | 'bank' | 'upi';
    userId?: string;
}

/**
 * Post a payment receipt
 *
 * Debit: Cash (1000) or Bank (1100) - Payment amount
 * Credit: Accounts Receivable (1200) - Payment amount
 */
export function postPaymentReceipt(
    orgId: string,
    input: PaymentPostingInput,
    tx?: Tx
): PostingResult {
    const cashAccountCode = input.paymentMode === 'cash' ? '1000' : '1100';

    const lines: JournalLineInput[] = [
        {
            accountCode: cashAccountCode,
            debit: input.amount,
            narration: `Payment ${input.paymentNumber}`
        },
        {
            accountCode: '1200',
            credit: input.amount,
            partyType: 'customer',
            partyId: input.customerId,
            narration: `Payment ${input.paymentNumber}`
        }
    ];

    return post(orgId, {
        type: 'PAYMENT_RECEIVED',
        date: input.date,
        referenceId: input.paymentId,
        narration: `Payment received: ${input.paymentNumber}`,
        lines,
        userId: input.userId
    }, tx);
}

// ============================================================
// EXPENSE POSTING RULES
// ============================================================

interface ExpensePostingInput {
    expenseId: string;
    date: string;
    expenseAccountCode: string;
    amount: number;
    inputCgst: number;
    inputSgst: number;
    inputIgst: number;
    paidThrough: 'cash' | 'bank';
    description: string;
    userId?: string;
}

/**
 * Post an expense
 *
 * Debit: Expense Account - Net amount
 * Debit: Input CGST (1300) - if applicable
 * Debit: Input SGST (1301) - if applicable
 * Debit: Input IGST (1302) - if applicable
 * Credit: Cash (1000) or Bank (1100) - Total paid
 */
export function postExpense(
    orgId: string,
    input: ExpensePostingInput,
    tx?: Tx
): PostingResult {
    const totalPaid = round2(input.amount + input.inputCgst + input.inputSgst + input.inputIgst);
    const cashAccountCode = input.paidThrough === 'cash' ? '1000' : '1100';

    const lines: JournalLineInput[] = [
        {
            accountCode: input.expenseAccountCode,
            debit: input.amount,
            narration: input.description
        }
    ];

    if (input.inputCgst > 0) {
        lines.push({
            accountCode: '1300',
            debit: input.inputCgst,
            narration: `CGST: ${input.description}`
        });
    }

    if (input.inputSgst > 0) {
        lines.push({
            accountCode: '1301',
            debit: input.inputSgst,
            narration: `SGST: ${input.description}`
        });
    }

    if (input.inputIgst > 0) {
        lines.push({
            accountCode: '1302',
            debit: input.inputIgst,
            narration: `IGST: ${input.description}`
        });
    }

    lines.push({
        accountCode: cashAccountCode,
        credit: totalPaid,
        narration: input.description
    });

    return post(orgId, {
        type: 'EXPENSE_RECORDED',
        date: input.date,
        referenceId: input.expenseId,
        narration: input.description,
        lines,
        userId: input.userId
    }, tx);
}

// ============================================================
// CREDIT NOTE POSTING RULES
// ============================================================

interface CreditNotePostingInput {
    creditNoteId: string;
    creditNoteNumber: string;
    date: string;
    customerId: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    userId?: string;
}

/**
 * Post a credit note issuance (reverse of invoice)
 *
 * Debit: Sales Revenue (4000) - Subtotal (reversing revenue)
 * Debit: Output CGST (2100) - if intra-state
 * Debit: Output SGST (2101) - if intra-state
 * Debit: Output IGST (2102) - if inter-state
 * Credit: Accounts Receivable (1200) - Total (reducing customer balance)
 */
export function postCreditNote(
    orgId: string,
    input: CreditNotePostingInput,
    tx?: Tx
): PostingResult {
    const lines: JournalLineInput[] = [
        {
            accountCode: '4000',
            debit: input.subtotal,
            narration: `Credit Note ${input.creditNoteNumber}`
        }
    ];

    if (input.cgst > 0) {
        lines.push({
            accountCode: '2100',
            debit: input.cgst,
            narration: `CGST reversal on Credit Note ${input.creditNoteNumber}`
        });
    }

    if (input.sgst > 0) {
        lines.push({
            accountCode: '2101',
            debit: input.sgst,
            narration: `SGST reversal on Credit Note ${input.creditNoteNumber}`
        });
    }

    if (input.igst > 0) {
        lines.push({
            accountCode: '2102',
            debit: input.igst,
            narration: `IGST reversal on Credit Note ${input.creditNoteNumber}`
        });
    }

    lines.push({
        accountCode: '1200',
        credit: input.total,
        partyType: 'customer',
        partyId: input.customerId,
        narration: `Credit Note ${input.creditNoteNumber}`
    });

    return post(orgId, {
        type: 'CREDIT_NOTE_ISSUED',
        date: input.date,
        referenceId: input.creditNoteId,
        narration: `Credit Note issued: ${input.creditNoteNumber}`,
        lines,
        userId: input.userId
    }, tx);
}
