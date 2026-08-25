import { Head, Link, router } from '@inertiajs/react';
import { Search, Plus, PencilIcon, TrashIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { PaginationLink } from '@/components/pagination';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {BreadcrumbItem} from '@/types';

interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    created_at: string;
}

interface Props {
    users: {
        data: User[];
        links: PaginationLink[];
        total: number;
        from: number;
        to: number;
    };
    filters: { search?: string };
    can: { manage: boolean };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Users', href: '/settings/application-settings/users' },
];

export default function UsersIndex({ users, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/settings/application-settings/users', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        setIsDeleting(true);
        router.delete(`/settings/application-settings/users/${deleteTarget}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <>
            <Head title="User Management" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">User Management</h1>
                        {users.total > 0 && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Showing {users.from}–{users.to} of {users.total} users
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            <Button type="submit" variant="secondary" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        {can.manage && (
                            <Button asChild>
                                <Link href="/settings/application-settings/users/create">
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    New User
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                {can.manage && (
                                    <TableHead className="w-24 text-right">Actions</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={can.manage ? 5 : 4} className="py-8 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20 capitalize"
                                                        >
                                                            {role}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No role</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        {can.manage && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/settings/application-settings/users/${user.id}/edit`}>
                                                            <PencilIcon className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(user.id)}
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination links={users.links} />
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete User"
                description="This action cannot be undone. The user will permanently lose access to the system."
                confirmLabel="Delete User"
                isDestructive
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
}

UsersIndex.layout = { breadcrumbs };
