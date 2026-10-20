<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDeceasedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('deceased.create');
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
            'othernames' => ['nullable', 'string', 'max:255'],
            'picture' => ['nullable', 'image', 'max:2048'],
            'date_of_birth' => ['nullable', 'date', 'before:date_of_death'],
            'estimated_age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'date_of_death' => ['required', 'date', 'before_or_equal:now'],
            'body_tag_number' => ['nullable', 'string', 'max:255'],
            'body_condition' => ['nullable', 'string', 'max:255'],
            'type_of_cloth' => ['nullable', 'string', 'max:255'],
            'color_of_cloth' => ['nullable', 'string', 'max:255'],
            'underwear' => ['nullable', 'string', 'max:255'],
            'type_of_wrapping' => ['nullable', 'string', 'max:255'],
            'type_of_wrapping_other' => ['nullable', 'string', 'max:255', 'required_if:type_of_wrapping,Others'],
            'place_of_death' => ['nullable', 'string', 'max:255'],
            'place_of_death_other' => ['nullable', 'string', 'max:255', 'required_if:place_of_death,Others'],
            'hospital_number' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'cause_of_death' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'relative_name' => ['required', 'string', 'max:150'],
            'relative_phone' => ['required', 'string', 'max:30'],
            'relative_relationship' => ['required', 'string', 'max:100'],
            'relative_address' => ['nullable', 'string', 'max:255'],
            'residential_address' => ['nullable', 'string', 'max:1000'],
            'chamber_id' => ['nullable', 'exists:chambers,id'],
            'stored_at' => ['nullable', 'date', 'required_with:chamber_id'],
            'service_category_id' => ['required', 'exists:service_categories,id'],
            'source' => ['required', 'string', 'in:In Hospital,Outside Hospital'],
        ];
    }
}
