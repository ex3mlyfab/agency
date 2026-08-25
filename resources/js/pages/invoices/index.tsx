import { Head, Link, router } from '@inertiajs/react';
import { EyeIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
}

interface Invoice {
    id: string;
    invoice_number: string;
    deceased: Deceased | null;
    total_amount: string | number;
    paid_amount: string | number;
    status: string;
    created_at: string;
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: any[];
}

interface Props {
    invoices: PaginatedInvoices;
    filters: { search?: string };
}

export default function InvoicesIndex({ invoices, filters }: Props) {
    const symbol = useCurrency();
    const [search, setSearch] = useState(filters.search || '');

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get('/invoices', { search }, { preserveState: true });
    }

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
            <Head title="Invoices" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Invoices
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {invoices.total > 0
                                ? `Showing ${invoices.from}–${invoices.to} of ${invoices.total} invoices`
                                : 'No invoices found'}
                        </p>
                    </div>
                    <form onSubmit={handleSearch} className="flex max-w-sm items-center gap-2">
                        <Input
                            placeholder="Search invoices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9"
                        />
                        <Button type="submit" size="sm" variant="secondary">
                            <SearchIcon className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                        <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Billing Ledger
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {invoices.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No invoices found</AlertTitle>
                                    <AlertDescription>
                                        No invoices match the current filter criteria or have been created yet.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice #</TableHead>
                                            <TableHead>Deceased</TableHead>
                                            <TableHead>Total Amount</TableHead>
                                            <TableHead>Paid Amount</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date Created</TableHead>
                                            <TableHead className="w-24 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.data.map((invoice) => {
                                            const total = parseFloat(invoice.total_amount as string);
                                            const paid = parseFloat(invoice.paid_amount as string);
                                            const balance = total - paid;

                                            return (
                                                <TableRow key={invoice.id}>
                                                    <TableCell className="font-semibold text-foreground">
                                                        {invoice.invoice_number}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-foreground">
                                                        {invoice.deceased ? (
                                                            <Link
                                                                href={`/deceased/${invoice.deceased.id}`}
                                                                className="hover:underline text-primary"
                                                            >
                                                                {invoice.deceased.first_name} {invoice.deceased.last_name}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-foreground">
                                                        {fmtCurrency(total, symbol)}
                                                    </TableCell>
                                                    <TableCell className="text-emerald-600 dark:text-emerald-400">
                                                        {fmtCurrency(paid, symbol)}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-destructive">
                                                        {fmtCurrency(balance, symbol)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                                                            {invoice.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(invoice.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={`/invoices/${invoice.id}`}>
                                                                    <EyeIcon className="h-4 w-4" />
                                                                    <span className="sr-only">View</span>
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {invoices.last_page > 1 && (
                            <div className="border-t border-border px-6 py-4">
                                <Pagination links={invoices.links} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

InvoicesIndex.layout = {
    breadcrumbs: [{ title: 'Invoices', href: '/invoices' }],
};
