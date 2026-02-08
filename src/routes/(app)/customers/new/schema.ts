import { z } from 'zod';

// Indian state codes mapping
export const INDIAN_STATES = [
    { code: '01', name: 'Jammu & Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman & Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' },
] as const;

export const GST_TREATMENTS = [
    { value: 'registered', label: 'Registered Business' },
    { value: 'unregistered', label: 'Unregistered Business' },
    { value: 'consumer', label: 'Consumer' },
    { value: 'overseas', label: 'Overseas' },
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

export const customerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    company_name: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),

    billing_address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state_code: z.string().length(2, 'Select a state').optional().or(z.literal('')),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),

    gstin: gstinSchema,
    gst_treatment: z.enum(['registered', 'unregistered', 'consumer', 'overseas']).default('unregistered'),

    payment_terms: z.coerce.number().min(0).max(365).default(0),
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

export type CustomerSchema = typeof customerSchema;
