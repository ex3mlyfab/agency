<?php

namespace App\Http\Middleware;

use App\Models\ApplicationSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => ApplicationSetting::get('app_name', config('app.name')),
            'auth' => [
                'user' => $user,
            ],
            'can' => [
                'history.view' => $user ? $user->can('history.view') : false,
                'reports.view' => $user ? $user->can('reports.view') : false,
                'service_categories.view' => $user ? $user->can('service_categories.view') : false,
                'services.view' => $user ? $user->can('services.view') : false,
                'service_prices.view' => $user ? $user->can('service_prices.view') : false,
                'invoices.view' => $user ? $user->can('invoices.view') : false,
                'payments.view' => $user ? $user->can('payments.view') : false,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'branding' => [
                'name' => ApplicationSetting::get('app_name', config('app.name')),
                'logo' => ApplicationSetting::get('app_logo')
                    ? Storage::disk('public')->url(ApplicationSetting::get('app_logo'))
                    : null,
                'currency_symbol' => ApplicationSetting::get('currency_symbol', '₦'),
            ],
        ];
    }
}
