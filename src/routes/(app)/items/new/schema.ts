import { z } from 'zod';

export const UNITS = ['nos', 'pcs', 'box', 'kg', 'gm', 'litre', 'ml', 'hrs', 'days', 'sqft', 'meter'] as const;

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const itemSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(['product', 'service']).default('product'),
    sku: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    hsn_code: z.string().optional().or(z.literal('')),
    rate: z.coerce.number().min(0, 'Rate must be 0 or more').default(0),
    unit: z.string().default('nos'),
    gst_rate: z.coerce.number().default(18),
});

export type ItemSchema = typeof itemSchema;
