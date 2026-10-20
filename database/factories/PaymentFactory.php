<?php

namespace Database\Factories;

use App\Models\Deceased;
use App\Models\Invoice;
use App\Models\PaymentMode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $deceased = Deceased::factory()->create();
        $paymentMode = PaymentMode::factory()->create();
        $amount = fake()->randomFloat(2, 1, 500);

        return [
            'deceased_id' => $deceased->id,
            'invoice_id' => null, // General credit
            'payment_mode_id' => $paymentMode->id,
            'receipt_number' => 'REC-'.strtoupper(fake()->unique()->randomNumber(6)),
            'amount' => $amount,
            'payment_method' => $paymentMode->name,
            'transaction_reference' => fake()->optional()->bothify('??####'),
            'payment_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'notes' => fake()->optional()->sentence(),
            'received_by' => \App\Models\User::factory()->create()->id,
        ];
    }

    public function forInvoice(): static
    {
        return $this->state(function (array $attributes) {
            $invoice = Invoice::factory()->create([
                'deceased_id' => $this->faker->randomElement(
                    App\Models\Deceased::all()->pluck('id')->toArray()
                ),
            ]);

            return [
                'invoice_id' => $invoice->id,
                'deceased_id' => $invoice->deceased_id,
            ];
        });
    }
}
