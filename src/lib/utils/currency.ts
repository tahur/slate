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
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

/**
 * Convert number to words (Indian format)
 */
export function numberToWords(amount: number): string {
    const a = [
        '',
        'one ',
        'two ',
        'three ',
        'four ',
        'five ',
        'six ',
        'seven ',
        'eight ',
        'nine ',
        'ten ',
        'eleven ',
        'twelve ',
        'thirteen ',
        'fourteen ',
        'fifteen ',
        'sixteen ',
        'seventeen ',
        'eighteen ',
        'nineteen '
    ];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    const numToString = (num: number): string => {
        if ((num = num.toString().length) > 9) return 'overflow';
        const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
        str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
        str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
        str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
        str +=
            n[5] != 0
                ? (str != '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])
                : '';
        return str;
    };

    const whole = Math.floor(amount);
    const fraction = Math.round((amount - whole) * 100);

    let str = numToString(whole) + 'Rupees';

    if (fraction > 0) {
        str += ' and ' + numToString(fraction) + 'Paise';
    }

    return (str + ' Only').replace(/\s+/g, ' ').trim();
}
