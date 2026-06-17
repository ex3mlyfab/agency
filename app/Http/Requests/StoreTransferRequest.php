<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTransferRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('transfers.create');
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
            'to_chamber_id' => ['nullable', 'exists:chambers,id'],
            'event_type' => ['required', 'in:Entered,Transferred,Released'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
