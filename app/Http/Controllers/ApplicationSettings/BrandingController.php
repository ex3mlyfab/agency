<?php

namespace App\Http\Controllers\ApplicationSettings;

use App\Http\Controllers\Controller;
use App\Models\ApplicationSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandingController extends Controller
{
    public function edit(): Response
    {
        Gate::authorize('branding.manage');
        $settings = ApplicationSetting::getMany([
            'app_name',
            'app_logo',
            'currency_symbol',
        ]);

        return Inertia::render('application-settings/branding/edit', [
            'settings' => [
                'app_name' => $settings['app_name'] ?? config('app.name'),
                'app_logo' => $settings['app_logo'] ?? null,
                'currency_symbol' => $settings['currency_symbol'] ?? '₦',
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('branding.manage');
        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:100'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'currency_symbol' => ['required', 'string', 'max:10'],
        ]);

        ApplicationSetting::set('app_name', $validated['app_name']);
        ApplicationSetting::set('currency_symbol', $validated['currency_symbol']);

        if ($request->boolean('remove_logo')) {
            $existing = ApplicationSetting::get('app_logo');
            if ($existing) {
                Storage::disk('public')->delete($existing);
            }
            ApplicationSetting::set('app_logo', null);
        } elseif ($request->hasFile('logo')) {
            // Remove old logo if exists
            $existing = ApplicationSetting::get('app_logo');
            if ($existing) {
                Storage::disk('public')->delete($existing);
            }

            $path = $request->file('logo')->store('branding', 'public');
            ApplicationSetting::set('app_logo', $path);
        }

        return back()->with('status', 'branding-updated');
    }
}
