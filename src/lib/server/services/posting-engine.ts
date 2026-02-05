import { db } from '../db';
import { journal_entries, journal_lines, accounts } from '../db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getNextNumber } from './number-series';
import { addCurrency, round2, currencyEquals } from '$lib/utils/currency';
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

interface PostingResult {
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
async function getAccountIdsByCode(orgId: string, codes: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    if (codes.length === 0) {
        return result;
    }

    const accountRows = await db
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
        );

    for (const row of accountRows) {
        result.set(row.code, row.id);
    }

    return result;
}

/**
 * Post a journal entry with validation
 *
 * ⚠️ ACCOUNTING INVARIANTS ENFORCED:
 * - Total debits MUST equal total credits
 * - Each line is debit OR credit, not both
 * - All amounts must be positive
 * - Minimum 2 lines per entry
 *
 * See docs/ACCOUNTING_INVARIANTS.md for details.
 */
export async function post(
    orgId: string,
    input: PostingInput
): Promise<PostingResult> {
    // Convert to JournalLineData format for validation
    const lineData: JournalLineData[] = input.lines.map(l => ({
        debit: l.debit || 0,
        credit: l.credit || 0
    }));

    // ⚠️ INVARIANT CHECK: Validate all accounting rules before posting
    // This will throw AccountingInvariantError if any rule is violated
    validateNewEntry(lineData);

    // Calculate totals using decimal.js for precision
    const debits = input.lines.map(l => l.debit || 0);
    const credits = input.lines.map(l => l.credit || 0);
    const totalDebit = addCurrency(...debits);
    const totalCredit = addCurrency(...credits);

    // Get account IDs
    const codes = input.lines.map(l => l.accountCode);
    const accountMap = await getAccountIdsByCode(orgId, codes);

    // Validate all accounts exist
    for (const code of codes) {
        if (!accountMap.has(code)) {
            throw new Error(`Account not found: ${code}`);
        }
    }

    // Generate entry number
    const entryNumber = await getNextNumber(orgId, 'journal');
    const journalEntryId = crypto.randomUUID();

    // Create journal entry
    await db.insert(journal_entries).values({
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
    });

    // Create journal lines and update account balances
    const lineResults: PostingResult['lines'] = [];

    for (const line of input.lines) {
        const accountId = accountMap.get(line.accountCode)!;
        const debit = round2(line.debit || 0);
        const credit = round2(line.credit || 0);

        await db.insert(journal_lines).values({
            id: crypto.randomUUID(),
            journal_entry_id: journalEntryId,
            account_id: accountId,
            debit,
            credit,
            party_type: line.partyType,
            party_id: line.partyId,
            narration: line.narration
        });

        // Update account balance
        // Assets/Expenses: Debit increases, Credit decreases
        // Liabilities/Equity/Income: Credit increases, Debit decreases
        const balanceChange = round2(debit - credit);

        await db
            .update(accounts)
            .set({
                balance: sql`ROUND(${accounts.balance} + ${balanceChange}, 2)`
            })
            .where(eq(accounts.id, accountId));

        lineResults.push({
            accountId,
            accountCode: line.accountCode,
            debit,
            credit
        });
    }

    return {
        journalEntryId,
        entryNumber,
        lines: lineResults
    };
}

/**
 * Reverse a journal entry (creates an opposite entry)
 *
 * ⚠️ ACCOUNTING INVARIANT: Posted entries are IMMUTABLE
 * This is the ONLY way to "undo" a posted entry - by creating a reversal.
 */
