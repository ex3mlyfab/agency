<?php

namespace Database\Factories;

use App\Models\Chamber;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Chamber>
 */
class ChamberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 0;
        $counter++;

        return [
            'name' => 'Chamber '.strtoupper(fake()->randomLetter()).'-'.str_pad((string) $counter, 2, '0', STR_PAD_LEFT),
            'location' => fake()->randomElement(['Wing A', 'Wing B', 'Ground Floor', 'Basement', 'Level 2']),
            'capacity' => 1,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
