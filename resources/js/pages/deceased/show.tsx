import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import {
    PencilIcon,
    MoveRightIcon,
    ShieldCheckIcon,
    PlusIcon,
    Trash2Icon,
    ReceiptIcon,
    CreditCardIcon,
    CalendarIcon,
    AlertTriangleIcon,
    ClockIcon,
    FileTextIcon,
    EyeIcon,
    PrinterIcon,
} from 'lucide-react';
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
    waived_amount: number;
    status: string;
    billing_type?: string | null;
    period_start_date?: string | null;
    notes: string | null;
    invoice_items?: InvoiceItem[];
}

interface StorageFeeLog {
    id: string;
    invoice_id: string | null;
    days_billed: number;
    days_covered_from: number;
    days_covered_to: number;
    amount: number;
    paid_days_at_creation: number;
    created_by_user?: { name: string } | null;
    invoice?: Invoice | null;
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
    invoices?: Invoice[];
    storage_fee_logs?: StorageFeeLog[];
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
    currentAdmissionStorageLogs: StorageFeeLog[];
    paymentModes: PaymentMode[];
    walletDeposits: WalletDeposit[];
    walletBalance: number;
    can: {
        edit: boolean;
        delete: boolean;
        transfer: boolean;
        managePayments: boolean;
        manageWaivers: boolean;
        createStorageInvoice: boolean;
    };
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
            <dd className="text-sm text-foreground">{value ?? 'N/A'}</dd>
        </div>
    );
}

