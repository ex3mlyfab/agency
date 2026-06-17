import { Head, Link } from '@inertiajs/react';
import { PencilIcon, MoveRightIcon, ShieldCheckIcon } from 'lucide-react';
import { StatusChip } from '@/components/status-chip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Transfer {
    id: number;
    event_type: string;
    transferred_at: string;
    notes: string | null;
    from_chamber: { name: string } | null;
    to_chamber: { name: string } | null;
    transferred_by_user: { name: string } | null;
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
    chamber: { id: number; name: string } | null;
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
}

interface Props {
    deceased: Deceased;
    can: { edit: boolean; delete: boolean; transfer: boolean };
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
            <dd className="text-sm text-foreground">{value ?? '—'}</dd>
        </div>
    );
}

export default function DeceasedShow({ deceased, can }: Props) {
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
                            Date of death: {deceased.date_of_death}
                            {deceased.chamber &&
                                ` · Chamber: ${deceased.chamber.name}`}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        {can.edit && deceased.status !== 'Released' && (
                            <Button
                                asChild
                                className="border-none bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <Link href={`/deceased/${deceased.id}/release`}>
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
                                <Link href={`/deceased/${deceased.id}/edit`}>
                                    <PencilIcon className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Deceased info card */}
                    <Card>
                        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
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
                                    value={deceased.date_of_birth}
                                />
                                <Field
                                    label="Date of Death"
                                    value={deceased.date_of_death}
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
                                        {deceased.notes ?? '—'}
                                    </dd>
                                </div>
                                <div className="col-span-2 space-y-1 rounded-md border border-border bg-secondary/10 p-3">
                                    <dt className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
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
                            <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
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
                            <Card className="border border-emerald-600/30 bg-emerald-50/5">
                                <CardHeader className="border-b border-border bg-emerald-600/5 px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
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

                {/* Transfer / audit history */}
                <Card>
                    <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
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
                                                    · by{' '}
                                                    {t.transferred_by_user.name}
                                                </span>
                                            )}
                                        </div>
                                        {(t.from_chamber || t.to_chamber) && (
                                            <p className="mt-1 text-sm text-foreground">
                                                {t.from_chamber?.name ?? '—'}
                                                {' → '}
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
