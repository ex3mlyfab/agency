<?php

namespace Database\Factories;

use App\Models\ServicePrice;
use App\Models\ServicePriceTier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServicePriceTier>
 */
class ServicePriceTierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_price_id' => ServicePrice::factory(),
            'start_day' => 1,
            'end_day' => null,
            'price' => fake()->randomFloat(2, 100, 5000),
        ];
    }
}
