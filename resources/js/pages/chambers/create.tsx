import { Head } from '@inertiajs/react';
import { ChamberForm } from '@/components/chamber-form';

interface Props {
    services: { id: string; name: string }[];
}

export default function ChamberCreate({ services }: Props) {
    return (
        <>
            <Head title="Add Chamber" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Add Chamber
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Register a new chamber in the mortuary.
                    </p>
                </div>
                <ChamberForm
                    action="/chambers"
                    method="post"
                    services={services}
                    submitLabel="Create Chamber"
                />
            </div>
        </>
    );
}

ChamberCreate.layout = {
    breadcrumbs: [
        { title: 'Chambers', href: '/chambers' },
        { title: 'Add Chamber', href: '/chambers/create' },
    ],
};
