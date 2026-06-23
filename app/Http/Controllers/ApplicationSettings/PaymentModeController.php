<?php

namespace App\Http\Controllers\ApplicationSettings;

use App\Http\Controllers\Controller;
use App\Models\PaymentMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentModeController extends Controller
{
    /**
     * Display a listing of the payment modes.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $paymentModes = PaymentMode::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('application-settings/payment-modes/index', [
            'paymentModes' => $paymentModes,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Store a newly created payment mode in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:payment_modes,name'],
            'is_active' => ['required', 'boolean'],
        ]);

        PaymentMode::create($validated);

        return redirect()->route('application-settings.payment-modes.index')
            ->with('flash', ['type' => 'success', 'message' => 'Payment mode created successfully.']);
    }

    /**
     * Update the specified payment mode in storage.
     */
    public function update(Request $request, PaymentMode $paymentMode): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:payment_modes,name,'.$paymentMode->id],
            'is_active' => ['required', 'boolean'],
        ]);

        $paymentMode->update($validated);

        return redirect()->route('application-settings.payment-modes.index')
            ->with('flash', ['type' => 'success', 'message' => 'Payment mode updated successfully.']);
    }

    /**
     * Remove the specified payment mode from storage.
     */
    public function destroy(PaymentMode $paymentMode): RedirectResponse
    {
        // Check if payments are using this payment mode
        if ($paymentMode->payments()->exists()) {
            return back()->with('flash', [
                'type' => 'error',
                'message' => 'Cannot delete payment mode because it is linked to one or more payments. Try marking it as inactive instead.',
            ]);
        }

        $paymentMode->delete();

        return redirect()->route('application-settings.payment-modes.index')
            ->with('flash', ['type' => 'success', 'message' => 'Payment mode deleted successfully.']);
    }
}
