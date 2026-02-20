import { z } from 'zod';

/** Common unit suggestions — users can also type their own. */
export const UNIT_SUGGESTIONS = ['nos', 'pcs', 'box', 'kg', 'gm', 'litre', 'ml', 'hrs', 'days', 'sqft', 'meter'] as const;

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const itemSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    type: z.enum(['product', 'service']).default('product'),
    sku: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    hsn_code: z.string().optional().or(z.literal(''))
        .refine(val => !val || /^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(val), 'HSN/SAC code must be 2, 4, 6, or 8 digits'),
    rate: z.coerce.number().min(0, 'Rate must be 0 or more').default(0),
    unit: z.string().min(1, 'Unit is required').default('nos'),
    min_quantity: z.coerce.number().min(0, 'Min quantity must be 0 or more').default(1),
    gst_rate: z.coerce.number().default(18),
});

export type ItemSchema = typeof itemSchema;
