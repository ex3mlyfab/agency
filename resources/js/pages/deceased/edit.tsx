import { Head } from '@inertiajs/react';
import { DeceasedForm } from '@/components/deceased-form';

interface Deceased {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    date_of_death: string;
    gender: string;
    cause_of_death: string | null;
    notes: string | null;
    status: string;
    relative_name: string;
    relative_phone: string;
    relative_relationship: string;
    relative_address: string | null;
    chamber_id: string | null;
}

interface Chamber {
    id: string;
    name: string;
}

interface Props {
    deceased: Deceased;
    chambers: Chamber[];
}

export default function DeceasedEdit({ deceased, chambers }: Props) {
    return (
        <>
            <Head title={`Edit — ${deceased.first_name} ${deceased.last_name}`} />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Edit Record
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {deceased.first_name} {deceased.last_name}
                    </p>
                </div>

                <DeceasedForm
                    action={`/deceased/${deceased.id}`}
                    method="put"
                    submitLabel="Save Changes"
                    cancelHref={`/deceased/${deceased.id}`}
                    initialValues={{
                        first_name: deceased.first_name,
                        last_name: deceased.last_name,
                        date_of_birth: deceased.date_of_birth ?? '',
                        date_of_death: deceased.date_of_death,
                        gender: deceased.gender,
                        cause_of_death: deceased.cause_of_death ?? '',
                        notes: deceased.notes ?? '',
                        relative_name: deceased.relative_name,
                        relative_phone: deceased.relative_phone,
                        relative_relationship: deceased.relative_relationship,
                        relative_address: deceased.relative_address ?? '',
                        chamber_id: deceased.chamber_id ?? '',
                    }}
                    chambers={chambers}
                />
            </div>
        </>
    );
}

DeceasedEdit.layout = {
    breadcrumbs: [
        { title: 'Deceased', href: '/deceased' },
        { title: 'Edit', href: '#' },
    ],
};
