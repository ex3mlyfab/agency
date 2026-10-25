import { Head } from '@inertiajs/react';
import { ChamberForm } from '@/components/chamber-form';

interface Props {
    services: { id: string; name: string }[];
    branches: { id: string; name: string }[];
}

export default function ChamberCreate({ services, branches }: Props) {
    return (
        <>
            <Head title="Add Rack" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Add Rack
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Register a new rack in the mortuary.
                    </p>
                </div>
                <ChamberForm
                    action="/chambers"
                    method="post"
                    services={services}
                    branches={branches}
                    submitLabel="Create Rack"
                />
            </div>
        </>
    );
}

ChamberCreate.layout = {
    breadcrumbs: [
        { title: 'Coldrooms', href: '/chambers' },
        { title: 'Add Rack', href: '/chambers/create' },
    ],
};
