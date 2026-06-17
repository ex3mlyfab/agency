import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { StatusChip } from '@/components/status-chip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Transfer {
    id: number;
    event_type: string;
    transferred_at: string;
    notes: string | null;
    deceased: { id: number; first_name: string; last_name: string } | null;
    from_chamber: { name: string } | null;
    to_chamber: { name: string } | null;
    transferred_by_user: { name: string } | null;
}

interface PaginatedTransfers {
    data: Transfer[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    transfers: PaginatedTransfers;
}

export default function TransfersIndex({ transfers }: Props) {
    return (
        <>
            <Head title="Transfer Log" />
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Transfer Log
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {transfers.total > 0
                                ? `Showing ${transfers.from}–${transfers.to} of ${transfers.total} events`
                                : 'No transfer events recorded'}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/transfers/create">Record Transfer</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {transfers.data.length === 0 ? (
                            <div className="p-6">
                                <Alert>
                                    <AlertTitle>No events yet</AlertTitle>
                                    <AlertDescription>
                                        No transfer events have been recorded. They will appear here
                                        when chambers receive, transfer, or release occupants.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Deceased</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>By</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.data.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>
                                                <StatusChip status={t.event_type} />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {t.deceased ? (
                                                    <Link
                                                        href={`/deceased/${t.deceased.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {t.deceased.first_name}{' '}
                                                        {t.deceased.last_name}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {t.from_chamber?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {t.to_chamber?.name ?? 'Released'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {t.transferred_by_user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {t.transferred_at}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {transfers.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-border px-6 py-4">
                                <span className="text-sm text-muted-foreground">
                                    Page {transfers.current_page} of {transfers.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {transfers.links.map((link) => (
                                        <Button
                                            key={link.label}
                                            asChild={!!link.url}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TransfersIndex.layout = {
    breadcrumbs: [{ title: 'Transfers', href: '/transfers' }],
};
