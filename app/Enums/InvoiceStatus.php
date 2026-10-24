<?php

namespace App\Enums;

/**
 * Status values for invoices.
 *
 * Each value corresponds to the string stored in the database
 * and is used consistently across the application.
 */
final class InvoiceStatus
{
    /** Invoice has been created but no payment has been received. */
    public const Draft = 'Draft';

    /** Invoice is unpaid with no payments applied. */
    public const Unpaid = 'Unpaid';

    /** Some payments have been applied but the full amount is not settled. */
    public const PartiallyPaid = 'Partially Paid';

    /** Invoice is fully paid. */
    public const Paid = 'Paid';

    /** A refund has been issued against this invoice. */
    public const Refunded = 'Refunded';

    /**
     * Get all invoice status values as an array.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            self::Draft,
            self::Unpaid,
            self::PartiallyPaid,
            self::Paid,
            self::Refunded,
        ];
    }
}
