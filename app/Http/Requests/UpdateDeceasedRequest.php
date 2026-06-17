<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDeceasedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('deceased.edit');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'picture' => ['nullable', 'image', 'max:2048'],
            'date_of_birth' => ['nullable', 'date', 'before:date_of_death'],
            'date_of_death' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'cause_of_death' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'in:Pending,InChamber,Released'],
            'relative_name' => ['required', 'string', 'max:150'],
            'relative_phone' => ['required', 'string', 'max:30'],
            'relative_relationship' => ['required', 'string', 'max:100'],
            'relative_address' => ['nullable', 'string', 'max:255'],
            'chamber_id' => ['nullable', 'exists:chambers,id'],
            'stored_at' => ['nullable', 'date', 'required_with:chamber_id'],
        ];
    }
}
