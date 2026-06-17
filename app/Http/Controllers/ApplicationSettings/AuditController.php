<?php

namespace App\Http\Controllers\ApplicationSettings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $audits = Activity::query()
            ->with('causer')
            ->when($search, function ($query, $search) {
                $query->where('description', 'like', "%{$search}%")
                    ->orWhere('log_name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('application-settings/audits/index', [
            'audits' => $audits,
            'filters' => $request->only('search'),
        ]);
    }
}
