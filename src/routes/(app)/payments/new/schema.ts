import { z } from 'zod';

export const paymentSchema = z.object({
    customer_id: z.string().min(1, 'Customer is required'),
    payment_date: z.string().min(1, 'Payment date is required'),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    payment_mode: z.enum(['cash', 'bank', 'upi', 'cheque']),
    reference: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    allocations: z.array(z.object({
        invoice_id: z.string(),
        amount: z.coerce.number().min(0)
    })).optional().default([])
});

export type PaymentSchema = typeof paymentSchema;
