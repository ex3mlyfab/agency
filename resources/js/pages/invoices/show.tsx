import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, FileTextIcon, UserIcon, CalendarIcon, DollarSignIcon, PlusIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCurrency, fmtCurrency } from '@/lib/currency';

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
    date_of_death: string;
}

interface User {
    name: string;
}

interface Service {
    name: string;
}

interface InvoiceItem {
    id: string;
    name: string;
    unit_price: string | number;
    quantity: number;
    total_price: string | number;
    service: Service | null;
}

interface Payment {
    id: string;
    receipt_number: string;
    amount: string | number;
    payment_method: string;
    transaction_reference: string | null;
    payment_date: string;
}

interface PaymentMode {
    id: string;
    name: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    deceased: Deceased | null;
    created_by_user: User | null;
    subtotal: string | number;
    discount: string | number;
    tax: string | number;
    total_amount: string | number;
    paid_amount: string | number;
    status: string;
    notes: string | null;
    created_at: string;
    invoice_items: InvoiceItem[];
    payments: Payment[];
}

interface Props {
    invoice: Invoice;
    paymentModes: PaymentMode[];
    can: {
        managePayments: boolean;
    };
}

export default function InvoiceShow({ invoice, paymentModes = [], can }: Props) {
    const symbol = useCurrency();
    const total = parseFloat(invoice.total_amount as string);
    const paid = parseFloat(invoice.paid_amount as string);
    const balance = total - paid;
    const isUnsettled = invoice.status.toLowerCase() !== 'paid';

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const paymentForm = useForm({
        deceased_id: invoice.deceased?.id || '',
        invoice_id: invoice.id,
        payment_mode_id: '',
        amount: balance.toFixed(2),
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const submitPayment = (e: FormEvent) => {
        e.preventDefault();
        paymentForm.post('/payments', {
            onSuccess: () => {
                setIsPaymentOpen(false);
                paymentForm.reset();
            },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            case 'partially_paid':
            case 'partially paid':
                return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
            case 'unpaid':
                return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
            default:
                return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
        }
    };

    return (
        <>
            <Head title={`Invoice ${invoice.invoice_number}`} />
            <div className="space-y-6 p-6 max-w-5xl mx-auto">
                {/* Header Action */}
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/invoices">
                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                            Back to Invoices
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        {isUnsettled && (can?.managePayments !== false) && (
                            <Button size="sm" onClick={() => setIsPaymentOpen(true)} className="flex items-center gap-1.5">
                                <PlusIcon className="h-4 w-4" />
                                <span>Record Payment</span>
                            </Button>
                        )}
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                        </span>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Invoice details */}
                    <Card className="md:col-span-2">
                        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                                    Invoice {invoice.invoice_number}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                    Created on {new Date(invoice.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Items table */}
                            <div>
                                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">
                                    Line Items
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service / Item</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.invoice_items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium text-foreground">
                                                    {item.name}
                                                    {item.service && (
                                                        <span className="block text-xs text-muted-foreground">
                                                            Category: {item.service.name}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-foreground">
                                                    {fmtCurrency(parseFloat(item.unit_price as string), symbol)}
                                                </TableCell>
                                                <TableCell className="text-center text-foreground">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-foreground">
                                                    {fmtCurrency(parseFloat(item.total_price as string), symbol)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Financial breakdown */}
                            <div className="flex justify-end">
                                <div className="w-80 space-y-2 border-t border-border pt-4 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{fmtCurrency(parseFloat(invoice.subtotal as string), symbol)}</span>
                                    </div>
                                    {parseFloat(invoice.discount as string) > 0 && (
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>Discount</span>
                                            <span>-{fmtCurrency(parseFloat(invoice.discount as string), symbol)}</span>
                                        </div>
                                    )}
                                    {parseFloat(invoice.tax as string) > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Tax</span>
                                            <span>+{fmtCurrency(parseFloat(invoice.tax as string), symbol)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold text-foreground text-base border-t border-border pt-2">
                                        <span>Total Amount</span>
                                        <span>{fmtCurrency(total, symbol)}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span>Paid to Date</span>
                                        <span>{fmtCurrency(paid, symbol)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-destructive text-base border-t border-dashed border-border pt-2">
                                        <span>Outstanding Balance</span>
                                        <span>{fmtCurrency(balance, symbol)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata & Deceased Info */}
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
                                {invoice.deceased ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Name</span>
                                            <Link
                                                href={`/deceased/${invoice.deceased.id}`}
                                                className="font-medium text-primary hover:underline text-sm"
                                            >
                                                {invoice.deceased.first_name} {invoice.deceased.last_name}
                                            </Link>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Date of Death</span>
                                            <span className="font-medium text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                                                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                {new Date(invoice.deceased.date_of_death).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No deceased record linked.</span>
                                )}
                            </CardContent>
                        </Card>

                        {/* Audit Details */}
                        <Card>
                            <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                                    Payment Meta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-3 text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Billed By</span>
                                    <span className="font-medium text-foreground">
                                        {invoice.created_by_user?.name || 'System'}
                                    </span>
                                </div>
                                {invoice.notes && (
                                    <div className="pt-2 border-t border-border">
                                        <span className="text-xs text-muted-foreground block">Notes</span>
                                        <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                            {invoice.notes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Payments History section */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-foreground">
                            Associated Payments & Transactions
                        </CardTitle>
                        {isUnsettled && (can?.managePayments !== false) && (
                            <Button size="sm" onClick={() => setIsPaymentOpen(true)} className="h-8 flex items-center gap-1">
                                <PlusIcon className="h-3.5 w-3.5" />
                                Record Payment
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {invoice.payments.length === 0 ? (
                            <p className="p-6 text-sm text-muted-foreground">
                                No payments have been recorded against this invoice yet.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Receipt #</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Transaction Reference</TableHead>
                                        <TableHead>Payment Date</TableHead>
                                        <TableHead className="text-right">Amount Paid</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-semibold text-foreground">
                                                <Link href={`/payments/${payment.id}`} className="hover:underline text-primary">
                                                    {payment.receipt_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-foreground">{payment.payment_method}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">
                                                {payment.transaction_reference || '-'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(payment.payment_date).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                {fmtCurrency(parseFloat(payment.amount as string), symbol)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Record Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment for Invoice {invoice.invoice_number}</DialogTitle>
                        <DialogDescription>
                            Apply a payment receipt to this invoice. Outstanding balance: ₦{balance.toLocaleString()}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitPayment} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="payment_mode_id">Payment Mode</Label>
                            <select
                                id="payment_mode_id"
                                value={paymentForm.data.payment_mode_id}
                                onChange={(e) => paymentForm.setData('payment_mode_id', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                            >
                                <option value="" disabled>Select payment mode</option>
                                {paymentModes.map((mode) => (
                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                ))}
                            </select>
                            <InputError message={paymentForm.errors.payment_mode_id} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="amount">Amount (₦)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={balance}
                                value={paymentForm.data.amount}
                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                placeholder="Enter amount"
                                required
                            />
                            <InputError message={paymentForm.errors.amount} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="transaction_reference">Transaction Reference (Optional)</Label>
                            <Input
                                id="transaction_reference"
                                value={paymentForm.data.transaction_reference}
                                onChange={(e) => paymentForm.setData('transaction_reference', e.target.value)}
                                placeholder="Reference or bank code"
                            />
                            <InputError message={paymentForm.errors.transaction_reference} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="payment_date">Payment Date</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={paymentForm.data.payment_date}
                                onChange={(e) => paymentForm.setData('payment_date', e.target.value)}
                                required
                            />
                            <InputError message={paymentForm.errors.payment_date} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="payment_notes">Notes (Optional)</Label>
                            <textarea
                                id="payment_notes"
                                value={paymentForm.data.notes}
                                onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                rows={2}
                                placeholder="Any additional remarks..."
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <InputError message={paymentForm.errors.notes} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={paymentForm.processing}>
                                {paymentForm.processing ? 'Recording...' : 'Record Payment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

InvoiceShow.layout = {
    breadcrumbs: [
        { title: 'Invoices', href: '/invoices' },
        { title: 'Details', href: '#' },
    ],
};
