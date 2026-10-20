import { Head } from '@inertiajs/react';
import { DeceasedForm } from '@/components/deceased-form';

interface Deceased {
    id: number;
    first_name: string;
    last_name: string;
    othernames: string | null;
    date_of_birth: string | null;
    estimated_age: number | null;
    date_of_death: string;
    body_condition: string | null;
    type_of_cloth: string | null;
    color_of_cloth: string | null;
    underwear: string | null;
    type_of_wrapping: string | null;
    type_of_wrapping_other: string | null;
    gender: string;
    cause_of_death: string | null;
    notes: string | null;
    status: string;
    relative_name: string;
    relative_phone: string;
    relative_relationship: string;
    relative_address: string | null;
    residential_address: string | null;
    chamber_id: string | null;
    service_category_id: string | null;
    source: string | null;
}

interface Chamber {
    id: string;
    name: string;
    available_spaces: number;
    is_current: boolean;
}

interface ServiceCategory {
    id: string;
    name: string;
}

interface Props {
    deceased: Deceased;
    chambers: Chamber[];
    serviceCategories: ServiceCategory[];
}

export default function DeceasedEdit({
    deceased,
    chambers,
    serviceCategories,
}: Props) {
    return (
        <>
            <Head
                title={`Edit — ${deceased.first_name} ${deceased.last_name}`}
            />
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
                        othernames: deceased.othernames ?? '',
                        date_of_birth: deceased.date_of_birth ?? '',
                        estimated_age:
                            deceased.estimated_age != null
                                ? String(deceased.estimated_age)
                                : '',
                        date_of_death: deceased.date_of_death,
                        body_condition: deceased.body_condition ?? '',
                        type_of_cloth: deceased.type_of_cloth ?? '',
                        color_of_cloth: deceased.color_of_cloth ?? '',
                        underwear: deceased.underwear ?? '',
                        type_of_wrapping: deceased.type_of_wrapping ?? '',
                        type_of_wrapping_other:
                            deceased.type_of_wrapping_other ?? '',
                        gender: deceased.gender,
                        cause_of_death: deceased.cause_of_death ?? '',
                        notes: deceased.notes ?? '',
                        relative_name: deceased.relative_name,
                        relative_phone: deceased.relative_phone,
                        relative_relationship: deceased.relative_relationship,
                        relative_address: deceased.relative_address ?? '',
                        residential_address: deceased.residential_address ?? '',
                        chamber_id: deceased.chamber_id ?? '',
                        service_category_id: deceased.service_category_id ?? '',
                        source: deceased.source ?? '',
                    }}
                    chambers={chambers}
                    serviceCategories={serviceCategories}
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
