import { Head, Link } from '@inertiajs/react';
import { Pagination } from '@/components/pagination';
import { StatusChip } from '@/components/status-chip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface Transfer {
    id: string;
    event_type: string;
    transferred_at: string;
    notes: string | null;
    deceased: { id: string; first_name: string; last_name: string } | null;
    from_chamber: { name: string } | null;
    to_chamber: { name: string } | null;
    transferred_by_user: { name: string } | null;
}

interface PaginatedHistory {
    data: Transfer[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Chamber {
    id: string;
    name: string;
    location: string | null;
}

interface Props {
    chamber: Chamber;
    history: PaginatedHistory;
}

export default function ChamberHistory({ chamber, history }: Props) {
    return (
        <>
            <Head title={`History — ${chamber.name}`} />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Occupation History
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {chamber.name}
                        {chamber.location && ` · ${chamber.location}`} ·{' '}
                        {history.total} event{history.total !== 1 ? 's' : ''}
                    </p>
                </div>

                {history.data.length === 0 ? (
                    <Alert>
                        <AlertTitle>No history yet</AlertTitle>
                        <AlertDescription>
                            No transfer events have been recorded for this
                            chamber.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="mma-zebra w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40">
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Date
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Event
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Deceased
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                From
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                To
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                By
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                Notes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.data.map((event) => (
                                            <tr
                                                key={event.id}
                                                className="border-b border-border last:border-0 hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                                                    {event.transferred_at}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <StatusChip
                                                        status={
                                                            event.event_type
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {event.deceased ? (
                                                        <Link
                                                            href={`/deceased/${event.deceased.id}`}
                                                            className="font-medium hover:underline"
                                                        >
                                                            {
                                                                event.deceased
                                                                    .first_name
                                                            }{' '}
                                                            {
                                                                event.deceased
                                                                    .last_name
                                                            }
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {event.from_chamber?.name ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {event.to_chamber?.name ??
                                                        'Released'}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {event.transferred_by_user
                                                        ?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {event.notes ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {history.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <span className="text-sm text-muted-foreground">
                            Page {history.current_page} of {history.last_page}
                        </span>
                        <Pagination links={history.links} />
                    </div>
                )}
            </div>
        </>
    );
}

ChamberHistory.layout = {
    breadcrumbs: [
        { title: 'Chambers', href: '/chambers' },
        { title: 'History', href: '#' },
    ],
};
