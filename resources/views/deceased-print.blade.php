<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $deceased->first_name }} {{ $deceased->last_name }} — Invoice & Payments</title>
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
            --color-amber: #d97706;
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
            max-width: 860px;
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
            font-size: 20px;
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

        .print-deceased-header h2 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: var(--color-foreground);
        }

        .print-deceased-header p {
            margin: 0;
            font-size: 12px;
            color: var(--color-muted-foreground);
        }

        /* Info grid */
        .print-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 28px;
        }

        .print-info-block {
            padding: 14px 16px;
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
            margin: 0 0 5px 0;
            font-size: 13px;
        }

        .print-info-block .label {
            font-size: 11px;
            color: var(--color-muted-foreground);
        }

        .print-info-block .value {
            font-size: 13px;
            font-weight: 500;
        }

        /* Section titles */
        .print-section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-muted-foreground);
            margin: 0 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--color-border);
        }

        /* Tables */
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
            padding: 8px 12px;
            border-bottom: 2px solid var(--color-border);
            text-align: left;
            background: var(--color-secondary);
        }

        .print-table thead th.text-right { text-align: right; }
        .print-table thead th.text-center { text-align: center; }

        .print-table tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--color-border);
            font-size: 13px;
        }

        .print-table tbody td.text-right { text-align: right; }
        .print-table tbody td.text-center { text-align: center; }
        .print-table tbody tr:last-child td { border-bottom: none; }

        .print-table .item-name { font-weight: 500; }
        .print-table .item-service { font-size: 11px; color: var(--color-muted-foreground); }

        /* Summary side panel */
        .print-summary-row {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 24px;
            margin-bottom: 28px;
        }

        .print-summary {
            margin-left: auto;
            width: 100%;
        }

        .print-summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .print-summary-table td {
            padding: 5px 0;
            font-size: 13px;
        }

        .print-summary-table td:first-child { color: var(--color-muted-foreground); }
        .print-summary-table td:last-child { text-align: right; font-weight: 500; }

        .print-summary-table tr.total-row td {
            font-size: 15px;
            font-weight: 700;
            color: var(--color-foreground);
            border-top: 2px solid var(--color-foreground);
            padding-top: 10px;
            margin-top: 4px;
        }

        .print-summary-table tr.paid-row td:last-child { color: var(--color-success); }
        .print-summary-table tr.waived-row td:last-child { color: var(--color-destructive); }

        .print-summary-table tr.balance-row td {
            font-size: 15px;
            font-weight: 700;
            border-top: 2px solid var(--color-border);
            padding-top: 10px;
        }

        .print-summary-table tr.balance-row td:last-child { color: var(--color-destructive); }

        /* Status badge */
        .print-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .print-status.paid { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
        .print-status.partially-paid { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .print-status.unpaid { background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }

        /* Notes */
        .print-notes {
            padding: 12px 16px;
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

        .print-notes p { margin: 0; font-size: 12px; color: var(--color-muted-foreground); line-height: 1.6; }

        /* Storage section */
        .print-storage-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px dashed var(--color-border);
        }

        /* Ledger summary */
        .print-ledger {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 28px;
        }

        .print-ledger-card {
            padding: 14px 16px;
            background: var(--color-secondary);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            text-align: center;
        }

        .print-ledger-card .ledger-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--color-muted-foreground);
            margin: 0 0 6px 0;
        }

        .print-ledger-card .ledger-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--color-foreground);
        }

        .print-ledger-card .ledger-value.success { color: var(--color-success); }
        .print-ledger-card .ledger-value.destructive { color: var(--color-destructive); }
        .print-ledger-card .ledger-value.amber { color: var(--color-amber); }

        /* Footer */
        .print-footer {
            border-top: 1px solid var(--color-border);
            padding-top: 16px;
            text-align: center;
            font-size: 11px;
            color: var(--color-muted-foreground);
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
            <div class="print-deceased-header">
                <h2>{{ $deceased->first_name }} {{ $deceased->last_name }}</h2>
                <p>Record ID: {{ $deceased->id }}</p>
                <p>Status: <strong>{{ $deceased->status }}</strong></p>
            </div>
        </div>

        {{-- Ledger Summary --}}
        <div class="print-ledger">
            <div class="print-ledger-card">
                <p class="ledger-label">Total Billed</p>
                <p class="ledger-value">{{ $currencySymbol }}{{ number_format($totalBilled, 2) }}</p>
            </div>
            <div class="print-ledger-card">
                <p class="ledger-label">Total Paid</p>
                <p class="ledger-value success">{{ $currencySymbol }}{{ number_format($totalPaid, 2) }}</p>
            </div>
            @if($totalWaived > 0)
            <div class="print-ledger-card">
                <p class="ledger-label">Total Waived</p>
                <p class="ledger-value destructive">-{{ $currencySymbol }}{{ number_format($totalWaived, 2) }}</p>
            </div>
            @endif
            <div class="print-ledger-card">
                <p class="ledger-label">Ledger Balance</p>
                <p class="ledger-value {{ $ledgerBalance > 0 ? 'destructive' : 'success' }}">
                    {{ $currencySymbol }}{{ number_format(abs($ledgerBalance), 2) }}
                    {{ $ledgerBalance > 0 ? '(Due)' : 'settled' }}
                </p>
            </div>
        </div>

        {{-- Deceased Info --}}
        <div class="print-info-grid">
            <div class="print-info-block">
                <h3>Deceased Details</h3>
                <p><span class="label">First Name</span></p>
                <p class="value">{{ $deceased->first_name }}</p>
                <p><span class="label">Last Name</span></p>
                <p class="value">{{ $deceased->last_name }}</p>
                <p><span class="label">Date of Birth</span></p>
                <p class="value">{{ $deceased->date_of_birth ? $deceased->date_of_birth->format('M d, Y') : '—' }}</p>
                <p><span class="label">Date of Death</span></p>
                <p class="value">{{ $deceased->date_of_death ? $deceased->date_of_death->format('M d, Y') : '—' }}</p>
                <p><span class="label">Gender</span></p>
                <p class="value">{{ $deceased->gender ?? '—' }}</p>
                <p><span class="label">Cause of Death</span></p>
                <p class="value">{{ $deceased->cause_of_death ?? '—' }}</p>
            </div>
            <div class="print-info-block">
                <h3>Relative / Bringer</h3>
                <p><span class="label">Name</span></p>
                <p class="value">{{ $deceased->relative_name ?? '—' }}</p>
                <p><span class="label">Relationship</span></p>
                <p class="value">{{ $deceased->relative_relationship ?? '—' }}</p>
                <p><span class="label">Phone</span></p>
                <p class="value">{{ $deceased->relative_phone ?? '—' }}</p>
                <p><span class="label">Address</span></p>
                <p class="value">{{ $deceased->relative_address ?? '—' }}</p>
            </div>
        </div>

        {{-- Service Invoices --}}
        @if($serviceInvoices->isNotEmpty())
        <h3 class="print-section-title">Service Invoices</h3>
        @foreach($serviceInvoices as $inv)
        <div style="margin-bottom: 20px; padding: 16px; background: var(--color-secondary); border: 1px solid var(--color-border); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-family: monospace; font-size: 13px; font-weight: 600;">{{ $inv->invoice_number }}</span>
                <span class="print-status {{ strtolower($inv->status) }}">{{ $inv->status }}</span>
            </div>
            <table class="print-table" style="margin-bottom: 12px;">
                <thead>
                    <tr>
                        <th>Service / Item</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-center">Qty</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($inv->invoiceItems as $item)
                    <tr>
                        <td>
                            <span class="item-name">{{ $item->name }}</span>
                            @if($item->service)
                                <span class="item-service"> — {{ $item->service->name }}</span>
                            @endif
                        </td>
                        <td class="text-right">{{ $currencySymbol }}{{ number_format($item->unit_price, 2) }}</td>
                        <td class="text-center">{{ $item->quantity }}</td>
                        <td class="text-right">{{ $currencySymbol }}{{ number_format($item->total_price, 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            <div style="display: flex; justify-content: flex-end;">
                <table class="print-summary-table" style="width: 260px;">
                    <tr><td>Subtotal</td><td>{{ $currencySymbol }}{{ number_format($inv->subtotal, 2) }}</td></tr>
                    @if($inv->discount > 0)<tr style="color: var(--color-success);"><td>Discount</td><td>-{{ $currencySymbol }}{{ number_format($inv->discount, 2) }}</td></tr>@endif
                    @if($inv->tax > 0)<tr><td>Tax</td><td>+{{ $currencySymbol }}{{ number_format($inv->tax, 2) }}</td></tr>@endif
                    <tr style="font-weight: 700; border-top: 1px solid var(--color-border); padding-top: 6px;"><td>Total</td><td>{{ $currencySymbol }}{{ number_format($inv->total_amount, 2) }}</td></tr>
                    @if($inv->paid_amount > 0)<tr style="color: var(--color-success);"><td>Paid</td><td>{{ $currencySymbol }}{{ number_format($inv->paid_amount, 2) }}</td></tr>@endif
                    @if($inv->waived_amount > 0)<tr style="color: var(--color-destructive);"><td>Waived</td><td>-{{ $currencySymbol }}{{ number_format($inv->waived_amount, 2) }}</td></tr>@endif
                    <tr style="font-weight: 700; border-top: 1px solid var(--color-border); padding-top: 6px;"><td>Balance</td><td style="color: var(--color-destructive);">{{ $currencySymbol }}{{ number_format($inv->total_amount - $inv->paid_amount - $inv->waived_amount, 2) }}</td></tr>
                </table>
            </div>
            @if($inv->notes)
            <div style="margin-top: 10px; padding: 8px 12px; background: #fff; border: 1px solid var(--color-border); border-radius: 4px; font-size: 11px; color: var(--color-muted-foreground);">
                <strong style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-muted-foreground);">Notes:</strong> {{ $inv->notes }}
            </div>
            @endif
        </div>
        @endforeach
        @endif

        {{-- Storage Fee Invoices --}}
        @if($storageLogs->isNotEmpty())
        <div class="print-storage-section">
            <h3 class="print-section-title">Storage Fee Invoices</h3>
            <table class="print-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Period</th>
                        <th class="text-center">Days</th>
                        <th class="text-right">Amount</th>
                        <th class="text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($storageLogs as $log)
                    <tr>
                        <td>
                            @if($log->invoice)
                                <span style="font-family: monospace; font-weight: 600;">{{ $log->invoice->invoice_number }}</span>
                            @else
                                —
                            @endif
                        </td>
                        <td>Days {{ $log->days_covered_from }} – {{ $log->days_covered_to }}</td>
                        <td class="text-center">{{ $log->days_billed }}</td>
                        <td class="text-right">{{ $currencySymbol }}{{ number_format($log->amount, 2) }}</td>
                        <td class="text-right">
                            @if($log->invoice)
                                <span class="print-status {{ strtolower($log->invoice->status) }}">{{ $log->invoice->status }}</span>
                            @else
                                —
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        {{-- Payments --}}
        @if($payments->isNotEmpty())
        <h3 class="print-section-title" style="margin-top: 28px;">Payment History</h3>
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
                @foreach($payments as $payment)
                <tr>
                    <td style="font-weight: 500;">{{ $payment->receipt_number }}</td>
                    <td>{{ $payment->payment_date ? \Carbon\Carbon::parse($payment->payment_date)->format('M d, Y') : '—' }}</td>
                    <td>{{ $payment->payment_method }}</td>
                    <td style="font-family: monospace; font-size: 11px;">{{ $payment->transaction_reference ?? '—' }}</td>
                    <td class="text-right" style="color: var(--color-success); font-weight: 600;">{{ $currencySymbol }}{{ number_format($payment->amount, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif

        {{-- Footer --}}
        <div class="print-footer">
            <p>Thank you for your patronage. This is a computer-generated document.</p>
            <p>Record printed on {{ now()->format('M d, Y g:i A') }} · {{ $branding['name'] ?? config('app.name') }}</p>
        </div>
    </div>
</body>
</html>
