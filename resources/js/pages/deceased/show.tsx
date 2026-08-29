import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { PencilIcon, MoveRightIcon, ShieldCheckIcon, PlusIcon, Trash2Icon, ReceiptIcon, CreditCardIcon, CalendarIcon, AlertTriangleIcon, ClockIcon } from 'lucide-react';
import { useState } from 'react';
import { InputError } from '@/components/input-error';
import { StatusChip } from '@/components/status-chip';
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

interface Transfer {
    id: number;
    event_type: string;
    transferred_at: string;
    notes: string | null;
    from_chamber: { name: string } | null;
    to_chamber: { name: string } | null;
    transferred_by_user: { name: string } | null;
}

interface Service {
    id: number;
    name: string;
}

interface InvoiceItem {
    id: string;
    invoice_id: string;
    service_id: number;
    name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    service: Service | null;
}

interface Invoice {
    id: string;
    deceased_id: number;
    invoice_number: string;
    subtotal: number;
    discount: number;
    tax: number;
    total_amount: number;
    paid_amount: number;
    status: string;
    notes: string | null;
    invoice_items?: InvoiceItem[];
}

interface Payment {
    id: string;
    receipt_number: string;
    amount: number;
    payment_method: string;
    transaction_reference: string | null;
    payment_date: string;
    notes: string | null;
    received_by_user?: { name: string } | null;
}

interface AvailableService {
    service_id: number;
    name: string;
    price: number;
    tiered_price: number | null;
    has_tiers: boolean;
}

interface Deceased {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    date_of_death: string;
    gender: string;
    cause_of_death: string | null;
    notes: string | null;
    status: 'Pending' | 'InChamber' | 'Released';
    chamber: { id: number; name: string; service_id?: string | null } | null;
    relative_name: string;
    relative_phone: string;
    relative_relationship: string;
    relative_address: string | null;
    transfers: Transfer[];
    release_code: string;
    released_to_name: string | null;
    released_to_phone: string | null;
    released_to_relationship: string | null;
    released_to_id_type: string | null;
    released_to_id_number: string | null;
    released_at: string | null;
    released_by_user: { name: string } | null;
    invoice?: Invoice | null;
    payments?: Payment[];
    days_in_storage: number;
    days_paid: number;
}

interface PaymentMode {
    id: string;
    name: string;
}

interface WalletDeposit {
    id: string;
    receipt_number: string;
    amount: number;
    payment_method: string;
    transaction_reference: string | null;
    payment_date: string;
    notes: string | null;
}

interface Props {
    deceased: Deceased;
    availableServices: AvailableService[];
    storageServiceId: string | null;
    paymentModes: PaymentMode[];
    walletDeposits: WalletDeposit[];
    walletBalance: number;
    can: { edit: boolean; delete: boolean; transfer: boolean; managePayments: boolean };
}


function Field({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="space-y-1">
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd className="text-sm text-foreground">{value ?? 'â€”'}</dd>
        </div>
    );
}

