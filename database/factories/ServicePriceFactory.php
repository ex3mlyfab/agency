<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePrice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServicePrice>
 */
class ServicePriceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'service_category_id' => ServiceCategory::factory(),
            'price' => fake()->randomFloat(2, 10, 500),
        ];
    }

    public function forService(Service $service, ?ServiceCategory $category = null): static
    {
        return $this->state([
            'service_id' => $service->id,
            'service_category_id' => $category?->id ?? $service->service_category_id,
        ]);
    }
}
