import { Head } from '@inertiajs/react';
import { DeceasedForm } from '@/components/deceased-form';

interface Chamber {
    id: string;
    name: string;
}

interface Props {
    chambers: Chamber[];
}

export default function DeceasedCreate({ chambers }: Props) {
    return (
        <>
            <Head title="New Deceased Record" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        New Deceased Record
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Complete all required fields to register a new deceased
                        record.
                    </p>
                </div>

                <DeceasedForm
                    action="/deceased"
                    method="post"
                    submitLabel="Create Record"
                    chambers={chambers}
                />
            </div>
        </>
    );
}

DeceasedCreate.layout = {
    breadcrumbs: [
        { title: 'Deceased', href: '/deceased' },
        { title: 'New Record', href: '/deceased/create' },
    ],
};
