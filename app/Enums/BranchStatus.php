<?php

namespace App\Enums;

/**
 * Status values for branches.
 *
 * Each value corresponds to the string stored in the database
 * and is used consistently across the application.
 */
final class BranchStatus
{
    /** Branch is operational and can receive new chamber placements. */
    public const Active = 'Active';

    /** Branch is retired; existing chambers remain but cannot receive new placements. */
    public const Inactive = 'Inactive';

    /**
     * Get all status values as an array.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return [
            self::Active,
            self::Inactive,
        ];
    }

    /**
     * Check if a status string is a valid BranchStatus value.
     */
    public static function isValid(string $status): bool
    {
        return in_array($status, self::values());
    }
}
