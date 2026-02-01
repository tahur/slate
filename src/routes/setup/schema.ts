import { z } from 'zod';

export const setupSchema = z.object({
    name: z.string().min(2, 'Business name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
    address: z.string().min(5, 'Address is required'),
    // city: z.string().min(2, 'City is required'), // Simplified for now
    state_code: z.string().length(2, 'State code must be 2 digits'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
    gstin: z
        .string()
        .regex(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
            'Invalid GSTIN format'
        )
        .optional()
        .or(z.literal('')),
    fy_start_month: z.coerce.number().min(1).max(12).default(4)
});

export type SetupSchema = typeof setupSchema;
