/**
 * Format a date string or Date object to a readable string
 * @param date - Date string (ISO) or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string (e.g., "05 Feb 2026")
 */
export function formatDate(
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', options).format(d);
}