export default function DeceasedShow({
    deceased,
    availableServices,
    currentAdmissionStorageLogs,
    paymentModes,
    walletDeposits,
    walletBalance,
    can,
}: Props) {
    const { branding } = usePage().props as any;
    const currencySymbol = branding?.currency_symbol ?? '?';

    const firstUnpaidServiceInvoice = deceased.invoices?.find((inv) =>
        ['Unpaid', 'Partially Paid'].includes(inv.status),
    );
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isWaiverOpen, setIsWaiverOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isWalletApplying, setIsWalletApplying] = useState(false);
    const [isStorageInvoiceGenerating, setIsStorageInvoiceGenerating] =
        useState(false);

    const paymentForm = useForm({
        deceased_id: deceased.id,
        invoice_id: firstUnpaidServiceInvoice?.id || '',
        payment_mode_id: '',
        amount: '',
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const serviceInvoicesTotal =
        deceased.invoices?.reduce(
            (sum, inv) => sum + Number(inv.total_amount),
            0,
        ) || 0;
    // Storage lines are scoped to the current admission; service invoices are
    // lifetime (account-level).
    const storageInvoicesTotal = currentAdmissionStorageLogs.reduce(
        (sum, log) => sum + Number(log.invoice?.total_amount || 0),
        0,
    );
    const totalPaid =
        deceased.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const totalWaived =
        (deceased.invoices?.reduce(
            (sum, inv) => sum + Number(inv.waived_amount || 0),
            0,
        ) || 0) +
        currentAdmissionStorageLogs.reduce(
            (sum, log) => sum + Number(log.invoice?.waived_amount || 0),
            0,
        );
    const totalBilled = serviceInvoicesTotal + storageInvoicesTotal;
    const ledgerBalance = totalBilled - totalPaid - totalWaived;

    const invoiceOutstanding =
        serviceInvoicesTotal + storageInvoicesTotal - totalPaid - totalWaived;

    const outstandingInvoices = [
        ...(deceased.invoices ?? []).filter((inv) =>
            ['Unpaid', 'Partially Paid'].includes(inv.status),
        ),
        ...currentAdmissionStorageLogs
            .map((log) => log.invoice)
            .filter((invoice): invoice is Invoice =>
                Boolean(
                    invoice &&
                    ['Unpaid', 'Partially Paid'].includes(invoice.status),
                ),
            ),
    ];
    // De-duplicate (a storage log and its invoice share the same id).
    const unpaidInvoices = outstandingInvoices.filter(
        (inv, idx, arr) => arr.findIndex((o) => o.id === inv.id) === idx,
    );
    const invoiceOutstandingFor = (inv: Invoice) =>
        Math.max(
            0,
            Number(inv.total_amount) -
                Number(inv.paid_amount) -
                Number(inv.waived_amount),
        );
    const selectedUnpaidInvoice = unpaidInvoices.find(
        (inv) =>
            String(inv.id) === String(paymentForm.data.invoice_id ?? ''),
    );
    const selectedInvoiceOutstanding = selectedUnpaidInvoice
        ? invoiceOutstandingFor(selectedUnpaidInvoice)
        : 0;
    const firstOutstandingInvoice = unpaidInvoices[0];
    const firstOutstandingBalance = firstOutstandingInvoice
        ? invoiceOutstandingFor(firstOutstandingInvoice)
        : 0;

    const waiverForm = useForm({
        deceased_id: deceased.id,
        invoice_id: firstOutstandingInvoice?.id || '',
        amount: invoiceOutstanding > 0 ? invoiceOutstanding.toFixed(2) : '0',
        reason: '',
    });

    const isWalletMode = paymentForm.data.payment_mode_id
        ? paymentModes.find(
              (m) => String(m.id) === String(paymentForm.data.payment_mode_id),
          )?.name === 'Hospital Wallet'
        : false;

    const { data, setData, post, processing, errors } = useForm<{
        items: { service_id: string | number; quantity: number }[];
        notes: string;
    }>({
        items: [],
        notes: '',
    });

    const submitWaiver = (e: React.FormEvent) => {
        e.preventDefault();
        waiverForm.post('/waivers', {
            onSuccess: () => {
                setIsWaiverOpen(false);
                waiverForm.reset();
            },
        });
    };

    const submitGenerateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/deceased/${deceased.id}/generate-invoice`, data, {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Generate invoice errors:', errors);
            },
            onSuccess: () => {
                setIsGenerateOpen(false);
                setData({
                    items: [
                        {
                            service_id: availableServices[0]?.service_id ?? '',
                            quantity: 1,
                        },
                    ],
                    notes: '',
                });
            },
        });
    };

    const openCreateInvoiceModal = () => {
        setData({
            items: [
                {
                    service_id: availableServices[0]?.service_id ?? '',
                    quantity: 1,
                },
            ],
            notes: '',
        });
        setIsGenerateOpen(true);
    };

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
        const targetInvoice = outstandingInvoices[0];

        if (!targetInvoice || walletBalance <= 0) {
            return;
        }

        setIsWalletApplying(true);
        router.post(
            '/payments/apply-wallet-to-invoice',
            {
                deceased_id: deceased.id,
                invoice_id: targetInvoice.id,
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

    const openInvoiceModal = () => {
        if (deceased.invoices?.[0] && deceased.invoices[0].invoice_items) {
            setData({
                items: deceased.invoices[0].invoice_items.map((item) => ({
                    service_id: item.service_id,
                    quantity: item.quantity,
                })),
                notes: deceased.invoices[0].notes ?? '',
            });
        } else {
            setData({
                items: [
                    {
                        service_id: availableServices[0]?.service_id ?? '',
                        quantity: 1,
                    },
                ],
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

    const handleItemChange = (
        index: number,
        field: 'service_id' | 'quantity',
        value: any,
    ) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const submitInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/deceased/${deceased.id}/invoice`, {
            onSuccess: () => setIsInvoiceOpen(false),
        });
    };

    const rowLineTotal = (
        service: AvailableService | undefined,
        quantity: number,
    ) => (service ? service.price * (Number(quantity) || 0) : 0);

    const calculatedTotal = data.items.reduce((sum, item) => {
        const service = availableServices.find(
            (s) => String(s.service_id) === String(item.service_id),
        );

        return sum + rowLineTotal(service, item.quantity);
    }, 0);

    const hasStorageInvoice = currentAdmissionStorageLogs.length > 0;
    const hasUncoveredStorageDays =
        deceased.days_in_storage > deceased.days_paid;
    const storageFullyPaid =
        deceased.days_in_storage > 0 &&
        deceased.days_paid >= deceased.days_in_storage;

    // True when any invoice (service or storage) is paid or partially paid - blocks all editing
    const hasPaidOrPartiallyPaidInvoice = (() => {
        if (deceased.invoices) {
            for (const inv of deceased.invoices) {
                if (['Paid', 'Partially Paid'].includes(inv.status)) {
                    return true;
                }
            }
        }

        for (const log of currentAdmissionStorageLogs) {
            if (
                log.invoice &&
                ['Paid', 'Partially Paid'].includes(log.invoice.status)
            ) {
                return true;
            }
        }

        return false;
    })();

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
                            Date of death:{' '}
                            {deceased.date_of_death
                                ? new Date(
                                      deceased.date_of_death,
                                  ).toLocaleString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : 'N/A'}
                            {deceased.chamber &&
                                ` - Chamber: ${deceased.chamber.name}`}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <div className="grid gap-2 lg:grid-cols-3">
                            {can.edit && deceased.status !== 'Released' && (
                                <Button
                                    asChild
                                    className="border-2 border-success bg-success text-success-foreground hover:brightness-110"
                                >
                                    <Link
                                        href={`/deceased/${deceased.id}/release`}
                                    >
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
                                    <Link
                                        href={`/deceased/${deceased.id}/edit`}
                                    >
                                        <PencilIcon className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <Link href={`/deceased/${deceased.id}/print`}>
                                    <PrinterIcon className="mr-2 h-4 w-4" />
                                    Print
                                </Link>
                            </Button>

                            {/* Service invoice creation is available until the record is released. */}
                            {can.edit && deceased.status !== 'Released' && (
                                <Button
                                    onClick={openCreateInvoiceModal}
                                    variant="default"
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Create Invoice
                                </Button>
                            )}

                            {/* Storage Invoice button - always show when InChamber and user has permission */}
                            {can.createStorageInvoice &&
                                deceased.status === 'InChamber' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            storageFullyPaid ||
                                            isStorageInvoiceGenerating
                                        }
                                        onClick={() => {
                                            setIsStorageInvoiceGenerating(true);
                                            router.post(
                                                `/deceased/${deceased.id}/storage-invoice`,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setIsStorageInvoiceGenerating(
                                                            false,
                                                        ),
                                                    onError: () =>
                                                        setIsStorageInvoiceGenerating(
                                                            false,
                                                        ),
                                                },
                                            );
                                        }}
                                    >
                                        <FileTextIcon className="mr-2 h-4 w-4" />
                                        {isStorageInvoiceGenerating
                                            ? 'Generating...'
                                            : hasStorageInvoice &&
                                                hasUncoveredStorageDays
                                              ? 'Generate Next Storage Invoice'
                                              : hasStorageInvoice
                                                ? 'Storage Fully Covered'
                                                : 'Generate Storage Invoice'}
                                    </Button>
                                )}
                        </div>
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
                                    value={
                                        deceased.date_of_birth
                                            ? new Date(
                                                  deceased.date_of_birth,
                                              ).toLocaleDateString(undefined, {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: '2-digit',
                                              })
                                            : null
                                    }
                                />
                                <Field
                                    label="Date of Death"
                                    value={
                                        deceased.date_of_death
                                            ? new Date(
                                                  deceased.date_of_death,
                                              ).toLocaleString(undefined, {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: '2-digit',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : null
                                    }
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
                                        {deceased.notes ?? 'N/A'}
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
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            <ClockIcon className="h-4 w-4 text-primary" />
                            Storage Fee Tracker
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        <div className="grid items-center gap-6 md:grid-cols-3">
                            {/* Days Spent */}
                            <div className="space-y-2 rounded-lg border border-border bg-secondary/10 p-4 text-center">
                                <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Days Spent in Storage
                                </div>
                                <div className="flex items-baseline justify-center gap-1 text-3xl font-bold tracking-tight text-foreground">
                                    {deceased.days_in_storage}
                                    <span className="text-sm font-medium text-muted-foreground">
                                        days
                                    </span>
                                </div>
                                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3" />
                                    Since placement in chamber
                                </p>
                            </div>

                            {/* Days Paid */}
                            <div className="space-y-2 rounded-lg border border-border bg-secondary/10 p-4 text-center">
                                <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Days Paid For
                                </div>
                                <div className="flex items-baseline justify-center gap-1 text-3xl font-bold tracking-tight text-success">
                                    {deceased.days_paid}
                                    <span className="text-sm font-medium text-muted-foreground">
                                        days
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    From settled storage invoices
                                </p>
                            </div>

                            {/* Status & Action */}
                            <div className="space-y-3">
                                <div>
                                    <div className="mb-1 flex justify-between text-xs font-semibold">
                                        <span className="text-muted-foreground">
                                            Coverage Progress
                                        </span>
                                        <span
                                            className={
                                                deceased.days_paid >=
                                                deceased.days_in_storage
                                                    ? 'font-bold text-success'
                                                    : 'font-bold text-warning'
                                            }
                                        >
                                            {deceased.days_in_storage > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (deceased.days_paid /
                                                              deceased.days_in_storage) *
                                                              100,
                                                      ),
                                                  )
                                                : 100}
                                            %
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className={`h-2.5 rounded-full ${
                                                deceased.days_paid >=
                                                deceased.days_in_storage
                                                    ? 'bg-success'
                                                    : 'bg-warning'
                                            }`}
                                            style={{
                                                width: `${
                                                    deceased.days_in_storage > 0
                                                        ? Math.min(
                                                              100,
                                                              (deceased.days_paid /
                                                                  deceased.days_in_storage) *
                                                                  100,
                                                          )
                                                        : 100
                                                }%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {deceased.status === 'InChamber' &&
                                deceased.days_in_storage >
                                    deceased.days_paid ? (
                                    <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-foreground">
                                        <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                                        <div>
                                            <span className="font-semibold">
                                                Unpaid Storage:
                                            </span>{' '}
                                            {deceased.days_in_storage -
                                                deceased.days_paid}{' '}
                                            day(s) outstanding.{' '}
                                            {!hasStorageInvoice
                                                ? 'Generate a storage invoice to begin billing.'
                                                : 'A new storage invoice will be generated automatically when the current one is paid.'}
                                        </div>
                                    </div>
                                ) : deceased.days_in_storage > 0 &&
                                  deceased.days_paid >=
                                      deceased.days_in_storage ? (
                                    <div className="flex items-start gap-2 rounded-md border border-success/20 bg-success/10 p-2.5 text-xs text-success dark:text-success">
                                        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>
                                            <span className="font-semibold">
                                                Fully Covered:
                                            </span>{' '}
                                            All storage days are paid.
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Service Invoicing Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                <ReceiptIcon className="h-4 w-4" />
                                Service Invoices
                            </CardTitle>
                            <div className="flex gap-2">
                                {can.edit &&
                                    deceased.status !== 'Released' &&
                                    !hasPaidOrPartiallyPaidInvoice && (
                                        <Button
                                            onClick={openInvoiceModal}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <PencilIcon className="mr-1.5 h-3.5 w-3.5" />
                                            Edit Latest
                                        </Button>
                                    )}
                                {can.edit && deceased.status !== 'Released' && (
                                    <Button
                                        onClick={openCreateInvoiceModal}
                                        size="sm"
                                    >
                                        <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                                        Create Invoice
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 py-6">
                            {deceased.invoices &&
                            deceased.invoices.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        No service invoices have been created
                                        for this record yet.
                                    </p>
                                    {can.edit &&
                                        deceased.status !== 'Released' && (
                                            <Button
                                                onClick={openCreateInvoiceModal}
                                                size="sm"
                                            >
                                                <PlusIcon className="mr-2 h-4 w-4" />
                                                Create Invoice
                                            </Button>
                                        )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {deceased.invoices?.map((inv) => (
                                        <div
                                            key={inv.id}
                                            className="space-y-2 rounded-md border border-border bg-secondary/5 p-3"
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-mono font-semibold text-muted-foreground">
                                                    {inv.invoice_number}
                                                </span>
                                                <span
                                                    className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${
                                                        inv.status === 'Paid'
                                                            ? 'border-success/20 bg-success/10 text-success'
                                                            : inv.status ===
                                                                'Partially Paid'
                                                              ? 'border-warning/30 bg-warning/15 text-warning'
                                                              : 'border-destructive/20 bg-destructive/10 text-destructive'
                                                    }`}
                                                >
                                                    {inv.status}
                                                </span>
                                            </div>
                                            {inv.invoice_items &&
                                                inv.invoice_items.length >
                                                    0 && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs">
                                                            <thead>
                                                                <tr className="tracking-wider text-muted-foreground uppercase">
                                                                    <th className="py-1 font-semibold">
                                                                        Service
                                                                    </th>
                                                                    <th className="py-1 text-right font-semibold">
                                                                        Rate
                                                                    </th>
                                                                    <th className="py-1 text-center font-semibold">
                                                                        Qty
                                                                    </th>
                                                                    <th className="py-1 text-right font-semibold">
                                                                        Total
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {inv.invoice_items
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            item,
                                                                        ) => (
                                                                            <tr
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className="border-t border-border/50"
                                                                            >
                                                                                <td className="py-1 font-medium text-foreground">
                                                                                    {
                                                                                        item.name
                                                                                    }
                                                                                </td>
                                                                                <td className="py-1 text-right text-muted-foreground">
                                                                                    {
                                                                                        currencySymbol
                                                                                    }
                                                                                    {Number(
                                                                                        item.unit_price,
                                                                                    ).toLocaleString()}
                                                                                </td>
                                                                                <td className="py-1 text-center text-muted-foreground">
                                                                                    {
                                                                                        item.quantity
                                                                                    }
                                                                                </td>
                                                                                <td className="py-1 text-right font-medium text-foreground">
                                                                                    {
                                                                                        currencySymbol
                                                                                    }
                                                                                    {Number(
                                                                                        item.total_price,
                                                                                    ).toLocaleString()}
                                                                                </td>
                                                                            </tr>
                                                                        ),
                                                                    )}
                                                            </tbody>
                                                        </table>
                                                        {inv.invoice_items
                                                            .length > 3 && (
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                +
                                                                {inv
                                                                    .invoice_items
                                                                    .length -
                                                                    3}{' '}
                                                                more items
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            {inv.notes && (
                                                <p className="text-xs text-muted-foreground">
                                                    {inv.notes}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-sm">
                                                <div className="flex gap-1">
                                                    <Link
                                                        href={`/invoices/${inv.id}`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                        >
                                                            <EyeIcon className="mr-1.5 h-3 w-3" />
                                                            View Invoice
                                                        </Button>
                                                    </Link>
                                                    <Link
                                                        href={`/invoices/${inv.id}/print`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                        >
                                                            <PrinterIcon className="mr-1.5 h-3 w-3" />
                                                            Print
                                                        </Button>
                                                    </Link>
                                                </div>
                                                <span className="font-semibold text-foreground">
                                                    {currencySymbol}
                                                    {Number(
                                                        inv.total_amount,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Summary */}
                                    <div className="space-y-1.5 border-t border-border pt-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Service Invoices Billed:
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {currencySymbol}
                                                {serviceInvoicesTotal.toLocaleString()}
                                            </span>
                                        </div>
                                        {hasStorageInvoice && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Storage Invoices Billed:
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {currencySymbol}
                                                    {storageInvoicesTotal.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Total Settled:
                                            </span>
                                            <span className="font-semibold text-success">
                                                {currencySymbol}
                                                {totalPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        {totalWaived > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Total Waived:
                                                </span>
                                                <span className="font-semibold text-destructive">
                                                    -{currencySymbol}
                                                    {Number(
                                                        totalWaived,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-border pt-1.5 text-base font-bold">
                                            <span className="text-foreground">
                                                Ledger Balance:
                                            </span>
                                            <span
                                                className={
                                                    ledgerBalance > 0
                                                        ? 'text-destructive'
                                                        : 'text-success'
                                                }
                                            >
                                                {currencySymbol}
                                                {ledgerBalance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment History Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                <CreditCardIcon className="h-4 w-4" />
                                Payment & Settled Receipts
                            </CardTitle>
                            <div className="flex gap-2">
                                {firstOutstandingInvoice &&
                                    invoiceOutstanding > 0 &&
                                    can.manageWaivers &&
                                    !hasPaidOrPartiallyPaidInvoice && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                setIsWaiverOpen(true)
                                            }
                                            className="flex h-8 items-center gap-1"
                                        >
                                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                                            Apply Waiver
                                        </Button>
                                    )}
                                {(can.managePayments || can.edit) && (
                                    <Button
                                        size="sm"
                                        onClick={() => setIsPaymentOpen(true)}
                                        className="flex h-8 items-center gap-1"
                                    >
                                        <PlusIcon className="h-3.5 w-3.5" />
                                        Record Payment
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-6">
                            {!deceased.payments ||
                            deceased.payments.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No payments settled on this record yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-border text-xs tracking-wider text-muted-foreground uppercase">
                                                    <th className="py-2 font-semibold">
                                                        Receipt #
                                                    </th>
                                                    <th className="py-2 font-semibold">
                                                        Date
                                                    </th>
                                                    <th className="py-2 font-semibold">
                                                        Method
                                                    </th>
                                                    <th className="py-2 font-semibold">
                                                        Ref
                                                    </th>
                                                    <th className="py-2 text-right font-semibold">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deceased.payments.map(
                                                    (payment) => (
                                                        <tr
                                                            key={payment.id}
                                                            className="border-b border-border/50"
                                                        >
                                                            <td className="py-2 font-medium text-foreground">
                                                                {
                                                                    payment.receipt_number
                                                                }
                                                            </td>
                                                            <td className="py-2 text-muted-foreground">
                                                                {new Date(
                                                                    payment.payment_date,
                                                                ).toLocaleDateString(
                                                                    undefined,
                                                                    {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: '2-digit',
                                                                    },
                                                                )}
                                                            </td>
                                                            <td className="py-2 text-foreground">
                                                                {
                                                                    payment.payment_method
                                                                }
                                                            </td>
                                                            <td className="py-2 font-mono text-xs text-muted-foreground">
                                                                {payment.transaction_reference ||
                                                                    'N/A'}
                                                            </td>
                                                            <td className="py-2 text-right font-semibold text-success">
                                                                {currencySymbol}
                                                                {Number(
                                                                    payment.amount,
                                                                ).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="space-y-2 border-t border-border pt-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold text-muted-foreground">
                                                Total Payments:
                                            </span>
                                            <span className="text-base font-bold text-success">
                                                {currencySymbol}
                                                {totalPaid.toLocaleString()}
                                            </span>
                                        </div>
                                        {totalWaived > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-muted-foreground">
                                                    Total Waived:
                                                </span>
                                                <span className="text-base font-bold text-destructive">
                                                    -{currencySymbol}
                                                    {Number(
                                                        totalWaived,
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                                            <span className="text-foreground">
                                                Ledger Balance:
                                            </span>
                                            <span
                                                className={
                                                    ledgerBalance > 0
                                                        ? 'text-destructive'
                                                        : 'text-success'
                                                }
                                            >
                                                {currencySymbol}
                                                {ledgerBalance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Storage Fee Invoices Card */}
                {can.createStorageInvoice &&
                    deceased.storage_fee_logs &&
                    deceased.storage_fee_logs.length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    <FileTextIcon className="h-4 w-4" />
                                    Storage Fee Invoices
                                </CardTitle>
                                {can.createStorageInvoice &&
                                    deceased.status === 'InChamber' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                storageFullyPaid ||
                                                isStorageInvoiceGenerating
                                            }
                                            onClick={() => {
                                                setIsStorageInvoiceGenerating(
                                                    true,
                                                );
                                                router.post(
                                                    `/deceased/${deceased.id}/storage-invoice`,
                                                    {},
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () =>
                                                            setIsStorageInvoiceGenerating(
                                                                false,
                                                            ),
                                                        onError: () =>
                                                            setIsStorageInvoiceGenerating(
                                                                false,
                                                            ),
                                                    },
                                                );
                                            }}
                                        >
                                            <PlusIcon className="mr-2 h-3.5 w-3.5" />
                                            {isStorageInvoiceGenerating
                                                ? 'Generating...'
                                                : storageFullyPaid
                                                  ? 'All Covered'
                                                  : 'Generate Next'}
                                        </Button>
                                    )}
                            </CardHeader>
                            <CardContent className="px-6 py-6">
                                <div className="space-y-3">
                                    {deceased.storage_fee_logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between rounded-md border border-border bg-secondary/10 p-3"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {log.invoice ? (
                                                        <Link
                                                            href={`/invoices/${log.invoice.id}`}
                                                        >
                                                            <span className="cursor-pointer font-mono text-xs font-semibold text-primary hover:underline">
                                                                {
                                                                    log.invoice
                                                                        .invoice_number
                                                                }
                                                            </span>
                                                        </Link>
                                                    ) : (
                                                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                                                            N/A
                                                        </span>
                                                    )}
                                                    {log.invoice && (
                                                        <span
                                                            className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${
                                                                log.invoice
                                                                    .status ===
                                                                'Paid'
                                                                    ? 'border-success/20 bg-success/10 text-success'
                                                                    : log
                                                                            .invoice
                                                                            .status ===
                                                                        'Partially Paid'
                                                                      ? 'border border-warning/30 bg-warning/15 text-warning'
                                                                      : 'border-destructive/20 bg-destructive/10 text-destructive'
                                                            }`}
                                                        >
                                                            {log.invoice.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Days {log.days_covered_from}
                                                    -{log.days_covered_to} -
                                                    Billed: {log.days_billed}{' '}
                                                    day(s)
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-foreground">
                                                    {currencySymbol}
                                                    {Number(
                                                        log.amount,
                                                    ).toLocaleString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Paid days at creation:{' '}
                                                    {log.paid_days_at_creation}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* Configure Service Invoice Dialog */}
                <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                    <DialogContent className="max-w-2xl border border-border bg-card">
                        <DialogHeader>
                            <DialogTitle>Configure Service Invoice</DialogTitle>
                            <DialogDescription>
                                Add service line items to create or update the
                                invoice. Storage fees are billed separately via
                                the Storage Fee Tracker below.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitInvoice} className="space-y-4">
                            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                                <div className="grid grid-cols-12 gap-2 border-b border-border/50 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    <div className="col-span-6">Service</div>
                                    <div className="col-span-2 text-right">
                                        Price
                                    </div>
                                    <div className="col-span-2 text-center">
                                        Qty
                                    </div>
                                    <div className="col-span-2 text-right">
                                        Action
                                    </div>
                                </div>

                                {data.items.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        No services added yet. Add a service to
                                        begin.
                                    </p>
                                ) : (
                                    data.items.map((item, index) => {
                                        const selectedService =
                                            availableServices.find(
                                                (s) =>
                                                    String(s.service_id) ===
                                                    String(item.service_id),
                                            );
                                        const price =
                                            selectedService?.price ?? 0;
                                        const lineTotal = rowLineTotal(
                                            selectedService,
                                            item.quantity,
                                        );

                                        return (
                                            <div
                                                key={index}
                                                className="grid grid-cols-12 items-center gap-2 py-1"
                                            >
                                                <div className="col-span-6">
                                                    <select
                                                        value={item.service_id}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                'service_id',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                        required
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                        >
                                                            -- Select Service --
                                                        </option>
                                                        {availableServices.map(
                                                            (s) => (
                                                                <option
                                                                    key={
                                                                        s.service_id
                                                                    }
                                                                    value={
                                                                        s.service_id
                                                                    }
                                                                >
                                                                    {s.name}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="col-span-2 text-right text-sm font-medium text-muted-foreground">
                                                    {currencySymbol}
                                                    {price.toLocaleString()}
                                                    <span className="block text-xs text-muted-foreground">
                                                        ×{Number(item.quantity) ||
                                                            0} ={' '}
                                                        {currencySymbol}
                                                        {lineTotal.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="col-span-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                'quantity',
                                                                Math.max(
                                                                    1,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                ),
                                                            )
                                                        }
                                                        className="h-9 text-center"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleRemoveItem(
                                                                index,
                                                            )
                                                        }
                                                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2Icon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddItem}
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add Service Line
                                </Button>
                                <div className="text-sm font-semibold">
                                    Total Estimate:{' '}
                                    <span className="text-base font-bold text-primary">
                                        {currencySymbol}
                                        {calculatedTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="notes">
                                    Invoice Notes (Optional)
                                </Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Add any instructions, terms, or remarks..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.notes} />
                                {errors.items && (
                                    <InputError message={errors.items} />
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsInvoiceOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || data.items.length === 0
                                    }
                                >
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
                                Add a payment receipt to reduce this record's
                                outstanding ledger balance.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitPayment} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="payment_type">Apply To</Label>
                                <select
                                    id="payment_type"
                                    value={
                                        paymentForm.data.invoice_id || 'general'
                                    }
                                    onChange={(e) => {
                                        const selectedId = e.target.value;

                                        if (selectedId === 'general') {
                                            paymentForm.setData(
                                                'invoice_id',
                                                '',
                                            );
                                            paymentForm.setData('amount', '');
                                        } else {
                                            paymentForm.setData(
                                                'invoice_id',
                                                selectedId,
                                            );
                                            const targetInvoice =
                                                unpaidInvoices.find(
                                                    (inv) =>
                                                        String(inv.id) ===
                                                        selectedId,
                                                );
                                            const expected = targetInvoice
                                                ? invoiceOutstandingFor(
                                                      targetInvoice,
                                                  )
                                                : 0;
                                            paymentForm.setData(
                                                'amount',
                                                expected
                                                    ? expected.toFixed(2)
                                                    : '',
                                            );
                                        }
                                    }}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    {unpaidInvoices.map((inv) => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.billing_type === 'storage'
                                                ? 'Storage'
                                                : 'Service'}{' '}
                                            Invoice ({inv.invoice_number}) - {inv.status} -{' '}
                                            {currencySymbol}
                                            {invoiceOutstandingFor(
                                                inv,
                                            ).toLocaleString()}{' '}
                                            outstanding
                                        </option>
                                    ))}
                                    <option value="general">
                                        General Account Deposit (Ledger)
                                    </option>
                                </select>
                                {unpaidInvoices.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        No unpaid invoices. Select "General
                                        Account Deposit" to record a ledger
                                        credit.
                                    </p>
                                )}
                            </div>

                            {selectedUnpaidInvoice && (
                                <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
                                    <div>
                                        <span className="block text-xs text-muted-foreground">
                                            Invoice #
                                        </span>
                                        <span className="font-mono text-foreground">
                                            {selectedUnpaidInvoice.invoice_number}{' '}
                                            ({selectedUnpaidInvoice.billing_type ===
                                            'storage'
                                                ? 'Storage'
                                                : 'Service'}
                                            )
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-muted-foreground">
                                            Outstanding Balance
                                        </span>
                                        <span className="font-semibold text-destructive">
                                            {currencySymbol}
                                            {selectedInvoiceOutstanding.toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {walletBalance > 0 && (
                                <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-warning">
                                                Wallet Balance Available
                                            </span>
                                            <span className="block font-bold text-foreground">
                                                {currencySymbol}
                                                {walletBalance.toLocaleString()}
                                            </span>
                                        </div>
                                        {can.managePayments &&
                                            firstOutstandingInvoice &&
                                            firstOutstandingBalance > 0 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isWalletApplying}
                                                    onClick={
                                                        handleApplyWalletToInvoice
                                                    }
                                                    className="border-warning/40 bg-background text-warning hover:bg-warning/10"
                                                >
                                                    <CreditCardIcon className="mr-1.5 h-3.5 w-3.5" />
                                                    {isWalletApplying
                                                        ? 'Applying...'
                                                        : 'Apply to Invoice'}
                                                </Button>
                                            )}
                                    </div>
                                    {walletDeposits.map((deposit) => (
                                        <div
                                            key={deposit.id}
                                            className="mt-1 text-xs text-muted-foreground"
                                        >
                                            Receipt {deposit.receipt_number} -{' '}
                                            {currencySymbol}
                                            {Number(
                                                deposit.amount,
                                            ).toLocaleString()}{' '}
                                            via {deposit.payment_method}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="payment_mode_id">
                                    Payment Mode
                                </Label>
                                <select
                                    id="payment_mode_id"
                                    value={paymentForm.data.payment_mode_id}
                                    onChange={(e) => {
                                        paymentForm.setData(
                                            'payment_mode_id',
                                            e.target.value,
                                        );

                                        if (isWalletMode) {
                                            paymentForm.setData(
                                                'invoice_id',
                                                '',
                                            );
                                        }
                                    }}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    required
                                >
                                    <option value="" disabled>
                                        Select payment mode
                                    </option>
                                    {paymentModes.map((mode) => (
                                        <option key={mode.id} value={mode.id}>
                                            {mode.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={paymentForm.errors.payment_mode_id}
                                />
                                {isWalletMode && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Hospital Wallet deposits are recorded as
                                        general account credit (not linked to an
                                        invoice).
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="amount">
                                    Amount ({currencySymbol})
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={paymentForm.data.amount}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter amount"
                                    required
                                />
                                <InputError
                                    message={paymentForm.errors.amount}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="transaction_reference">
                                    Transaction Reference (Optional)
                                </Label>
                                <Input
                                    id="transaction_reference"
                                    value={
                                        paymentForm.data.transaction_reference
                                    }
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            'transaction_reference',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Reference or bank code"
                                />
                                <InputError
                                    message={
                                        paymentForm.errors.transaction_reference
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="payment_date">
                                    Payment Date
                                </Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={paymentForm.data.payment_date}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            'payment_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={paymentForm.errors.payment_date}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="payment_notes">
                                    Notes (Optional)
                                </Label>
                                <textarea
                                    id="payment_notes"
                                    value={paymentForm.data.notes}
                                    onChange={(e) =>
                                        paymentForm.setData(
                                            'notes',
                                            e.target.value,
                                        )
                                    }
                                    rows={2}
                                    placeholder="Any additional remarks..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                                <InputError
                                    message={paymentForm.errors.notes}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsPaymentOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                >
                                    {paymentForm.processing
                                        ? 'Recording...'
                                        : 'Record Payment'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Apply Waiver Dialog */}
                <Dialog open={isWaiverOpen} onOpenChange={setIsWaiverOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Apply Waiver to Invoice{' '}
                                {firstOutstandingInvoice?.invoice_number ?? ''}
                            </DialogTitle>
                            <DialogDescription>
                                Waive an amount from the outstanding balance.
                                Outstanding balance: {currencySymbol}
                                {invoiceOutstanding.toLocaleString()}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-secondary/10 p-3 text-sm">
                            <div>
                                <span className="block text-xs text-muted-foreground">
                                    Total Amount Expected
                                </span>
                                <span className="font-semibold text-foreground">
                                    {currencySymbol}
                                    {Number(
                                        firstOutstandingInvoice?.total_amount ||
                                            0,
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-muted-foreground">
                                    Total Paid
                                </span>
                                <span className="font-medium text-success">
                                    {currencySymbol}
                                    {totalPaid.toLocaleString()}
                                </span>
                            </div>
                            {totalWaived > 0 && (
                                <div className="text-right">
                                    <span className="block text-xs text-muted-foreground">
                                        Already Waived
                                    </span>
                                    <span className="font-medium text-destructive">
                                        {currencySymbol}
                                        {Number(totalWaived).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            <div className="col-span-2">
                                <span className="block text-xs text-muted-foreground">
                                    Outstanding Balance
                                </span>
                                <span className="text-base font-bold text-destructive">
                                    {currencySymbol}
                                    {invoiceOutstanding.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={submitWaiver} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="waiver_amount">
                                    Waiver Amount ({currencySymbol})
                                </Label>
                                <Input
                                    id="waiver_amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={invoiceOutstanding}
                                    value={waiverForm.data.amount}
                                    onChange={(e) =>
                                        waiverForm.setData(
                                            'amount',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter amount to waive"
                                    required
                                />
                                <InputError
                                    message={waiverForm.errors.amount}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="waiver_reason">
                                    Reason (Optional)
                                </Label>
                                <textarea
                                    id="waiver_reason"
                                    value={waiverForm.data.reason}
                                    onChange={(e) =>
                                        waiverForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    rows={3}
                                    placeholder="Provide a reason for this waiver..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                                <InputError
                                    message={waiverForm.errors.reason}
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsWaiverOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={waiverForm.processing}
                                >
                                    {waiverForm.processing
                                        ? 'Applying...'
                                        : 'Apply Waiver'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Create Service Invoice Dialog */}
                <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                    <DialogContent className="max-w-2xl border border-border bg-card">
                        <DialogHeader>
                            <DialogTitle>Create Service Invoice</DialogTitle>
                            <DialogDescription>
                                Add service line items to create a new invoice.
                                Storage fees are billed separately.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={submitGenerateInvoice}
                            className="space-y-4"
                        >
                            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                                <div className="grid grid-cols-12 gap-2 border-b border-border/50 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    <div className="col-span-6">Service</div>
                                    <div className="col-span-2 text-right">
                                        Price
                                    </div>
                                    <div className="col-span-2 text-center">
                                        Qty
                                    </div>
                                    <div className="col-span-2 text-right">
                                        Action
                                    </div>
                                </div>

                                {data.items.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        No services added yet. Add a service to
                                        begin.
                                    </p>
                                ) : (
                                    data.items.map((item, index) => {
                                        const selectedService =
                                            availableServices.find(
                                                (s) =>
                                                    String(s.service_id) ===
                                                    String(item.service_id),
                                            );
                                        const price =
                                            selectedService?.price ?? 0;
                                        const lineTotal = rowLineTotal(
                                            selectedService,
                                            item.quantity,
                                        );

                                        return (
                                            <div
                                                key={index}
                                                className="grid grid-cols-12 items-center gap-2 py-1"
                                            >
                                                <div className="col-span-6">
                                                    <select
                                                        value={item.service_id}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                'service_id',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                        required
                                                    >
                                                        <option
                                                            value=""
                                                            disabled
                                                        >
                                                            -- Select Service --
                                                        </option>
                                                        {availableServices.map(
                                                            (s) => (
                                                                <option
                                                                    key={
                                                                        s.service_id
                                                                    }
                                                                    value={
                                                                        s.service_id
                                                                    }
                                                                >
                                                                    {s.name}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="col-span-2 text-right text-sm font-medium text-muted-foreground">
                                                    {currencySymbol}
                                                    {price.toLocaleString()}
                                                    <span className="block text-xs text-muted-foreground">
                                                        ×{Number(item.quantity) ||
                                                            0} ={' '}
                                                        {currencySymbol}
                                                        {lineTotal.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="col-span-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                'quantity',
                                                                Math.max(
                                                                    1,
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                ),
                                                            )
                                                        }
                                                        className="h-9 text-center"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleRemoveItem(
                                                                index,
                                                            )
                                                        }
                                                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2Icon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="generate_notes">
                                    Notes (Optional)
                                </Label>
                                <textarea
                                    id="generate_notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Any additional remarks..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddItem}
                                >
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Add Service Line
                                </Button>
                                <div className="text-sm font-semibold">
                                    Total Estimate:{' '}
                                    <span className="text-base font-bold text-primary">
                                        {currencySymbol}
                                        {calculatedTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsGenerateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || data.items.length === 0
                                    }
                                >
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Invoice'}
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
                                                    - by{' '}
                                                    {t.transferred_by_user.name}
                                                </span>
                                            )}
                                        </div>
                                        {(t.from_chamber || t.to_chamber) && (
                                            <p className="mt-1 text-sm text-foreground">
                                                {t.from_chamber?.name ?? 'N/A'}
                                                {' -> '}
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
