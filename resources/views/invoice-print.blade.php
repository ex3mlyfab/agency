<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice {{ $invoice->invoice_number }} — Print</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }

        :root {
            --color-foreground: #0f172a;
            --color-muted-foreground: #64748b;
            --color-border: #e2e8f0;
            --color-card: #ffffff;
            --color-secondary: #f8fafc;
            --color-success: #16a34a;
            --color-destructive: #dc2626;
            --color-primary: #2563eb;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: var(--color-foreground);
            font-size: 13px;
            line-height: 1.5;
        }

        @media print {
            html, body { background: #fff; }
            .no-print { display: none !important; }
            @page { margin: 1.5cm; }
        }

        .print-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px;
        }

        /* Header */
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--color-foreground);
            padding-bottom: 20px;
            margin-bottom: 28px;
        }

        .print-brand h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px 0;
            letter-spacing: -0.02em;
            color: var(--color-foreground);
        }

        .print-brand p {
            margin: 0;
            font-size: 12px;
            color: var(--color-muted-foreground);
        }

        .print-invoice-label {
            text-align: right;
        }

        .print-invoice-label h2 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 6px 0;
            letter-spacing: -0.02em;
            color: var(--color-foreground);
        }

        .print-invoice-label p {
            margin: 0;
            font-size: 12px;
            color: var(--color-muted-foreground);
        }

        .print-invoice-label .invoice-number {
            font-size: 15px;
            font-weight: 600;
            color: var(--color-foreground);
            margin-top: 4px;
        }

        /* Info grid */
        .print-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 28px;
        }

        .print-info-block {
            padding: 16px;
            background: var(--color-secondary);
            border-radius: 6px;
            border: 1px solid var(--color-border);
        }

        .print-info-block h3 {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-muted-foreground);
            margin: 0 0 10px 0;
        }

        .print-info-block p {
            margin: 0 0 4px 0;
            font-size: 13px;
            color: var(--color-foreground);
        }

        .print-info-block .label {
            font-size: 11px;
            color: var(--color-muted-foreground);
        }

        .print-info-block .value {
            font-size: 13px;
            font-weight: 500;
        }

        /* Table */
        .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }

        .print-table thead th {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-muted-foreground);
            padding: 10px 12px;
            border-bottom: 2px solid var(--color-border);
            text-align: left;
        }

        .print-table thead th.text-right {
            text-align: right;
        }

        .print-table thead th.text-center {
            text-align: center;
        }

        .print-table tbody td {
            padding: 12px;
            border-bottom: 1px solid var(--color-border);
            font-size: 13px;
        }

        .print-table tbody td.text-right {
            text-align: right;
        }

        .print-table tbody td.text-center {
            text-align: center;
        }

        .print-table tbody tr:last-child td {
            border-bottom: none;
        }

        .print-table .item-name {
            font-weight: 500;
        }

        .print-table .item-service {
            font-size: 11px;
            color: var(--color-muted-foreground);
        }

        /* Summary */
        .print-summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 28px;
        }

        .print-summary-table {
            width: 280px;
            border-collapse: collapse;
        }

        .print-summary-table td {
            padding: 6px 0;
            font-size: 13px;
        }

        .print-summary-table td:first-child {
            color: var(--color-muted-foreground);
        }

        .print-summary-table td:last-child {
            text-align: right;
            font-weight: 500;
        }

        .print-summary-table tr.total-row td {
            font-size: 15px;
            font-weight: 700;
            color: var(--color-foreground);
            border-top: 2px solid var(--color-foreground);
            padding-top: 10px;
            margin-top: 4px;
        }

        .print-summary-table tr.paid-row td:last-child {
            color: var(--color-success);
        }

        .print-summary-table tr.waived-row td:last-child {
            color: var(--color-destructive);
        }

        .print-summary-table tr.balance-row td {
            font-size: 15px;
            font-weight: 700;
            border-top: 2px solid var(--color-border);
            padding-top: 10px;
        }

        .print-summary-table tr.balance-row td:last-child {
            color: var(--color-destructive);
        }

        /* Status badge */
        .print-status {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .print-status.paid {
            background: #dcfce7;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }

        .print-status.partially-paid {
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fde68a;
        }

        .print-status.unpaid {
            background: #ffe4e6;
            color: #e11d48;
            border: 1px solid #fecdd3;
        }

        /* Notes */
        .print-notes {
            padding: 14px 16px;
            background: var(--color-secondary);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            margin-bottom: 28px;
        }

        .print-notes h4 {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-muted-foreground);
            margin: 0 0 6px 0;
        }

        .print-notes p {
            margin: 0;
            font-size: 12px;
            color: var(--color-muted-foreground);
            line-height: 1.6;
        }

        /* Payments */
        .print-payments-section {
            margin-bottom: 28px;
        }

        .print-payments-section h3 {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-muted-foreground);
            margin: 0 0 12px 0;
        }

        /* Footer */
        .print-footer {
            border-top: 1px solid var(--color-border);
            padding-top: 16px;
            text-align: center;
            font-size: 11px;
            color: var(--color-muted-foreground);
        }

        /* Storage invoice section */
        .print-storage-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px dashed var(--color-border);
        }

        .print-storage-section h3 {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-muted-foreground);
            margin: 0 0 12px 0;
        }
    </style>
