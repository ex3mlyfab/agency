import { Head, Link } from '@inertiajs/react';
import { ArrowLeftIcon, ShieldCheckIcon, UserIcon, CalendarIcon, FileTextIcon, TrendingDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface User {
    name: string;
}

interface Waiver {
    id: string;
    deceased: Deceased | null;
    invoice: Invoice | null;
    amount: string | number;
    reason: string | null;
    authorized_at: string;
    authorized_by_user: User | null;
    created_at: string;
}

interface Props {
    waiver: Waiver;
}

export default function WaiverShow({ waiver }: Props) {
    const symbol = useCurrency();
    const amount = parseFloat(waiver.amount as string);

    return (
        <>
            <Head title={`Waiver ${waiver.id}`} />
            <div className="space-y-6 p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/waivers">
                            <ArrowLeftIcon className="mr-2 h-4 w-4" />
                            Back to Waivers
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader className="border-b border-border px-6 py-3">
                            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                <ShieldCheckIcon className="h-5 w-5 text-muted-foreground" />
                                Waiver {waiver.id}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex justify-end">
                                <div className="w-80 space-y-2 border-t border-border pt-4 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Amount Waived</span>
                                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                                            -{fmtCurrency(amount, symbol)}
                                        </span>
                                    </div>
                                    {waiver.reason && (
                                        <div className="pt-2 border-t border-border">
                                            <span className="text-xs text-muted-foreground block uppercase font-medium">Reason</span>
                                            <p className="mt-1 text-sm text-foreground whitespace-pre-line leading-relaxed">
                                                {waiver.reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="border-b border-border px-6 py-3">
                                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                    Authorized By
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Authorized By</span>
                                    <span className="font-medium text-foreground text-sm">
                                        {waiver.authorized_by_user?.name || 'System'}
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <span className="text-xs text-muted-foreground block">Authorized At</span>
                                    <span className="font-medium text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                        {new Date(waiver.authorized_at).toLocaleString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="border-b border-border px-6 py-3">
                                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                                    Applied Invoice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {waiver.invoice ? (
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Invoice Number</span>
                                            <Link
                                                href={`/invoices/${waiver.invoice.id}`}
                                                className="font-semibold text-primary hover:underline text-sm"
                                            >
                                                {waiver.invoice.invoice_number}
                                            </Link>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Invoice Total</span>
                                            <span className="font-semibold text-foreground text-sm">
                                                {fmtCurrency(parseFloat(waiver.invoice.total_amount as string), symbol)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Invoice Status</span>
                                            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20 mt-1">
                                                {waiver.invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">No invoice linked.</span>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

WaiverShow.layout = {
    breadcrumbs: [
        { title: 'Waivers', href: '/waivers' },
        { title: 'Details', href: '#' },
    ],
};
