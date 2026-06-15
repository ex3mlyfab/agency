import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { OpsPulse } from '@/components/ops-pulse';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <OpsPulse
                    // Backend props are intentionally optional for now.
                    // When activity/occupancy props are wired from the server,
                    // these can be populated without changing the component UX.
                    latestEvents={null}
                    occupancy={null}
                    ctas={null}
                    className="min-h-[240px]"
                />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
