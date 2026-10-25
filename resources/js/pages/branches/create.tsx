import { Head } from '@inertiajs/react';
import { BranchForm } from '@/components/branch-form';

export default function BranchCreate() {
    return (
        <>
            <Head title="Add Branch" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Add Branch
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Register a new branch. Its slug will prefix document
                        numbers for records placed there.
                    </p>
                </div>
                <BranchForm
                    action="/branches"
                    method="post"
                    submitLabel="Create Branch"
                />
            </div>
        </>
    );
}

BranchCreate.layout = {
    breadcrumbs: [
        { title: 'Branches', href: '/branches' },
        { title: 'Add Branch', href: '/branches/create' },
    ],
};
