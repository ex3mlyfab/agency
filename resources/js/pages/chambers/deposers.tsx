import { Head, Link } from '@inertiajs/react';
import {
    UserIcon,
    ClockIcon,
    EyeIcon,
    BuildingIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Occupant {
    id: string;
    full_name: string;
    age: number | null;
    days_in_storage: number;
}

interface Chamber {
    id: string;
    name: string;
    location: string | null;
    capacity: number;
    occupants_count: number;
    occupancy_status: 'In use' | 'Empty';
    service: { id: string; name: string } | null;
    occupants: Occupant[];
}

interface Props {
    chambers: Chamber[];
}

export default function Depositions({ chambers }: Props) {
    const items = chambers ?? [];

    return (
        <>
            <Head title="Depositions" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Depositions
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {items.length > 0
                            ? `Showing ${items.length} occupied chamber${items.length !== 1 ? 's' : ''}`
                            : 'No occupied chambers'}
                    </p>
                </div>

                {items.length === 0 ? (
                    <Alert>
                        <AlertTitle>No occupied chambers</AlertTitle>
                        <AlertDescription>
                            All chambers are currently empty.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <table className="mma-zebra w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Chamber
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Location
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Status
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Occupant
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Age
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Days Spent
                                        </th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            Deposition
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.flatMap((chamber) =>
                                        chamber.occupants.map((occupant, idx) => (
                                            <tr
                                                key={`${chamber.id}-${occupant.id}`}
                                                className="border-b border-border last:border-0 hover:bg-muted/30"
                                            >
                                                {idx === 0 && (
                                                    <td
                                                        className="px-4 py-2.5 font-medium"
                                                        rowSpan={chamber.occupants.length}
                                                    >
                                                        <div>{chamber.name}</div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <span>{chamber.occupants_count}/{chamber.capacity}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                {idx === 0 && (
                                                    <td
                                                        className="px-4 py-2.5 text-muted-foreground"
                                                        rowSpan={chamber.occupants.length}
                                                    >
                                                        {chamber.location ?? '—'}
                                                    </td>
                                                )}
                                                {idx === 0 && (
                                                    <td
                                                        className="px-4 py-2.5"
                                                        rowSpan={chamber.occupants.length}
                                                    >
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-0.5 text-xs font-bold text-success-foreground">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-success-foreground" />
                                                            Occupied
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{occupant.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">
                                                    {occupant.age !== null
                                                        ? `${occupant.age}`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <ClockIcon className="h-3.5 w-3.5" />
                                                        <span>
                                                            {occupant.days_in_storage === 0
                                                                ? 'Today'
                                                                : `${occupant.days_in_storage}d`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/deceased/${occupant.id}`}>
                                                            <EyeIcon className="mr-1.5 h-3.5 w-3.5" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        )),
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

Depositions.layout = {
    breadcrumbs: [
        { title: 'Cold Rooms & Depositions', href: '/chambers' },
        { title: 'Depositions', href: '/chambers/deposers' },
    ],
};