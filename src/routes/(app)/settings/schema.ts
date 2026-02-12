import { z } from 'zod';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const orgSettingsSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state_code: z.string().length(2, 'Select a state'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
    gstin: z
        .string()
        .optional()
        .or(z.literal(''))
        .transform((val) => val?.trim().toUpperCase() || '')
        .refine(
            (val) => val === '' || GSTIN_REGEX.test(val),
            'Invalid GSTIN format'
        ),
    pan: z.string().optional().or(z.literal('')),
    currency: z.string().min(3).max(3).default('INR'),
    fy_start_month: z.coerce.number().min(1).max(12).default(4),

    // Bank Details
    bank_name: z.string().optional().or(z.literal('')),
    branch: z.string().optional().or(z.literal('')),
    account_number: z.string().optional().or(z.literal('')),
    ifsc: z.string().optional().or(z.literal('')),
    upi_id: z.string().optional().or(z.literal('')),

    // Defaults & Logo & Signature
    logo_url: z.string().optional().or(z.literal('')),
    signature_url: z.string().optional().or(z.literal('')),
    invoice_notes_default: z.string().optional().or(z.literal('')),
    invoice_terms_default: z.string().optional().or(z.literal('')),
    prices_include_gst: z.boolean().default(false)
}).refine(
    (data) => {
        if (data.gstin && data.state_code) {
            return data.gstin.substring(0, 2) === data.state_code;
        }
        return true;
    },
    {
        message: 'GSTIN state code must match the selected state',
        path: ['gstin']
    }
);

export const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email')
});

export const numberSeriesSchema = z.object({
    invoice_prefix: z.string().min(2).max(6),
    payment_prefix: z.string().min(2).max(6),
    expense_prefix: z.string().min(2).max(6),
    credit_note_prefix: z.string().min(2).max(6),
    journal_prefix: z.string().min(2).max(6)
});

export const smtpSettingsSchema = z.object({
    smtp_host: z.string().min(1, 'SMTP host is required'),
    smtp_port: z.coerce.number().min(1).max(65535).default(587),
    smtp_user: z.string().min(1, 'SMTP username is required'),
    smtp_pass: z.string().min(1, 'SMTP password is required'),
    smtp_from: z.string().email('Invalid from address').optional().or(z.literal('')),
    smtp_secure: z.boolean().default(false)
});

export type OrgSettingsSchema = typeof orgSettingsSchema;
export type ProfileSchema = typeof profileSchema;
export type NumberSeriesSchema = typeof numberSeriesSchema;
export type SmtpSettingsSchema = typeof smtpSettingsSchema;
