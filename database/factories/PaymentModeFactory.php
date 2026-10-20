<?php

namespace Database\Factories;

use App\Models\PaymentMode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentMode>
 */
class PaymentModeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Cash',
                'Bank Transfer',
                'Credit Card',
                'Mobile Money',
                'Cheque',
                'Insurance',
            ]) . ' ' . fake()->unique()->numberBetween(1000, 9999),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
