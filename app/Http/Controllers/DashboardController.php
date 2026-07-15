<?php

namespace App\Http\Controllers;

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the mortuary dashboard.
     */
    public function index(Request $request): Response
    {
        // 1. Core Metrics
        $totalChambers = Chamber::count();
        $totalCapacity = Chamber::sum('capacity');

        $occupiedChambers = Deceased::where('status', 'InChamber')->count();
        $chambers = Chamber::withCount(['occupants'])->get();
        $emptyChambers = $chambers
            ->filter(fn (Chamber $c) => $c->occupants_count === 0)
            ->count();

        $occupancyRate = $totalCapacity > 0
            ? round(($occupiedChambers / $totalCapacity) * 100, 1)
            : 0;

        $pendingAdmissions = Deceased::where('status', 'Pending')->count();
        $totalReleases = Deceased::where('status', 'Released')->count();

        // 2. Chamber occupancy snapshot
        $occupancy = $chambers
            ->map(function (Chamber $chamber) {
                return [
                    'chamberId' => $chamber->id,
                    'chamberName' => $chamber->name,
                    'status' => $chamber->occupants_count > 0 ? 'In use' : 'Empty',
                    'daysInChamber' => $chamber->days_in_chamber,
                ];
            })
            ->sortByDesc(fn ($c) => $c['status'] === 'In use')
            ->values()
            ->toArray();

        // 3. Latest events (from the transfers table)
        $latestEvents = Transfer::with(['deceased', 'fromChamber', 'toChamber', 'transferredByUser'])
            ->latest('transferred_at')
            ->take(5)
            ->get()
            ->map(function (Transfer $transfer) {
                $actor = $transfer->transferredByUser?->name ?? 'System';
                $deceasedName = $transfer->deceased?->full_name ?? 'Unknown Deceased';

                $label = match ($transfer->event_type) {
                    'Entered' => "{$deceasedName} was placed in ".($transfer->toChamber?->name ?? 'a chamber'),
                    'Transferred' => "{$deceasedName} was moved from ".($transfer->fromChamber?->name ?? 'unknown').' → '.($transfer->toChamber?->name ?? 'unknown'),
                    'Released' => "{$deceasedName} was released from ".($transfer->fromChamber?->name ?? 'a chamber'),
                    default => "{$deceasedName}: {$transfer->event_type}",
                };

                return [
                    'id' => $transfer->id,
                    'occurredAt' => $transfer->transferred_at->diffForHumans(),
                    'type' => $transfer->event_type,
                    'label' => $label,
                    'actor' => $actor,
                ];
            })
            ->toArray();

        // 4. Daily admissions & releases over the last 7 days
        $trendCounts = Transfer::query()
            ->selectRaw('DATE(transferred_at) as date')
            ->selectRaw("SUM(CASE WHEN event_type = 'Entered' THEN 1 ELSE 0 END) as admissions")
            ->selectRaw("SUM(CASE WHEN event_type = 'Released' THEN 1 ELSE 0 END) as releases")
            ->whereBetween('transferred_at', [now()->subDays(6)->startOfDay(), now()->endOfDay()])
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $trendData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateString = $date->format('Y-m-d');
            $displayLabel = $date->format('M d');

            $counts = $trendCounts->get($dateString);

            $trendData[] = [
                'date' => $dateString,
                'label' => $displayLabel,
                'admissions' => (int) ($counts?->admissions ?? 0),
                'releases' => (int) ($counts?->releases ?? 0),
            ];
        }

        // 5. User permissions
        $user = auth()->user();

        return Inertia::render('dashboard', [
            'stats' => [
                'totalChambers' => $totalChambers,
                'totalCapacity' => $totalCapacity,
                'occupiedChambers' => $occupiedChambers,
                'emptyChambers' => $emptyChambers,
                'occupancyRate' => $occupancyRate,
                'pendingAdmissions' => $pendingAdmissions,
                'totalReleases' => $totalReleases,
            ],
            'occupancy' => $occupancy,
            'latestEvents' => $latestEvents,
            'trendData' => $trendData,
            'can' => [
                'createDeceased' => $user?->can('deceased.create') ?? false,
                'manageChambers' => $user?->can('chambers.manage') ?? false,
                'createTransfer' => $user?->can('transfers.create') ?? false,
                'viewReports' => $user?->can('reports.view') ?? false,
                'viewHistory' => $user?->can('history.view') ?? false,

                // Dot-notated keys for components reading from share/global props
                'deceased.create' => $user?->can('deceased.create') ?? false,
                'chambers.manage' => $user?->can('chambers.manage') ?? false,
                'transfers.create' => $user?->can('transfers.create') ?? false,
                'reports.view' => $user?->can('reports.view') ?? false,
                'history.view' => $user?->can('history.view') ?? false,
            ],
        ]);
    }
}
