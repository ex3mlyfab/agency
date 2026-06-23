import { Head } from '@inertiajs/react';
import { ChamberForm } from '@/components/chamber-form';

interface Chamber {
    id: number;
    name: string;
    location: string | null;
    capacity: number;
    notes: string | null;
    service_id: string | null;
}

interface Props {
    chamber: Chamber;
    services: { id: string; name: string }[];
}

export default function ChamberEdit({ chamber, services }: Props) {
    return (
        <>
            <Head title={`Edit — ${chamber.name}`} />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Edit Chamber
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {chamber.name}
                    </p>
                </div>
                <ChamberForm
                    action={`/chambers/${chamber.id}`}
                    method="put"
                    services={services}
                    submitLabel="Save Changes"
                    initialValues={{
                        name: chamber.name,
                        location: chamber.location ?? '',
                        capacity: String(chamber.capacity),
                        notes: chamber.notes ?? '',
                        service_id: chamber.service_id ?? '',
                    }}
                />
            </div>
        </>
    );
}

ChamberEdit.layout = {
    breadcrumbs: [
        { title: 'Chambers', href: '/chambers' },
        { title: 'Edit', href: '#' },
    ],
};
