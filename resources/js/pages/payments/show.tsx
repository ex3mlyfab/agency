import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, CreditCardIcon, UserIcon, CalendarIcon, FileTextIcon } from 'lucide-react';
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
            <div className="space-y-6 p-6 max-w-4xl mx-auto">
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
                        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                                    Receipt {payment.receipt_number}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    Processed on {new Date(payment.payment_date).toLocaleString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Receipt Summary Table */}
                            <div className="grid grid-cols-2 gap-4 border-b border-border pb-6 text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">Payment Method</span>
                                    <span className="font-semibold text-foreground mt-1 block">
                                        {payment.payment_method}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">Transaction Reference</span>
                                    <span className="font-mono font-medium text-foreground mt-1 block">
                                        {payment.transaction_reference || 'N/A'}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">Received By</span>
                                    <span className="font-medium text-foreground mt-1 block">
                                        {payment.received_by_user?.name || 'System'}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">Entry Timestamp</span>
                                    <span className="text-muted-foreground mt-1 block">
                                        {new Date(payment.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Amount breakdown */}
                            <div className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-5">
                                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                    Total Amount Credited
                                </span>
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {fmtCurrency(parseFloat(payment.amount as string), symbol)}
                                </span>
                            </div>

                            {payment.notes && (
                                <div className="pt-2">
                                    <span className="text-xs text-muted-foreground block uppercase font-medium">Notes / Comments</span>
                                    <p className="mt-1 text-sm text-muted-foreground bg-muted/40 rounded p-3 whitespace-pre-line leading-relaxed border border-border/50">
                                        {payment.notes}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata & Associated Entities */}
                    <div className="space-y-6">
                        {/* Deceased info card */}
                        <Card>
                            <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    Deceased Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {payment.deceased ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Name</span>
                                            <Link
                                                href={`/deceased/${payment.deceased.id}`}
                                                className="font-medium text-primary hover:underline text-sm"
                                            >
                                                {payment.deceased.first_name} {payment.deceased.last_name}
                                            </Link>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Date of Death</span>
                                            <span className="font-medium text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                {new Date(payment.deceased.date_of_death).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No deceased record linked.</span>
                                )}
                            </CardContent>
                        </Card>

                        {/* Invoice Info */}
                        <Card>
                            <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                                    Applied Invoice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {payment.invoice ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Invoice Number</span>
                                            <Link
                                                href={`/invoices/${payment.invoice.id}`}
                                                className="font-semibold text-primary hover:underline text-sm"
                                            >
                                                {payment.invoice.invoice_number}
                                            </Link>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Invoice Total</span>
                                            <span className="font-semibold text-foreground text-sm">
                                            {fmtCurrency(parseFloat(payment.invoice.total_amount as string), symbol)}
                                        </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Invoice Status</span>
                                            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20 mt-1">
                                                {payment.invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20">
                                            General Account Deposit
                                        </span>
                                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                            This amount was credited directly to the customer's ledger balance rather than a specific invoice.
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
