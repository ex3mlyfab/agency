<?php

namespace App\Http\Requests;

use App\Enums\BranchStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('branches.manage');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('branches', 'name')->ignore($this->route('branch'))],
            'slug' => ['nullable', 'string', 'max:100', 'alpha_dash', Rule::unique('branches', 'slug')->ignore($this->route('branch'))],
            'status' => ['required', 'string', Rule::in(BranchStatus::values())],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => $this->input('slug') !== null && $this->input('slug') !== ''
                ? $this->input('slug')
                : Str::slug((string) $this->input('name')),
        ]);
    }
}
