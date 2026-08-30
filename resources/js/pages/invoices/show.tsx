import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeftIcon, FileTextIcon, UserIcon, CalendarIcon, DollarSignIcon, PlusIcon, ShieldCheckIcon } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    waived_amount: string | number;
    status: string;
    notes: string | null;
    created_at: string;
    invoice_items: InvoiceItem[];
    payments: Payment[];
}

interface Props {
    invoice: Invoice;
    paymentModes: PaymentMode[];
    walletBalance: number;
    can: {
        managePayments: boolean;
        manageWaivers: boolean;
    };
}

export default function InvoiceShow({ invoice, paymentModes = [], walletBalance = 0, can }: Props) {
    const symbol = useCurrency();
    const total = parseFloat(invoice.total_amount as string);
    const paid = parseFloat(invoice.paid_amount as string);
    const waived = parseFloat(invoice.waived_amount as string);
    const balance = total - paid - waived;
    const isUnsettled = invoice.status.toLowerCase() !== 'paid';

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isWalletApplying, setIsWalletApplying] = useState(false);
    const [isWaiverOpen, setIsWaiverOpen] = useState(false);
    const [isWaiverApplying, setIsWaiverApplying] = useState(false);

    const paymentForm = useForm({
        deceased_id: invoice.deceased?.id || '',
        invoice_id: invoice.id,
        payment_mode_id: '',
        amount: balance.toFixed(2),
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const waiverForm = useForm({
        deceased_id: invoice.deceased?.id || '',
        invoice_id: invoice.id,
        amount: balance > 0 ? balance.toFixed(2) : '0',
        reason: '',
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

    const handleApplyWalletToInvoice = () => {
        if (walletBalance <= 0 || balance <= 0) {
            return;
        }

        setIsWalletApplying(true);
        router.post(
            '/payments/apply-wallet-to-invoice',
            {
                deceased_id: invoice.deceased?.id || '',
                invoice_id: invoice.id,
            },
            {
                onSuccess: () => {
                    setIsWalletApplying(false);
                    setIsPaymentOpen(false);
                    paymentForm.reset();
                },
                onError: () => {
                    setIsWalletApplying(false);
                },
                preserveScroll: true,
            },
        );
    };

    const submitWaiver = (e: FormEvent) => {
        e.preventDefault();
        waiverForm.post('/waivers', {
            onSuccess: () => {
                setIsWaiverOpen(false);
                waiverForm.reset();
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
                        {isUnsettled && balance > 0 && (can?.manageWaivers !== false) && (
                            <Button size="sm" variant="destructive" onClick={() => setIsWaiverOpen(true)} className="flex items-center gap-1.5">
                                <ShieldCheckIcon className="h-4 w-4" />
                                <span>Apply Waiver</span>
                            </Button>
                        )}
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                        </span>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader className="border-b border-border px-6 py-3">
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
                                    {waived > 0 && (
                                        <div className="flex justify-between text-rose-600 dark:text-rose-400 text-xs pt-1">
                                            <span>Waived</span>
                                            <span>-{fmtCurrency(waived, symbol)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-destructive text-base border-t border-dashed border-border pt-2">
                                        <span>Outstanding Balance</span>
                                        <span>{fmtCurrency(balance, symbol)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border px-6 py-3">
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

                        <Card>
                            <CardHeader className="border-b border-border px-6 py-3">
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

                <Card>
                    <CardHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between">
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

            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment for Invoice {invoice.invoice_number}</DialogTitle>
                        <DialogDescription>
                            Apply a payment receipt to this invoice. Outstanding balance: {fmtCurrency(balance, symbol)}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
                        <div>
                            <span className="text-xs text-muted-foreground block">Total Amount Expected</span>
                            <span className="font-semibold text-foreground">
                                {fmtCurrency(total, symbol)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-muted-foreground block">Total Paid</span>
                            <span className="font-medium text-emerald-600">
                                {fmtCurrency(paid, symbol)}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
                            <span className="font-bold text-destructive text-base">
                                {fmtCurrency(balance, symbol)}
                            </span>
                        </div>
                    </div>

                    {walletBalance > 0 && balance > 0 && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                    Wallet Balance Available
                                </span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {fmtCurrency(walletBalance, symbol)}
                                </span>
                            </div>
                            <div className="mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleApplyWalletToInvoice}
                                    disabled={isWalletApplying}
                                >
                                    {isWalletApplying ? 'Applying...' : 'Apply Wallet to Invoice'}
                                </Button>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Apply {walletBalance >= balance ? 'full' : 'partial'} wallet funds ({fmtCurrency(walletBalance, symbol)}) toward the outstanding invoice balance ({fmtCurrency(balance, symbol)}).
                            </p>
                        </div>
                    )}

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
                            <Label htmlFor="amount">Amount ({symbol})</Label>
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

            <Dialog open={isWaiverOpen} onOpenChange={setIsWaiverOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply Waiver to Invoice {invoice.invoice_number}</DialogTitle>
                        <DialogDescription>
                            Waive an amount from the outstanding balance. Outstanding balance: {fmtCurrency(balance, symbol)}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
                        <div>
                            <span className="text-xs text-muted-foreground block">Total Amount Expected</span>
                            <span className="font-semibold text-foreground">
                                {fmtCurrency(total, symbol)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-muted-foreground block">Total Paid</span>
                            <span className="font-medium text-emerald-600">
                                {fmtCurrency(paid, symbol)}
                            </span>
                        </div>
                        {waived > 0 && (
                            <div className="text-right">
                                <span className="text-xs text-muted-foreground block">Already Waived</span>
                                <span className="font-medium text-rose-600">
                                    {fmtCurrency(waived, symbol)}
                                </span>
                            </div>
                        )}
                        <div className="col-span-2">
                            <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
                            <span className="font-bold text-destructive text-base">
                                {fmtCurrency(balance, symbol)}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={submitWaiver} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="waiver_amount">Waiver Amount ({symbol})</Label>
                            <Input
                                id="waiver_amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={balance}
                                value={waiverForm.data.amount}
                                onChange={(e) => waiverForm.setData('amount', e.target.value)}
                                placeholder="Enter amount to waive"
                                required
                            />
                            <InputError message={waiverForm.errors.amount} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="waiver_reason">Reason (Optional)</Label>
                            <textarea
                                id="waiver_reason"
                                value={waiverForm.data.reason}
                                onChange={(e) => waiverForm.setData('reason', e.target.value)}
                                rows={3}
                                placeholder="Provide a reason for this waiver..."
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <InputError message={waiverForm.errors.reason} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsWaiverOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={waiverForm.processing || isWaiverApplying}>
                                {waiverForm.processing || isWaiverApplying ? 'Applying...' : 'Apply Waiver'}
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
