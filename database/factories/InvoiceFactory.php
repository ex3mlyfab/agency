<?php

namespace Database\Factories;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 10, 1000);
        $discount = fake()->randomFloat(2, 0, 100);
        $tax = fake()->randomFloat(2, 0, 200);

        return [
            'deceased_id' => Deceased::factory(),
            'invoice_number' => 'INV-'.strtoupper(fake()->unique()->randomNumber(8)),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'total_amount' => $subtotal - $discount + $tax,
            'paid_amount' => 0.00,
            'waived_amount' => 0.00,
            'status' => 'Unpaid',
            'billing_type' => 'service',
            'notes' => fake()->optional()->sentence(),
            'created_by' => User::factory(),
        ];
    }

    public function storage(): static
    {
        return $this->state(['billing_type' => 'storage']);
    }

    public function refunded(): static
    {
        return $this->state(['status' => 'Refunded']);
    }
}
