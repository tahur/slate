import { z } from 'zod';

// Re-export from customers for consistency
export { INDIAN_STATES, GST_TREATMENTS } from '../../customers/new/schema';

// Vendor-specific GST treatments
export const VENDOR_GST_TREATMENTS = [
    { value: 'registered', label: 'Registered Business' },
    { value: 'unregistered', label: 'Unregistered Business' },
    { value: 'composition', label: 'Composition Scheme' },
    { value: 'overseas', label: 'Overseas Vendor' },
] as const;

// TDS Sections applicable for vendor payments
export const TDS_SECTIONS = [
    { value: '194C', label: '194C - Contractor (1%/2%)' },
    { value: '194J', label: '194J - Professional/Technical (10%)' },
    { value: '194H', label: '194H - Commission (5%)' },
    { value: '194I', label: '194I - Rent (10%)' },
    { value: '194A', label: '194A - Interest (10%)' },
    { value: '194Q', label: '194Q - Purchase of Goods (0.1%)' },
] as const;

// GSTIN format: 2-digit state code + 10-char PAN + 1-char entity + Z + 1-char checksum
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;

const gstinSchema = z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : ''),
    z
        .string()
        .refine(
            (val) => val === '' || GSTIN_REGEX.test(val),
            'Invalid GSTIN format'
        )
);

export const vendorSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    company_name: z.string().optional().or(z.literal('')),
    display_name: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),

    billing_address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state_code: z.string().length(2, 'Select a state').optional().or(z.literal('')),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),

    gstin: gstinSchema,
    gst_treatment: z.enum(['registered', 'unregistered', 'composition', 'overseas']).default('unregistered'),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),

    payment_terms: z.coerce.number().min(0).max(365).default(30),

    // TDS
    tds_applicable: z.preprocess(
        (val) => val === true || val === 'true' || val === '1' || val === 'on',
        z.boolean().default(false)
    ),
    tds_section: z.string().optional().or(z.literal('')),

    notes: z.string().optional().or(z.literal('')),
}).refine((data) => {
    // If GSTIN is provided, validate state code matches
    if (data.gstin && data.state_code) {
        return data.gstin.substring(0, 2) === data.state_code;
    }
    return true;
}, {
    message: 'GSTIN state code must match the selected state',
    path: ['gstin'],
});

export type VendorSchema = typeof vendorSchema;
