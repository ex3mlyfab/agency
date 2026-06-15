import { Head } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type LatestEventType = 'Entered' | 'Transferred' | 'Released' | 'Updated' | string;

export interface OpsPulseLatestEvent {
    id: string;
    occurredAt: string; // ISO string (or display-ready)
    type: LatestEventType;
    label: string; // human readable context (e.g. "John Doe moved A-12 → B-03")
    actor?: string;
}

export interface OpsPulseOccupancyItem {
    chamberId: string;
    chamberName: string;
    status: 'Empty' | 'In use' | 'Reserved' | string;
    daysInChamber?: number | null;
}

export interface OpsPulseCtas {
    historyHref?: string;
    reportsHref?: string;
}

export function OpsPulse({
    latestEvents,
    occupancy,
    ctas,
    className,
}: {
    latestEvents?: OpsPulseLatestEvent[] | null;
    occupancy?: OpsPulseOccupancyItem[] | null;
    ctas?: OpsPulseCtas | null;
    className?: string;
}) {
    const hasEvents = Boolean(latestEvents && latestEvents.length > 0);
    const hasOccupancy = Boolean(occupancy && occupancy.length > 0);

    return (
        <div className={cn('flex h-full flex-col gap-4', className)}>
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Chamber occupancy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!hasOccupancy ? (
                            <Alert variant="default" className="rounded-lg">
                                <AlertTitle>Snapshot unavailable</AlertTitle>
                                <AlertDescription>
                                    No occupancy data was provided yet.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-2">
                                {occupancy!.slice(0, 3).map((item) => (
                                    <div
                                        key={item.chamberId}
                                        className="flex items-start justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">
                                                {item.chamberName}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge variant="secondary">
                                                    {item.status}
                                                </Badge>
                                                {typeof item.daysInChamber === 'number' ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.daysInChamber}d
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {occupancy && occupancy.length > 3 ? (
                                    <div className="text-xs text-muted-foreground">
                                        Showing top 3 chambers
                                    </div>
                                ) : null}
                            </div>
                        )}
                        {ctas?.historyHref ? (
                            <Button asChild variant="outline" className="w-full">
                                <a href={ctas.historyHref}>View history</a>
                            </Button>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base">Latest audit events</CardTitle>
                            <div className="text-sm text-muted-foreground">
                                A calm, chronological strip of recent operational changes.
                            </div>
                        </div>

                        {ctas?.reportsHref ? (
                            <Button asChild variant="secondary" className="shrink-0">
                                <a href={ctas.reportsHref}>Reports</a>
                            </Button>
                        ) : null}
                    </CardHeader>
                    <CardContent>
                        {!hasEvents ? (
                            <Alert variant="default" className="rounded-lg">
                                <AlertTitle>No recent events</AlertTitle>
                                <AlertDescription>
                                    Once operations occur, audit events will appear here.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-3">
                                {latestEvents!.slice(0, 5).map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary">{event.type}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {event.occurredAt}
                                                </span>
                                            </div>
                                            <div className="mt-2 truncate text-sm font-medium">
                                                {event.label}
                                            </div>
                                            {event.actor ? (
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    By {event.actor}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                                {latestEvents && latestEvents.length > 5 ? (
                                    <div className="text-xs text-muted-foreground">
                                        Showing latest 5 events
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
