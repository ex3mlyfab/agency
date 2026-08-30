<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWaiverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string|string[]>> */
    public function rules(): array
    {
        return [
            'deceased_id' => ['required', 'string', 'exists:deceased,id'],
            'invoice_id' => ['required', 'string', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'deceased_id' => 'deceased record',
            'invoice_id' => 'invoice',
            'amount' => 'waiver amount',
            'reason' => 'reason',
        ];
    }
}
