import { Head } from '@inertiajs/react';
import { BranchForm } from '@/components/branch-form';

interface Branch {
    id: string;
    name: string;
    slug: string;
    status: string;
}

interface Props {
    branch: Branch;
}

export default function BranchEdit({ branch }: Props) {
    return (
        <>
            <Head title={`Edit — ${branch.name}`} />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Edit Branch
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {branch.name} ({branch.slug})
                    </p>
                </div>
                <BranchForm
                    action={`/branches/${branch.id}`}
                    method="put"
                    submitLabel="Save Changes"
                    initialValues={{
                        name: branch.name,
                        slug: branch.slug,
                        status: branch.status,
                    }}
                />
            </div>
        </>
    );
}

BranchEdit.layout = {
    breadcrumbs: [
        { title: 'Branches', href: '/branches' },
        { title: 'Edit', href: '#' },
    ],
};
