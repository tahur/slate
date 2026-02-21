import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP
});

/**
 * Round to 2 decimal places for currency
 */
export function round2(value: number | string | Decimal): number {
    return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Add multiple currency values with precision
 */
export function addCurrency(...values: (number | string)[]): number {
    const result = values.reduce(
        (sum, val) => sum.plus(new Decimal(val || 0)),
        new Decimal(0)
    );
    return round2(result);
}

/**
 * Subtract currency values with precision
 */
export function subtractCurrency(a: number | string, b: number | string): number {
    return round2(new Decimal(a || 0).minus(new Decimal(b || 0)));
}

/**
 * Multiply currency values with precision
 */
export function multiplyCurrency(a: number | string, b: number | string): number {
    return round2(new Decimal(a || 0).times(new Decimal(b || 0)));
}

/**
 * Divide currency values with precision
 */
export function divideCurrency(a: number | string, b: number | string): number {
    if (new Decimal(b || 0).isZero()) return 0;
    return round2(new Decimal(a || 0).dividedBy(new Decimal(b)));
}

/**
 * Calculate GST breakdown from subtotal and rate
 */
export function calculateGST(
    subtotal: number,
    gstRate: number,
    isInterState: boolean
): {
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
} {
    const sub = new Decimal(subtotal || 0);
    const rate = new Decimal(gstRate || 0).dividedBy(100);
    const totalTax = sub.times(rate);

    if (isInterState) {
        return {
            subtotal: round2(sub),
            cgst: 0,
            sgst: 0,
            igst: round2(totalTax),
            total: round2(sub.plus(totalTax))
        };
    } else {
        const halfTax = totalTax.dividedBy(2);
        return {
            subtotal: round2(sub),
            cgst: round2(halfTax),
            sgst: round2(halfTax),
            igst: 0,
            total: round2(sub.plus(totalTax))
        };
    }
}

/**
 * Check if two currency values are equal (with tolerance)
 */
export function currencyEquals(a: number | string, b: number | string, tolerance = 0.01): boolean {
    return new Decimal(a || 0).minus(new Decimal(b || 0)).abs().lessThanOrEqualTo(tolerance);
}

/**
 * Check if amount is effectively zero
 */
export function isZero(value: number | string, tolerance = 0.01): boolean {
    return new Decimal(value || 0).abs().lessThanOrEqualTo(tolerance);
}

/**
 * Format number for display (Indian format with ₹)
 */
export function formatINR(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return '₹0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

/**
 * Convert number to words (Indian format)
 * e.g. 1234.50 → "One Thousand Two Hundred Thirty Four Rupees and Fifty Paise Only"
 */
export function numberToWords(amount: number): string {
    if (amount === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function twoDigits(n: number): string {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }

    function convert(n: number): string {
        if (n === 0) return '';
        if (n < 100) return twoDigits(n);

        // Indian number system: after hundreds, group by 2 digits (lakhs, crores)
        const crore = Math.floor(n / 10000000);
        const lakh = Math.floor((n % 10000000) / 100000);
        const thousand = Math.floor((n % 100000) / 1000);
        const hundred = Math.floor((n % 1000) / 100);
        const remainder = n % 100;

        const parts: string[] = [];
        if (crore > 0) parts.push(twoDigits(crore) + ' Crore');
        if (lakh > 0) parts.push(twoDigits(lakh) + ' Lakh');
        if (thousand > 0) parts.push(twoDigits(thousand) + ' Thousand');
        if (hundred > 0) parts.push(ones[hundred] + ' Hundred');
        if (remainder > 0) {
            if (parts.length > 0) parts.push('and');
            parts.push(twoDigits(remainder));
        }
        return parts.join(' ');
    }

    const whole = Math.floor(Math.abs(amount));
    const fraction = Math.round((Math.abs(amount) - whole) * 100);

    let result = convert(whole) + ' Rupees';

    if (fraction > 0) {
        result += ' and ' + convert(fraction) + ' Paise';
    }

    return result + ' Only';
}
