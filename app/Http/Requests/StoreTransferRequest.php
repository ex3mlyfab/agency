<?php

namespace App\Http\Requests;

use App\Models\Deceased;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
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

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $deceased = $this->route('deceased') ?? Deceased::find($this->input('deceased_id'));

            if (! $deceased) {
                return;
            }

            match ($this->input('event_type')) {
                'Entered' => (! $deceased->chamber_id && $this->filled('to_chamber_id')) || $validator->errors()->add('event_type', 'Entry requires a pending record and a destination chamber.'),
                'Transferred' => ($deceased->chamber_id && $this->filled('to_chamber_id') && $deceased->chamber_id !== $this->input('to_chamber_id')) || $validator->errors()->add('event_type', 'Transfer requires a different destination chamber.'),
                'Released' => ($deceased->chamber_id && ! $this->filled('to_chamber_id')) || $validator->errors()->add('event_type', 'Release requires a current chamber and no destination.'),
                default => null,
            };
        }];
    }
}