export default function DeceasedShow({ deceased, availableServices, storageServiceId, paymentModes, walletDeposits, walletBalance, can }: Props) {
    const { branding } = usePage().props as any;
    const currencySymbol = branding?.currency_symbol ?? '₦';
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isWalletApplying, setIsWalletApplying] = useState(false);

    const paymentForm = useForm({
        deceased_id: deceased.id,
        invoice_id: deceased.invoice?.id || '',
        payment_mode_id: '',
        amount: '',
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.post('/payments', {
            onSuccess: () => {
                setIsPaymentOpen(false);
                paymentForm.reset();
            },
        });
    };

    const handleApplyWalletToInvoice = () => {
        if (!deceased.invoice || walletBalance <= 0) {
            return;
        }

        setIsWalletApplying(true);
        router.post(
            '/payments/apply-wallet-to-invoice',
            {
                deceased_id: deceased.id,
                invoice_id: deceased.invoice.id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsWalletApplying(false);
                    setIsPaymentOpen(false);
                    paymentForm.reset();
                },
                onError: () => {
                    setIsWalletApplying(false);
                },
            },
        );
    };

    const isWalletMode = paymentForm.data.payment_mode_id
        ? paymentModes.find((m) => String(m.id) === String(paymentForm.data.payment_mode_id))?.name === 'Hospital Wallet'
        : false;

    const invoiceOutstanding = deceased.invoice
        ? Number(deceased.invoice.total_amount) - Number(deceased.invoice.paid_amount || 0)
        : 0;

    const { data, setData, post, processing, errors } = useForm<{
        items: { service_id: string | number; quantity: number }[];
        notes: string;
    }>({
        items: [],
        notes: '',
    });

    const openInvoiceModal = () => {
        if (deceased.invoice && deceased.invoice.invoice_items) {
            setData({
                items: deceased.invoice.invoice_items.map(item => ({
                    service_id: item.service_id,
                    quantity: item.quantity,
                })),
                notes: deceased.invoice.notes ?? '',
            });
        } else {
            setData({
                items: [{ service_id: availableServices[0]?.service_id ?? '', quantity: 1 }],
                notes: '',
            });
        }

        setIsInvoiceOpen(true);
    };

    const handleAddItem = () => {
        setData('items', [
            ...data.items,
            { service_id: availableServices[0]?.service_id ?? '', quantity: 1 },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const handleItemChange = (index: number, field: 'service_id' | 'quantity', value: any) => {
        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            [field]: value,
        };
        setData('items', newItems);
    };

    const submitInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/deceased/${deceased.id}/invoice`, {
            onSuccess: () => setIsInvoiceOpen(false),
        });
    };

    const calculatedTotal = data.items.reduce((sum, item) => {
        const service = availableServices.find(s => String(s.service_id) === String(item.service_id));

        if (!service) {
return sum;
}

        if (service.has_tiers && service.tiered_price !== null) {
            return sum + service.tiered_price;
        }

        return sum + (service.price * Number(item.quantity || 0));
    }, 0);

    const totalBilled = deceased.invoice?.total_amount || 0;
    const totalPaid = deceased.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const ledgerBalance = totalBilled - totalPaid;

    return (
        <>
            <Head title={`${deceased.first_name} ${deceased.last_name}`} />
            <div className="space-y-6 p-6">
                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                {deceased.first_name} {deceased.last_name}
                            </h1>
                            <StatusChip status={deceased.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Date of death: {(deceased.date_of_death ? new Date(deceased.date_of_death).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')}
                            {deceased.chamber &&
                                ` · Chamber: ${deceased.chamber.name}`}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        {can.edit && deceased.status !== 'Released' && (
                            <Button
                                asChild
                                className="border-none bg-success text-white hover:bg-success/90"
                            >
                                <Link href={`/deceased/${deceased.id}/release`}>
                                    <ShieldCheckIcon className="mr-2 h-4 w-4" />
                                    Release
                                </Link>
                            </Button>
                        )}
                        {can.transfer && deceased.status !== 'Released' && (
                            <Button asChild variant="secondary">
                                <Link
                                    href={`/transfers/create?deceased_id=${deceased.id}`}
                                >
                                    <MoveRightIcon className="mr-2 h-4 w-4" />
                                    Transfer
                                </Link>
                            </Button>
                        )}
                        {can.edit && (
                            <Button asChild variant="outline">
                                <Link href={`/deceased/${deceased.id}/edit`}>
                                    <PencilIcon className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Deceased info card */}
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-3">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Deceased Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 py-6">
                            <dl className="grid grid-cols-2 gap-4">
                                <Field
                                    label="First Name"
                                    value={deceased.first_name}
                                />
                                <Field
                                    label="Last Name"
                                    value={deceased.last_name}
                                />
                                <Field
                                    label="Date of Birth"
                                    value={deceased.date_of_birth ? new Date(deceased.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : null}
                                />
                                <Field
                                    label="Date of Death"
                                    value={deceased.date_of_death ? new Date(deceased.date_of_death).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : null}
                                />
                                <Field label="Gender" value={deceased.gender} />
                                <Field
                                    label="Cause of Death"
                                    value={deceased.cause_of_death}
                                />
                                <div className="col-span-2 space-y-1">
                                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Notes
                                    </dt>
                                    <dd className="text-sm text-foreground">
                                        {deceased.notes ?? 'â€”'}
                                    </dd>
                                </div>
                                <div className="col-span-2 space-y-1 rounded-md border border-border bg-secondary/10 p-3">
                                    <dt className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        <ShieldCheckIcon className="h-4 w-4 text-success" />
                                        Intake Release Code
                                    </dt>
                                    <dd className="font-mono text-sm font-semibold tracking-wide text-foreground">
                                        {deceased.release_code}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Relative info & Release card */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border px-6 py-3">
                                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Relative / Bringer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 py-6">
                                <dl className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="Name"
                                        value={deceased.relative_name}
                                    />
                                    <Field
                                        label="Relationship"
                                        value={deceased.relative_relationship}
                                    />
                                    <Field
                                        label="Phone"
                                        value={deceased.relative_phone}
                                    />
                                    <Field
                                        label="Address"
                                        value={deceased.relative_address}
                                    />
                                </dl>
                            </CardContent>
                        </Card>

                        {deceased.status === 'Released' && (
                            <Card className="border border-success/30">
                                <CardHeader className="border-b border-border bg-success/5 px-6 py-3">
                                    <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-wide text-success uppercase dark:text-success">
                                        <ShieldCheckIcon className="h-4 w-4" />
                                        Release Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-6">
                                    <dl className="grid grid-cols-2 gap-4">
                                        <Field
                                            label="Released To"
                                            value={deceased.released_to_name}
                                        />
                                        <Field
                                            label="Relationship"
                                            value={
                                                deceased.released_to_relationship
                                            }
                                        />
                                        <Field
                                            label="Phone"
                                            value={deceased.released_to_phone}
                                        />
                                        <Field
                                            label="Released At"
                                            value={deceased.released_at}
                                        />
                                        <Field
                                            label="Verified ID Type"
                                            value={deceased.released_to_id_type}
                                        />
                                        <Field
                                            label="Verified ID Number"
                                            value={
                                                deceased.released_to_id_number
                                            }
                                        />
                                        <div className="col-span-2">
                                            <Field
                                                label="Authorized By Staff"
                                                value={
                                                    deceased.released_by_user
                                                        ?.name
                                                }
                                            />
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Storage Duration & Payment Tracker */}
                <Card className="overflow-hidden border border-border">
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-primary" />
                            Storage Tracker
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        <div className="grid gap-6 md:grid-cols-3 items-center">
                            {/* Days Spent */}
                            <div className="space-y-2 rounded-lg border border-border bg-secondary/10 p-4 text-center">
                                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Days Spent in Storage
                                </div>
                                <div className="flex justify-center items-baseline gap-1 text-3xl font-bold tracking-tight text-foreground">
                                    {deceased.days_in_storage}
                                    <span className="text-sm font-medium text-muted-foreground">days</span>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    Since placement in chamber
                                </p>
                            </div>

                            {/* Days Paid */}
                            <div className="space-y-2 rounded-lg border border-border bg-secondary/10 p-4 text-center">
                                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Days Paid For
                                </div>
                                <div className="flex justify-center items-baseline gap-1 text-3xl font-bold tracking-tight text-success">
                                    {deceased.days_paid}
                                    <span className="text-sm font-medium text-muted-foreground">days</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Determined from settled invoice details
                                </p>
                            </div>

                            {/* Status & Action */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-muted-foreground">Coverage Progress</span>
                                        <span className={deceased.days_paid >= deceased.days_in_storage ? "text-success font-bold" : "text-amber-500 font-bold"}>
                                            {deceased.days_in_storage > 0 
                                                ? Math.min(100, Math.round((deceased.days_paid / deceased.days_in_storage) * 100))
                                                : 100}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className={`h-2.5 rounded-full ${
                                                deceased.days_paid >= deceased.days_in_storage 
                                                    ? 'bg-success'
                                                    : 'bg-amber-500'
                                            }`}
                                            style={{ 
                                                width: `${deceased.days_in_storage > 0 
                                                    ? Math.min(100, (deceased.days_paid / deceased.days_in_storage) * 100) 
                                                    : 100}%` 
                                            }}
                                        />
                                    </div>
                                </div>

                                {deceased.days_in_storage > deceased.days_paid ? (
                                    <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                                        <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold">Unpaid Storage:</span> {deceased.days_in_storage - deceased.days_paid} day(s) outstanding. Update the invoice to ensure full billing.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 rounded-md bg-success/10 border border-success/20 p-2.5 text-xs text-success dark:text-success">
                                        <ShieldCheckIcon className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold">Fully Covered:</span> All storage days spent are currently covered by payments.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Service Invoicing Card */}
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
                                <ReceiptIcon className="h-4 w-4" />
                                Service Billing / Invoicing
                            </CardTitle>
                            {deceased.invoice && (
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                    deceased.invoice.status === 'Paid'
                                        ? 'bg-success/10 text-success border-success/20'
                                        : deceased.invoice.status === 'Partially Paid'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                        : 'bg-destructive/10 text-destructive border-destructive/20'
                                }`}>
                                    {deceased.invoice.status}
                                </span>
                            )}
                        </CardHeader>
                        <CardContent className="px-6 py-6 space-y-6">
                            {!deceased.invoice ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        No invoice has been created for this record yet. Configure the invoice to add services and rates.
                                    </p>
                                    {can.edit && (
                                        <Button onClick={openInvoiceModal} size="sm">
                                            <PlusIcon className="mr-2 h-4 w-4" />
                                            Configure Invoice
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                                        <span className="font-mono text-muted-foreground font-semibold">
                                            Invoice #: {deceased.invoice.invoice_number}
                                        </span>
                                        {can.edit && (
                                            <Button onClick={openInvoiceModal} variant="outline" size="sm">
                                                <PencilIcon className="mr-2.5 h-3.5 w-3.5" />
                                                Edit Invoice
                                            </Button>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                                    <th className="py-2 font-semibold">Service</th>
                                                    <th className="py-2 text-right font-semibold">Rate</th>
                                                    <th className="py-2 text-center font-semibold">Qty</th>
                                                    <th className="py-2 text-right font-semibold">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deceased.invoice.invoice_items?.map((item) => (
                                                    <tr key={item.id} className="border-b border-border/50">
                                                        <td className="py-2 font-medium text-foreground">{item.name}</td>
                                                        <td className="py-2 text-right">{currencySymbol}{Number(item.unit_price).toLocaleString()}</td>
                                                        <td className="py-2 text-center">{item.quantity}</td>
                                                        <td className="py-2 text-right font-semibold">{currencySymbol}{Number(item.total_price).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {deceased.invoice.notes && (
                                        <div className="text-xs bg-secondary/20 border border-border/50 rounded-md p-3">
                                            <div className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes:</div>
                                            <p className="text-foreground">{deceased.invoice.notes}</p>
                                        </div>
                                    )}

                                    <div className="border-t border-border pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-medium text-foreground">{currencySymbol}{Number(deceased.invoice.subtotal).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Total Billed:</span>
                                            <span className="font-semibold text-foreground">{currencySymbol}{Number(deceased.invoice.total_amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Total Settled:</span>
                                            <span className="font-semibold text-success">{currencySymbol}{totalPaid.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-border/60 pt-2 text-base font-bold">
                                            <span className="text-foreground">Ledger Balance:</span>
                                            <span className={ledgerBalance > 0 ? "text-destructive" : "text-success"}>
                                                {currencySymbol}{ledgerBalance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment History Card */}
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase flex items-center gap-2">
                                <CreditCardIcon className="h-4 w-4" />
                                Payment & Settled Receipts
                            </CardTitle>
                            {(can.managePayments || can.edit) && (
                                <Button size="sm" onClick={() => setIsPaymentOpen(true)} className="h-8 flex items-center gap-1">
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Record Payment
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="px-6 py-6">
                            {!deceased.payments || deceased.payments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No payments settled on this record yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                                                    <th className="py-2 font-semibold">Receipt #</th>
                                                    <th className="py-2 font-semibold">Date</th>
                                                    <th className="py-2 font-semibold">Method</th>
                                                    <th className="py-2 font-semibold">Ref</th>
                                                    <th className="py-2 text-right font-semibold">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deceased.payments.map((payment) => (
                                                    <tr key={payment.id} className="border-b border-border/50">
                                                        <td className="py-2 font-medium text-foreground">{payment.receipt_number}</td>
                                                        <td className="py-2 text-muted-foreground">
                                                            {new Date(payment.payment_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
                                                        </td>
                                                        <td className="py-2 text-foreground">{payment.payment_method}</td>
                                                        <td className="py-2 font-mono text-xs text-muted-foreground">
                                                            {payment.transaction_reference || 'â€”'}
                                                        </td>
                                                        <td className="py-2 text-right font-semibold text-success">
                                                            {currencySymbol}{Number(payment.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="border-t border-border pt-4 flex justify-between items-center text-sm">
                                        <span className="font-semibold text-muted-foreground">Total Payments:</span>
                                        <span className="font-bold text-success text-base">
                                            {currencySymbol}{totalPaid.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Configure Invoice Dialog */}
                <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                    <DialogContent className="max-w-2xl bg-card border border-border">
                        <DialogHeader>
                            <DialogTitle>Configure Service Invoice</DialogTitle>
                            <DialogDescription>
                                Add services and quantities to generate or update the invoice. Rates correspond to the service category assigned to the deceased record.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitInvoice} className="space-y-4">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-1 border-b border-border/50">
                                    <div className="col-span-6">Service</div>
                                    <div className="col-span-2 text-right">Price</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-2 text-right">Action</div>
                                </div>

                                {data.items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No services added yet. Add a service to begin.
                                    </p>
                                ) : (
                                    data.items.map((item, index) => {
                                        const selectedService = availableServices.find(
                                            (s) => String(s.service_id) === String(item.service_id)
                                        );
                                        const isStorage = selectedService?.has_tiers === true;
                                        const price = isStorage && selectedService?.tiered_price !== null
                                            ? selectedService.tiered_price
                                            : (selectedService ? selectedService.price : 0);

                                        return (
                                            <div key={index} className="grid grid-cols-12 gap-2 items-center py-1">
                                                <div className="col-span-6">
                                                    <select
                                                        value={item.service_id}
                                                        onChange={(e) =>
                                                            handleItemChange(index, 'service_id', e.target.value)
                                                        }
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        required
                                                    >
                                                        <option value="" disabled>-- Select Service --</option>
                                                        {availableServices.map((s) => (
                                                            <option key={s.service_id} value={s.service_id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-2 text-right text-sm font-medium text-muted-foreground">
                                                    {currencySymbol}{price.toLocaleString()}
                                                </div>
                                                <div className="col-span-2">
                                                    {isStorage ? (
                                                        <Input
                                                            type="text"
                                                            readOnly
                                                            value={`${deceased.days_in_storage} days`}
                                                            className="text-center h-9 bg-secondary/30 cursor-not-allowed"
                                                        />
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    'quantity',
                                                                    Math.max(1, parseInt(e.target.value) || 1)
                                                                )
                                                            }
                                                            className="text-center h-9"
                                                            required
                                                        />
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-destructive hover:bg-destructive/10 h-9 w-9"
                                                    >
                                                        <Trash2Icon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex justify-between items-center border-t border-border pt-3">
                                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add Service Line
                                </Button>
                                <div className="text-sm font-semibold">
                                    Total Estimate: <span className="text-primary font-bold text-base">{currencySymbol}{calculatedTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes">Invoice Notes (Optional)</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Add any instructions, terms, or remarks..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.notes} />
                                {errors.items && <InputError message={errors.items} />}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsInvoiceOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing || data.items.length === 0}>
                                    {processing ? 'Saving...' : 'Save Invoice'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Record Payment Dialog */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record Payment / Deposit</DialogTitle>
                            <DialogDescription>
                                Add a payment receipt to reduce this record's outstanding ledger balance.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitPayment} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="payment_type">Apply To</Label>
                                <select
                                    id="payment_type"
                                    value={paymentForm.data.invoice_id ? 'invoice' : 'general'}
                                    onChange={(e) => {
                                        if (e.target.value === 'general') {
                                            paymentForm.setData('invoice_id', '');
                                        } else {
                                            paymentForm.setData('invoice_id', deceased.invoice?.id || '');
                                            if (invoiceOutstanding > 0) {
                                                paymentForm.setData('amount', invoiceOutstanding.toFixed(2));
                                            }
                                        }
                                    }}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    {deceased.invoice && (
                                        <option value="invoice">Invoice ({deceased.invoice.invoice_number})</option>
                                    )}
                                    <option value="general">General Account Deposit (Ledger)</option>
                                </select>
                            </div>

                            {paymentForm.data.invoice_id && deceased.invoice && (
                                <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Invoice #</span>
                                        <span className="font-mono text-foreground">{deceased.invoice.invoice_number}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground block">Total Amount Expected</span>
                                        <span className="font-semibold text-foreground">
                                            {currencySymbol}{Number(deceased.invoice.total_amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Total Paid</span>
                                        <span className="font-medium text-emerald-600">
                                            {currencySymbol}{Number(deceased.invoice.paid_amount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
                                        <span className="font-semibold text-destructive">
                                            {currencySymbol}{invoiceOutstanding.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {walletBalance > 0 && (
                                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                            Wallet Balance Available
                                        </span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">
                                            {currencySymbol}{walletBalance.toLocaleString()}
                                        </span>
                                    </div>
                                    {walletDeposits.map((deposit) => (
                                        <div key={deposit.id} className="mt-1 text-xs text-muted-foreground">
                                            Receipt {deposit.receipt_number} — {currencySymbol}{Number(deposit.amount).toLocaleString()} via {deposit.payment_method}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {walletBalance > 0 && paymentForm.data.invoice_id && deceased.invoice && invoiceOutstanding > 0 && (
                                <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">
                                            Settle invoice from wallet
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleApplyWalletToInvoice}
                                            disabled={isWalletApplying}
                                        >
                                            {isWalletApplying ? 'Applying...' : `Apply ${currencySymbol}${walletBalance.toLocaleString()}`}
                                        </Button>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Apply {walletBalance >= invoiceOutstanding ? 'full' : 'partial'} wallet funds ({currencySymbol}{walletBalance.toLocaleString()}) toward the invoice balance ({currencySymbol}{invoiceOutstanding.toLocaleString()}).
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="payment_mode_id">Payment Mode</Label>
                                <select
                                    id="payment_mode_id"
                                    value={paymentForm.data.payment_mode_id}
                                    onChange={(e) => {
                                        paymentForm.setData('payment_mode_id', e.target.value);
                                        if (isWalletMode) {
                                            paymentForm.setData('invoice_id', '');
                                        }
                                    }}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select payment mode</option>
                                    {paymentModes.map((mode) => (
                                        <option key={mode.id} value={mode.id}>{mode.name}</option>
                                    ))}
                                </select>
                                <InputError message={paymentForm.errors.payment_mode_id} />
                                {isWalletMode && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Hospital Wallet deposits are recorded as general account credit (not linked to an invoice).
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="amount">Amount ({currencySymbol})</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={paymentForm.data.invoice_id ? invoiceOutstanding : undefined}
                                    value={paymentForm.data.amount}
                                    onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                    placeholder={paymentForm.data.invoice_id ? `Outstanding balance: ${invoiceOutstanding.toFixed(2)}` : 'Enter amount'}
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

                {/* Transfer / audit history */}
                <Card>
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Chamber History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        {deceased.transfers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No transfer events recorded yet.
                            </p>
                        ) : (
                            <ol className="relative space-y-6 border-l border-border pl-6">
                                {deceased.transfers.map((t) => (
                                    <li key={t.id} className="relative">
                                        <span className="absolute top-0.5 -left-[1.5rem] flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card" />
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusChip status={t.event_type} />
                                            <span className="text-xs text-muted-foreground">
                                                {t.transferred_at}
                                            </span>
                                            {t.transferred_by_user && (
                                                <span className="text-xs text-muted-foreground">
                                                    Â· by{' '}
                                                    {t.transferred_by_user.name}
                                                </span>
                                            )}
                                        </div>
                                        {(t.from_chamber || t.to_chamber) && (
                                            <p className="mt-1 text-sm text-foreground">
                                                {t.from_chamber?.name ?? 'â€”'}
                                                {' â†’ '}
                                                {t.to_chamber?.name ??
                                                    'Released'}
                                            </p>
                                        )}
                                        {t.notes && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t.notes}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

DeceasedShow.layout = {
    breadcrumbs: [
        { title: 'Deceased', href: '/deceased' },
        { title: 'Record', href: '#' },
    ],
};
