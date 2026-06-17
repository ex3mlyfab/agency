<?php

namespace App\Http\Controllers;

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Show the reports entry point.
     */
    public function index(): Response
    {
        Gate::authorize('reports.view');

        return Inertia::render('reports/index', [
            'can' => [
                'generate' => auth()->user()?->can('reports.view'),
            ],
        ]);
    }

    /**
     * Generate and download a report.
     */
    public function generate(Request $request): StreamedResponse|RedirectResponse
    {
        Gate::authorize('reports.view');

        $validated = $request->validate([
            'report_type' => ['required', 'in:deceased_summary,chamber_occupancy,transfer_log'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $reportType = $validated['report_type'];
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;

        $data = match ($reportType) {
            'deceased_summary' => $this->deceasedSummaryReport($dateFrom, $dateTo),
            'chamber_occupancy' => $this->chamberOccupancyReport(),
            'transfer_log' => $this->transferLogReport($dateFrom, $dateTo),
            default => [],
        };

        $filename = $reportType.'_'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($data) {
            if (empty($data)) {
                echo "No data found for this report.\n";

                return;
            }

            $handle = fopen('php://output', 'w');
            fputcsv($handle, array_keys($data[0]));
            foreach ($data as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function deceasedSummaryReport(?string $dateFrom, ?string $dateTo): array
    {
        return Deceased::query()
            ->when($dateFrom, fn ($q) => $q->whereDate('date_of_death', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('date_of_death', '<=', $dateTo))
            ->with('chamber')
            ->get()
            ->map(fn (Deceased $d) => [
                'ID' => $d->id,
                'First Name' => $d->first_name,
                'Last Name' => $d->last_name,
                'Date of Death' => $d->date_of_death?->format('Y-m-d'),
                'Gender' => $d->gender,
                'Status' => $d->status,
                'Chamber' => $d->chamber?->name ?? '—',
                'Relative' => $d->relative_name,
                'Relative Phone' => $d->relative_phone,
            ])
            ->toArray();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function chamberOccupancyReport(): array
    {
        return Chamber::withCount('occupants')
            ->get()
            ->map(fn (Chamber $c) => [
                'ID' => $c->id,
                'Name' => $c->name,
                'Location' => $c->location ?? '—',
                'Capacity' => $c->capacity,
                'Occupants' => $c->occupants_count,
                'Status' => $c->occupancy_status,
            ])
            ->toArray();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function transferLogReport(?string $dateFrom, ?string $dateTo): array
    {
        return Transfer::query()
            ->when($dateFrom, fn ($q) => $q->whereDate('transferred_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->whereDate('transferred_at', '<=', $dateTo))
            ->with(['deceased', 'fromChamber', 'toChamber', 'transferredByUser'])
            ->latest('transferred_at')
            ->get()
            ->map(fn (Transfer $t) => [
                'ID' => $t->id,
                'Deceased' => $t->deceased?->full_name ?? '—',
                'Event Type' => $t->event_type,
                'From Chamber' => $t->fromChamber?->name ?? '—',
                'To Chamber' => $t->toChamber?->name ?? '—',
                'Transferred By' => $t->transferredByUser?->name ?? '—',
                'Date' => $t->transferred_at->format('Y-m-d H:i'),
                'Notes' => $t->notes ?? '',
            ])
            ->toArray();
    }
}
