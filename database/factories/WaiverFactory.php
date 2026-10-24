<?php

namespace Database\Factories;

use App\Models\Deceased;
use App\Models\User;
use App\Models\Waiver;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Waiver>
 */
class WaiverFactory extends Factory
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
            'invoice_id' => null,
            'amount' => fake()->randomFloat(2, 100, 10000),
            'reason' => fake()->sentence(),
            'authorized_by' => User::factory(),
            'authorized_at' => now(),
        ];
    }
}