export async function reverse(
    orgId: string,
    journalEntryId: string,
    reversalDate: string,
    userId?: string
): Promise<PostingResult> {
    // Get original entry
    const original = await db
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
    const originalLines = await db
        .select({
            accountId: journal_lines.account_id,
            debit: journal_lines.debit,
            credit: journal_lines.credit,
            partyType: journal_lines.party_type,
            partyId: journal_lines.party_id,
            narration: journal_lines.narration
        })
        .from(journal_lines)
        .leftJoin(accounts, eq(journal_lines.account_id, accounts.id))
        .where(eq(journal_lines.journal_entry_id, journalEntryId));

    // Get account codes for these IDs
    const accountIds = originalLines.map(l => l.accountId);
    const accountRows = await db
        .select({
            id: accounts.id,
            code: accounts.account_code
        })
        .from(accounts)
        .where(sql`${accounts.id} IN (${accountIds.map(id => `'${id}'`).join(',')})`);

    const idToCode = new Map(accountRows.map(r => [r.id, r.code]));

    // Create reversal lines (swap debit/credit)
    const reversalLines: JournalLineInput[] = originalLines.map(line => ({
        accountCode: idToCode.get(line.accountId)!,
        debit: line.credit || 0,  // Swap
        credit: line.debit || 0,  // Swap
        partyType: line.partyType as 'customer' | 'vendor' | undefined,
        partyId: line.partyId || undefined,
        narration: `Reversal: ${line.narration || ''}`
    }));

    // Post reversal
    const result = await post(orgId, {
        type: (original.reference_type + '_REVERSED') as PostingType,
        date: reversalDate,
        referenceId: original.reference_id || undefined,
        narration: `Reversal of ${original.entry_number}: ${original.narration || ''}`,
        lines: reversalLines,
        userId
    });

    // Mark original as reversed
    await db
        .update(journal_entries)
        .set({
            status: 'reversed',
            reversed_by: result.journalEntryId
        })
        .where(eq(journal_entries.id, journalEntryId));

    return result;
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
export async function postInvoiceIssuance(
    orgId: string,
    input: InvoicePostingInput
): Promise<PostingResult> {
    const lines: JournalLineInput[] = [
        // Debit AR for total
        {
            accountCode: '1200', // Accounts Receivable
            debit: input.total,
            partyType: 'customer',
            partyId: input.customerId,
            narration: `Invoice ${input.invoiceNumber}`
        },
        // Credit Sales
        {
            accountCode: '4000', // Sales Revenue
            credit: input.subtotal,
            narration: `Invoice ${input.invoiceNumber}`
        }
    ];

    // Add GST credits
    if (input.cgst > 0) {
        lines.push({
            accountCode: '2100', // Output CGST
            credit: input.cgst,
            narration: `CGST on Invoice ${input.invoiceNumber}`
        });
    }

    if (input.sgst > 0) {
        lines.push({
            accountCode: '2101', // Output SGST
            credit: input.sgst,
            narration: `SGST on Invoice ${input.invoiceNumber}`
        });
    }

    if (input.igst > 0) {
        lines.push({
            accountCode: '2102', // Output IGST
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
    });
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
export async function postPaymentReceipt(
    orgId: string,
    input: PaymentPostingInput
): Promise<PostingResult> {
    const cashAccountCode = input.paymentMode === 'cash' ? '1000' : '1100';

    const lines: JournalLineInput[] = [
        // Debit Cash/Bank
        {
            accountCode: cashAccountCode,
            debit: input.amount,
            narration: `Payment ${input.paymentNumber}`
        },
        // Credit AR
        {
            accountCode: '1200', // Accounts Receivable
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
    });
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
export async function postExpense(
    orgId: string,
    input: ExpensePostingInput
): Promise<PostingResult> {
    const totalPaid = input.amount + input.inputCgst + input.inputSgst + input.inputIgst;
    const cashAccountCode = input.paidThrough === 'cash' ? '1000' : '1100';

    const lines: JournalLineInput[] = [
        // Debit expense account
        {
            accountCode: input.expenseAccountCode,
            debit: input.amount,
            narration: input.description
        }
    ];

    // Add input GST debits
    if (input.inputCgst > 0) {
        lines.push({
            accountCode: '1300', // Input CGST
            debit: input.inputCgst,
            narration: `CGST: ${input.description}`
        });
    }

    if (input.inputSgst > 0) {
        lines.push({
            accountCode: '1301', // Input SGST
            debit: input.inputSgst,
            narration: `SGST: ${input.description}`
        });
    }

    if (input.inputIgst > 0) {
        lines.push({
            accountCode: '1302', // Input IGST
            debit: input.inputIgst,
            narration: `IGST: ${input.description}`
        });
    }

    // Credit cash/bank
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
    });
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
 * Debit: Output CGST (2100) - if intra-state (reversing tax liability)
 * Debit: Output SGST (2101) - if intra-state (reversing tax liability)
 * Debit: Output IGST (2102) - if inter-state (reversing tax liability)
 * Credit: Accounts Receivable (1200) - Total (reducing customer balance)
 */
export async function postCreditNote(
    orgId: string,
    input: CreditNotePostingInput
): Promise<PostingResult> {
    const lines: JournalLineInput[] = [
        // Debit Sales (reversing revenue)
        {
            accountCode: '4000', // Sales Revenue
            debit: input.subtotal,
            narration: `Credit Note ${input.creditNoteNumber}`
        }
    ];

    // Add GST debits (reversing tax liability)
    if (input.cgst > 0) {
        lines.push({
            accountCode: '2100', // Output CGST
            debit: input.cgst,
            narration: `CGST reversal on Credit Note ${input.creditNoteNumber}`
        });
    }

    if (input.sgst > 0) {
        lines.push({
            accountCode: '2101', // Output SGST
            debit: input.sgst,
            narration: `SGST reversal on Credit Note ${input.creditNoteNumber}`
        });
    }

    if (input.igst > 0) {
        lines.push({
            accountCode: '2102', // Output IGST
            debit: input.igst,
            narration: `IGST reversal on Credit Note ${input.creditNoteNumber}`
        });
    }

    // Credit AR (reducing customer balance)
    lines.push({
        accountCode: '1200', // Accounts Receivable
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
    });
}
