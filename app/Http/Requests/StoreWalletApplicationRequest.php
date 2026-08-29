<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWalletApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('payments.manage') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'deceased_id' => ['required', 'exists:deceased,id'],
            'invoice_id' => ['required', Rule::exists('invoices', 'id')],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->filled('invoice_id') || ! $this->filled('deceased_id')) {
                return;
            }

            $invoice = Invoice::find($this->input('invoice_id'));

            if ($invoice && $invoice->deceased_id != $this->input('deceased_id')) {
                $validator->errors()->add('invoice_id', 'The selected invoice does not belong to the deceased record.');
            }
        }];
    }
}
