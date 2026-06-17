import { useState, FormEvent } from 'react';
import { Head, router } from '@inertiajs/react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationLink } from '@/components/pagination';
import { Search } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { index } from '@/routes/application-settings/roles';

interface Role {
    id: number | string;
    name: string;
    guard_name: string;
    created_at: string;
}

interface Props {
    roles: {
        data: Role[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Roles', href: '/settings/application-settings/roles' },
];

export default function RolesIndex({ roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(index.url({ query: { search } }), undefined, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Roles" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Roles</h1>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Search roles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="secondary" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                <div className="flex-1 overflow-auto rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Guard</TableHead>
                                <TableHead>Created At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center"
                                    >
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.data.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-mono text-xs">
                                            {role.id}
                                        </TableCell>
                                        <TableCell>{role.name}</TableCell>
                                        <TableCell>{role.guard_name}</TableCell>
                                        <TableCell>
                                            {new Date(
                                                role.created_at,
                                            ).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination links={roles.links} />
            </div>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs,
};
