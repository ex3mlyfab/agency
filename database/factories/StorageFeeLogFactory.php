<?php

namespace Database\Factories;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\StorageFeeLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StorageFeeLog>
 */
class StorageFeeLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'deceased_id' => Deceased::factory(),
            'invoice_id' => Invoice::factory(),
            'days_billed' => fake()->numberBetween(1, 30),
            'days_covered_from' => fake()->numberBetween(1, 100),
            'days_covered_to' => fake()->numberBetween(101, 200),
            'amount' => fake()->randomFloat(2, 10, 500),
            'paid_days_at_creation' => fake()->numberBetween(0, 100),
            'created_by' => User::factory(),
            'admission_started_at' => null,
        ];
    }

    public function withoutInvoice(): static
    {
        return $this->state(['invoice_id' => null]);
    }
}
