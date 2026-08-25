import { Head, Link, router } from '@inertiajs/react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon,
    MoveRightIcon,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Chamber {
    id: number;
    name: string;
    location: string | null;
    capacity: number;
    occupants_count: number;
    occupancy_status: 'In use' | 'Empty';
    days_in_chamber: number | null;
}

interface Props {
    chambers: Chamber[];
    can: { manage: boolean; viewHistory: boolean; transfer: boolean };
}

export default function ChambersIndex({ chambers, can }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        setIsDeleting(true);
        router.delete(`/chambers/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="Chambers" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Chamber Indicator
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Real-time occupancy overview across all chambers
                        </p>
                    </div>
                    {can.manage && (
                        <Button asChild>
                            <Link href="/chambers/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Chamber
                            </Link>
                        </Button>
                    )}
                </div>

                {chambers.length === 0 ? (
                    <Alert>
                        <AlertTitle>No chambers configured</AlertTitle>
                        <AlertDescription>
                            No chambers have been added yet.{' '}
                            {can.manage && (
                                <Link
                                    href="/chambers/create"
                                    className="font-semibold underline underline-offset-4"
                                >
                                    Add the first chamber.
                                </Link>
                            )}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {chambers.map((chamber) => {
                            const isOccupied =
                                chamber.occupancy_status === 'In use';

                            return (
                                <Card
                                    key={chamber.id}
                                    className="relative overflow-hidden transition-shadow hover:shadow-md"
                                >
                                    {/* Occupancy indicator strip */}
                                    <div
                                        className={`absolute top-0 left-0 h-full w-1 ${
                                            isOccupied
                                                ? 'bg-success'
                                                : 'bg-border'
                                        }`}
                                    />

                                    <CardHeader className="pb-2 pl-6">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base font-semibold">
                                                {chamber.name}
                                            </CardTitle>
                                            <Badge
                                                variant={
                                                    isOccupied
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className="shrink-0"
                                            >
                                                {chamber.occupancy_status}
                                            </Badge>
                                        </div>
                                        {chamber.location && (
                                            <p className="text-xs text-muted-foreground">
                                                {chamber.location}
                                            </p>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-4 pl-6">
                                        {/* Days in chamber */}
                                        {isOccupied && (
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <ClockIcon className="h-3.5 w-3.5" />
                                                <span>
                                                    {chamber.days_in_chamber !==
                                                    null
                                                        ? chamber.days_in_chamber ===
                                                          0
                                                            ? 'Today'
                                                            : `${chamber.days_in_chamber} day${chamber.days_in_chamber !== 1 ? 's' : ''}`
                                                        : '—'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            {can.viewHistory && (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={`/chambers/${chamber.id}/history`}
                                                    >
                                                        <ClockIcon className="mr-1.5 h-3.5 w-3.5" />
                                                        History
                                                    </Link>
                                                </Button>
                                            )}
                                            {can.transfer && isOccupied && (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={`/transfers/create?chamber_id=${chamber.id}`}
                                                    >
                                                        <MoveRightIcon className="mr-1.5 h-3.5 w-3.5" />
                                                        Transfer
                                                    </Link>
                                                </Button>
                                            )}
                                            {can.manage && (
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={`/chambers/${chamber.id}/edit`}
                                                    >
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            )}
                                            {can.manage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        setDeleteTarget(
                                                            chamber.id,
                                                        )
                                                    }
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete chamber"
                description="This will permanently remove the chamber. This action cannot be undone. Chambers with current occupants cannot be deleted."
                confirmLabel="Delete Chamber"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

ChambersIndex.layout = {
    breadcrumbs: [{ title: 'Chambers', href: '/chambers' }],
};
