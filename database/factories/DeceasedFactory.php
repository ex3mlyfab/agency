<?php

namespace Database\Factories;

use App\Models\Chamber;
use App\Models\Deceased;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Deceased>
 */
class DeceasedFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'date_of_birth' => fake()->dateTimeBetween('-80 years', '-20 years')->format('Y-m-d'),
            'date_of_death' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'cause_of_death' => fake()->randomElement([
                'Natural causes',
                'Cardiac arrest',
                'Accident',
                'Respiratory failure',
                null,
            ]),
            'notes' => fake()->optional()->sentence(),
            'status' => fake()->randomElement(['Pending', 'InChamber', 'Released']),
            'chamber_id' => null,
            'relative_name' => fake()->name(),
            'relative_phone' => fake()->phoneNumber(),
            'relative_relationship' => fake()->randomElement([
                'Spouse',
                'Parent',
                'Child',
                'Sibling',
                'Friend',
            ]),
            'relative_address' => fake()->optional()->address(),
            'service_category_id' => ServiceCategory::factory(),
            'source' => fake()->randomElement(['In Hospital', 'Outside Hospital']),
        ];
    }

    /**
     * State: deceased is pending (no chamber).
     */
    public function pending(): static
    {
        return $this->state(['status' => 'Pending', 'chamber_id' => null]);
    }

    /**
     * State: deceased is in a chamber.
     */
    public function inChamber(): static
    {
        return $this->state(function () {
            $chamber = Chamber::inRandomOrder()->first() ?? Chamber::factory()->create();

            return [
                'status' => 'InChamber',
                'chamber_id' => $chamber->id,
            ];
        });
    }

    /**
     * State: deceased has been released.
     */
    public function released(): static
    {
        return $this->state(['status' => 'Released', 'chamber_id' => null]);
    }
}
