import { Head, Link } from '@inertiajs/react';
import { StatusChip } from '@/components/status-chip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

                <Card>
                    <CardHeader className="border-b border-border px-6 py-3">
                        <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Audit Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6">
                        {history.data.length === 0 ? (
                            <Alert>
                                <AlertTitle>No history yet</AlertTitle>
                                <AlertDescription>
                                    No transfer events have been recorded for
                                    this chamber.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <ol className="relative space-y-6 border-l border-border pl-6">
                                {history.data.map((event) => (
                                    <li key={event.id} className="relative">
                                        <span className="absolute top-0.5 -left-[1.5rem] flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card" style={{ boxShadow: '0 0 0 1px var(--background)' }} />

                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusChip
                                                status={event.event_type}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {event.transferred_at}
                                            </span>
                                            {event.transferred_by_user && (
                                                <span className="text-xs text-muted-foreground">
                                                    · by{' '}
                                                    {
                                                        event
                                                            .transferred_by_user
                                                            .name
                                                    }
                                                </span>
                                            )}
                                        </div>

                                        {event.deceased && (
                                            <p className="mt-1 text-sm font-medium text-foreground">
                                                <Link
                                                    href={`/deceased/${event.deceased.id}`}
                                                    className="hover:underline"
                                                >
                                                    {event.deceased.first_name}{' '}
                                                    {event.deceased.last_name}
                                                </Link>
                                            </p>
                                        )}

                                        {(event.from_chamber ||
                                            event.to_chamber) && (
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {event.from_chamber?.name ??
                                                    '—'}
                                                {' → '}
                                                {event.to_chamber?.name ??
                                                    'Released'}
                                            </p>
                                        )}

                                        {event.notes && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {event.notes}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}

                        {/* Pagination */}
                        {history.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                                <span className="text-sm text-muted-foreground">
                                    Page {history.current_page} of{' '}
                                    {history.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {history.links.map((link) => (
                                        <Button
                                            key={link.label}
                                            asChild={!!link.url}
                                            variant={
                                                link.active
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            disabled={!link.url}
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
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

ChamberHistory.layout = {
    breadcrumbs: [
        { title: 'Chambers', href: '/chambers' },
        { title: 'History', href: '#' },
    ],
};