</head>
<body>
    <script>
        window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 300);
        });
    </script>

    <div class="print-container">
        {{-- Header --}}
        <div class="print-header">
            <div class="print-brand">
                <h1>{{ $branding['name'] ?? config('app.name') }}</h1>
                <p>Crematorium Management System</p>
            </div>
            <div class="print-invoice-label">
                <h2>INVOICE</h2>
                <p class="invoice-number">{{ $invoice->invoice_number }}</p>
                <p>Created: {{ $invoice->created_at->format('M d, Y') }}</p>
                <p>
                    <span class="print-status {{ strtolower($invoice->status) }}">
                        {{ $invoice->status }}
                    </span>
                </p>
            </div>
        </div>

        {{-- Deceased & Billing Info --}}
        <div class="print-info-grid">
            <div class="print-info-block">
                <h3>Deceased Details</h3>
                <p><span class="label">Full Name</span></p>
                <p class="value">{{ $deceased->first_name }} {{ $deceased->last_name }}</p>
                <p><span class="label">Date of Death</span></p>
                <p class="value">{{ $deceased->date_of_death->format('M d, Y') }}</p>
                <p><span class="label">Gender</span></p>
                <p class="value">{{ $deceased->gender ?? '—' }}</p>
                <p><span class="label">Cause of Death</span></p>
                <p class="value">{{ $deceased->cause_of_death ?? '—' }}</p>
            </div>
            <div class="print-info-block">
                <h3>Billing Information</h3>
                <p><span class="label">Relative / Bringer</span></p>
                <p class="value">{{ $deceased->relative_name ?? '—' }}</p>
                <p><span class="label">Phone</span></p>
                <p class="value">{{ $deceased->relative_phone ?? '—' }}</p>
                <p><span class="label">Relationship</span></p>
                <p class="value">{{ $deceased->relative_relationship ?? '—' }}</p>
                <p><span class="label">Billed By</span></p>
                <p class="value">{{ $invoice->createdByUser?->name ?? 'System' }}</p>
            </div>
        </div>

        {{-- Line Items --}}
        <table class="print-table">
            <thead>
                <tr>
                    <th>Service / Item</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->invoiceItems as $item)
                <tr>
                    <td>
                        <span class="item-name">{{ $item->name }}</span>
                        @if($item->service)
                            <span class="item-service">{{ $item->service->name }}</span>
                        @endif
                    </td>
                    <td class="text-right">{{ $currencySymbol }}{{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-center">{{ $item->quantity }}</td>
                    <td class="text-right">{{ $currencySymbol }}{{ number_format($item->total_price, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Summary --}}
        <div class="print-summary">
            <table class="print-summary-table">
                <tr>
                    <td>Subtotal</td>
                    <td>{{ $currencySymbol }}{{ number_format($invoice->subtotal, 2) }}</td>
                </tr>
                @if($invoice->discount > 0)
                <tr class="waived-row">
                    <td>Discount</td>
                    <td>-{{ $currencySymbol }}{{ number_format($invoice->discount, 2) }}</td>
                </tr>
                @endif
                @if($invoice->tax > 0)
                <tr>
                    <td>Tax</td>
                    <td>+{{ $currencySymbol }}{{ number_format($invoice->tax, 2) }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td>Total Amount</td>
                    <td>{{ $currencySymbol }}{{ number_format($invoice->total_amount, 2) }}</td>
                </tr>
                @if($invoice->paid_amount > 0)
                <tr class="paid-row">
                    <td>Paid to Date</td>
                    <td>{{ $currencySymbol }}{{ number_format($invoice->paid_amount, 2) }}</td>
                </tr>
                @endif
                @if($invoice->waived_amount > 0)
                <tr class="waived-row">
                    <td>Waived</td>
                    <td>-{{ $currencySymbol }}{{ number_format($invoice->waived_amount, 2) }}</td>
                </tr>
                @endif
                <tr class="balance-row">
                    <td>Outstanding Balance</td>
                    <td>{{ $currencySymbol }}{{ number_format($invoice->total_amount - $invoice->paid_amount - $invoice->waived_amount, 2) }}</td>
                </tr>
            </table>
        </div>

        {{-- Notes --}}
        @if($invoice->notes)
        <div class="print-notes">
            <h4>Notes</h4>
            <p>{{ $invoice->notes }}</p>
        </div>
        @endif

        {{-- Payments --}}
        @if($invoice->payments->isNotEmpty())
        <div class="print-payments-section">
            <h3>Payment History</h3>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>Receipt #</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($invoice->payments as $payment)
                    <tr>
                        <td>{{ $payment->receipt_number }}</td>
                        <td>{{ $payment->payment_date ? \Carbon\Carbon::parse($payment->payment_date)->format('M d, Y') : '—' }}</td>
                        <td>{{ $payment->payment_method }}</td>
                        <td style="font-family: monospace; font-size: 11px;">{{ $payment->transaction_reference ?? '—' }}</td>
                        <td class="text-right" style="color: var(--color-success); font-weight: 600;">{{ $currencySymbol }}{{ number_format($payment->amount, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        {{-- Footer --}}
        <div class="print-footer">
            <p>Thank you for your patronage. This is a computer-generated document.</p>
            <p>Invoice generated on {{ now()->format('M d, Y g:i A') }} · {{ $branding['name'] ?? config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
