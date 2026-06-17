<?php

namespace Database\Factories;

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\Transfer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transfer>
 */
class TransferFactory extends Factory
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
            'from_chamber_id' => null,
            'to_chamber_id' => Chamber::factory(),
            'transferred_by' => User::factory(),
            'event_type' => 'Entered',
            'notes' => fake()->optional()->sentence(),
            'transferred_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
