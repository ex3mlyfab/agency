<?php

namespace App\Enums;

/**
 * Status values for deceased records.
 *
 * Each value corresponds to the string stored in the database
 * and is used consistently across the application.
 */
final class DeceasedStatus
{
    /** Deceased record has been created but not yet placed in a chamber. */
    public const Pending = 'Pending';

    /** Deceased is currently stored in a chamber. */
    public const InChamber = 'InChamber';

    /** Deceased has been released from the mortuary. */
    public const Released = 'Released';

    /**
     * Get all status values as an array.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            self::Pending,
            self::InChamber,
            self::Released,
        ];
    }

    /**
     * Check if a status string is a valid DeceasedStatus value.
     *
     * @param  string  $status
     * @return bool
     */
    public static function isValid(string $status): bool
    {
        return in_array($status, self::values());
    }
}