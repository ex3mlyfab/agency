import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeftIcon,
    CreditCardIcon,
    UserIcon,
    CalendarIcon,
    FileTextIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency, fmtCurrency } from '@/lib/currency';

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
    date_of_death: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: string | number;
    status: string;
}

interface User {
    name: string;
}

interface Payment {
    id: string;
    receipt_number: string;
    deceased: Deceased | null;
    invoice: Invoice | null;
    received_by_user: User | null;
    amount: string | number;
    payment_method: string;
    transaction_reference: string | null;
    payment_date: string;
    notes: string | null;
    created_at: string;
}

interface Props {
    payment: Payment;
}

export default function PaymentShow({ payment }: Props) {
    const symbol = useCurrency();

    return (
        <>
            <Head title={`Receipt ${payment.receipt_number}`} />
            <div className="mx-auto max-w-4xl space-y-6 p-6">
                {/* Header Action */}
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/payments">
                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                            Back to Payments
                        </Link>
                    </Button>
                </div>

                {/* Main grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Payment details */}
                    <Card className="md:col-span-2">
                        <CardHeader className="border-b border-border px-6 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                    <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                                    Receipt {payment.receipt_number}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    Processed on{' '}
                                    {new Date(
                                        payment.payment_date,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            {/* Receipt Summary Table */}
                            <div className="grid grid-cols-2 gap-4 border-b border-border pb-6 text-sm">
                                <div>
                                    <span className="block text-xs font-medium text-muted-foreground uppercase">
                                        Payment Method
                                    </span>
                                    <span className="mt-1 block font-semibold text-foreground">
                                        {payment.payment_method}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-muted-foreground uppercase">
                                        Transaction Reference
                                    </span>
                                    <span className="mt-1 block font-mono font-medium text-foreground">
                                        {payment.transaction_reference || 'N/A'}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="block text-xs font-medium text-muted-foreground uppercase">
                                        Received By
                                    </span>
                                    <span className="mt-1 block font-medium text-foreground">
                                        {payment.received_by_user?.name ||
                                            'System'}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="block text-xs font-medium text-muted-foreground uppercase">
                                        Entry Timestamp
                                    </span>
                                    <span className="mt-1 block text-muted-foreground">
                                        {new Date(
                                            payment.created_at,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Amount breakdown */}
                            <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 p-5">
                                <span className="text-sm font-bold text-success">
                                    Total Amount Credited
                                </span>
                                <span className="text-3xl font-bold text-success">
                                    {fmtCurrency(
                                        parseFloat(payment.amount as string),
                                        symbol,
                                    )}
                                </span>
                            </div>

                            {payment.notes && (
                                <div className="pt-2">
                                    <span className="block text-xs font-medium text-muted-foreground uppercase">
                                        Notes / Comments
                                    </span>
                                    <p className="mt-1 rounded border border-border/50 bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                        {payment.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata & Associated Entities */}
                    <div className="space-y-6">
                        {/* Deceased info card */}
                        <Card className="bg-secondary/30">
                            <CardHeader className="border-b border-border px-6 py-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    Deceased Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {payment.deceased ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="block text-xs text-muted-foreground">
                                                Name
                                            </span>
                                            <Link
                                                href={`/deceased/${payment.deceased.id}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                {payment.deceased.first_name}{' '}
                                                {payment.deceased.last_name}
                                            </Link>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-muted-foreground">
                                                Date of Death
                                            </span>
                                            <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                {new Date(
                                                    payment.deceased
                                                        .date_of_death,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        No deceased record linked.
                                    </span>
                                )}
                            </CardContent>
                        </Card>

                        {/* Invoice Info */}
                        <Card>
                            <CardHeader className="border-b border-border px-6 py-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                                    Applied Invoice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {payment.invoice ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="block text-xs text-muted-foreground">
                                                Invoice Number
                                            </span>
                                            <Link
                                                href={`/invoices/${payment.invoice.id}`}
                                                className="text-sm font-semibold text-primary hover:underline"
                                            >
                                                {payment.invoice.invoice_number}
                                            </Link>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-muted-foreground">
                                                Invoice Total
                                            </span>
                                            <span className="text-sm font-semibold text-foreground">
                                                {fmtCurrency(
                                                    parseFloat(
                                                        payment.invoice
                                                            .total_amount as string,
                                                    ),
                                                    symbol,
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-muted-foreground">
                                                Invoice Status
                                            </span>
                                            <span className="mt-1 inline-flex items-center rounded-full border border-info/30 bg-info/15 px-2 py-0.5 text-xs font-bold text-info">
                                                {payment.invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <span className="inline-flex items-center rounded-full border border-info/30 bg-info/15 px-2 py-0.5 text-xs font-bold text-info">
                                            General Account Deposit
                                        </span>
                                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                            This amount was credited directly to
                                            the customer's ledger balance rather
                                            than a specific invoice.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

PaymentShow.layout = {
    breadcrumbs: [
        { title: 'Payments', href: '/payments' },
        { title: 'Details', href: '#' },
    ],
};
