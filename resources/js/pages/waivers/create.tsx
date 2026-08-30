import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, ShieldCheckIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCurrency, fmtCurrency } from '@/lib/currency';

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: string | number;
    paid_amount: string | number;
    waived_amount: string | number;
    status: string;
}

interface Props {
    deceasedList: Deceased[];
    invoices: Invoice[];
}

export default function WaiverCreate({ deceasedList, invoices }: Props) {
    const symbol = useCurrency();

    const form = useForm({
        deceased_id: '',
        invoice_id: '',
        amount: '',
        reason: '',
    });

    const filteredInvoices = invoices.filter(
        (inv) => inv.deceased_id === form.data.deceased_id
    );

    const selectedInvoice = invoices.find(
        (inv) => inv.id === form.data.invoice_id
    );

    const total = selectedInvoice ? parseFloat(selectedInvoice.total_amount as string) : 0;
    const paid = selectedInvoice ? parseFloat(selectedInvoice.paid_amount as string) : 0;
    const waived = selectedInvoice ? parseFloat(selectedInvoice.waived_amount as string) : 0;
    const balance = total - paid - waived;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/waivers', {
            onSuccess: () => {
                form.reset();
            },
        });
    };

    return (
        <>
            <Head title="New Waiver" />
            <div className="space-y-6 p-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/waivers">
                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                            Back to Waivers
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                            <ShieldCheckIcon className="h-5 w-5 text-muted-foreground" />
                            New Waiver
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="deceased_id">Deceased Record</Label>
                                <Select
                                    value={form.data.deceased_id}
                                    onValueChange={(val) => {
                                        form.setData('deceased_id', val);
                                        form.setData('invoice_id', '');
                                    }}
                                >
                                    <SelectTrigger id="deceased_id" className="w-full">
                                        <SelectValue placeholder="Select deceased record" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deceasedList.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {d.first_name} {d.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.deceased_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="invoice_id">Invoice</Label>
                                <Select
                                    value={form.data.invoice_id}
                                    onValueChange={(val) => form.setData('invoice_id', val)}
                                    disabled={!form.data.deceased_id}
                                >
                                    <SelectTrigger id="invoice_id" className="w-full">
                                        <SelectValue placeholder="Select invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredInvoices.map((inv) => (
                                            <SelectItem key={inv.id} value={inv.id}>
                                                {inv.invoice_number} — {inv.status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.invoice_id} />
                            </div>

                            {selectedInvoice && (
                                <div className="rounded-md border border-border bg-secondary/10 p-3 text-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Total Amount</span>
                                            <span className="font-semibold text-foreground">
                                                {fmtCurrency(total, symbol)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Paid to Date</span>
                                            <span className="font-medium text-emerald-600">
                                                {fmtCurrency(paid, symbol)}
                                            </span>
                                        </div>
                                        {waived > 0 && (
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Already Waived</span>
                                                <span className="font-medium text-rose-600">
                                                    {fmtCurrency(waived, symbol)}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Outstanding Balance</span>
                                            <span className="font-bold text-destructive text-base">
                                                {fmtCurrency(balance, symbol)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="amount">Waiver Amount ({symbol})</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={balance || undefined}
                                    value={form.data.amount}
                                    onChange={(e) => form.setData('amount', e.target.value)}
                                    placeholder="Enter amount to waive"
                                    required
                                />
                                <InputError message={form.errors.amount} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="reason">Reason (Optional)</Label>
                                <textarea
                                    id="reason"
                                    value={form.data.reason}
                                    onChange={(e) => form.setData('reason', e.target.value)}
                                    rows={3}
                                    placeholder="Provide a reason for this waiver..."
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                <InputError message={form.errors.reason} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/waivers">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Creating...' : 'Create Waiver'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

WaiverCreate.layout = {
    breadcrumbs: [
        { title: 'Waivers', href: '/waivers' },
        { title: 'New Waiver', href: '#' },
    ],
};
