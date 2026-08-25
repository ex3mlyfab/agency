import { usePage } from '@inertiajs/react';

/**
 * Returns the application currency symbol from the shared branding prop.
 * Falls back to '₦' if not configured.
 */
export function useCurrency(): string {
    const { branding } = usePage().props as any;

    return branding?.currency_symbol || '₦';
}

/**
 * Format a numeric amount with the given currency symbol.
 * Example: fmtCurrency(1500, '₦') => '₦1,500.00'
 */
export function fmtCurrency(amount: number, symbol: string): string {
    return `${symbol}${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
