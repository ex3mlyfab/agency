<?php

namespace App\Support;

use App\Models\Branch;
use Illuminate\Support\Str;

/**
 * Central generator for document numbers.
 *
 * Every invoice/receipt/refund number is prefixed by the branch slug of
 * the branch the deceased record is placed in (via its chamber), or the
 * first branch when no branch can be resolved — e.g. INV-MAIN-AB12CD34.
 */
final class DocumentNumber
{
    public static function invoice(?string $branchSlug = null): string
    {
        return self::make('INV', $branchSlug);
    }

    public static function storage(?string $branchSlug = null): string
    {
        return self::make('STO', $branchSlug);
    }

    public static function receipt(?string $branchSlug = null): string
    {
        return self::make('REC', $branchSlug);
    }

    public static function refundInvoice(?string $branchSlug = null): string
    {
        return self::make('RFD', $branchSlug);
    }

    public static function refund(?string $branchSlug = null): string
    {
        return self::make('REF', $branchSlug);
    }

    /**
     * Resolve a usable branch slug, falling back to the first (default)
     * branch when none is supplied, or null when there are no branches at
     * all (the suffix is then omitted).
     */
    public static function defaultSlug(): ?string
    {
        return Branch::query()->orderBy('created_at')->value('slug');
    }

    private static function make(string $type, ?string $branchSlug = null): string
    {
        if ($branchSlug === null || $branchSlug === '') {
            $branchSlug = self::defaultSlug();
        }

        return $branchSlug !== null && $branchSlug !== ''
            ? $type.'-'.strtoupper($branchSlug).'-'.strtoupper(Str::random(8))
            : $type.'-'.strtoupper(Str::random(8));
    }
}
