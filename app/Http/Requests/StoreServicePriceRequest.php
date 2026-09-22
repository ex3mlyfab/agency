<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServicePriceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('service_prices.manage');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'service_id' => [
                'required',
                'exists:services,id',
                Rule::unique('service_prices')->where(function ($query) {
                    return $query->where('service_category_id', $this->service_category_id)
                        ->where('source', $this->source);
                }),
            ],
            'service_category_id' => ['required', 'exists:service_categories,id'],
            'source' => ['nullable', 'string', 'in:In Hospital,Outside Hospital'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'tiers' => ['nullable', 'array'],
            'tiers.*.start_day' => ['required', 'integer', 'min:1'],
            'tiers.*.end_day' => ['nullable', 'integer', 'gte:tiers.*.start_day'],
            'tiers.*.price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            // Tiers must be contiguous: each tier's start_day must be the previous
            // tier's end_day + 1 (an open-ended previous tier ends the sequence).
            $tiers = $this->input('tiers');

            if (! is_array($tiers) || count($tiers) < 2) {
                return;
            }

            for ($i = 1; $i < count($tiers); $i++) {
                $prevStart = (int) ($tiers[$i - 1]['start_day'] ?? 0);
                $prevEnd = $tiers[$i - 1]['end_day'] ?? null;
                $start = (int) ($tiers[$i]['start_day'] ?? 0);

                if ($prevEnd !== null && $start > ((int) $prevEnd + 1)) {
                    $validator->errors()->add(
                        "tiers.$i.start_day",
                        'Tiers must be contiguous: day '.($start).' starts a gap after day '.(int) $prevEnd.'.'
                    );

                    return;
                }
            }
        }];
    }
}
