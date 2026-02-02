import { z } from 'zod';

export const expenseSchema = z.object({
    expense_date: z.string().min(1, 'Date is required'),
    category: z.string().min(1, 'Category is required'),
    vendor: z.string().optional().default(''),
    description: z.string().optional().default(''),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    gst_rate: z.coerce.number().min(0).max(28).default(0),
    is_inter_state: z.boolean().optional().default(false),
    paid_through: z.string().min(1, 'Payment account is required'),
    reference: z.string().optional().default('')
});

export type ExpenseSchema = typeof expenseSchema;
