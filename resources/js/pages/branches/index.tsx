import { Head, router } from '@inertiajs/react';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import type { PaginationLink } from '@/components/pagination';
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

interface Branch {
    id: string;
    name: string;
    slug: string;
    status: string;
    chambers_count: number;
}

interface Props {
    branches: {
        data: Branch[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        status?: string;
    };
    can: {
        manage: boolean;
    };
}

export default function BranchesIndex({ branches, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/branches',
            { search },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = (branch: Branch) => {
        if (
            confirm(`Are you sure you want to delete "${branch.name}"?`)
        ) {
            router.delete(`/branches/${branch.id}`);
        }
    };

    return (
        <>
            <Head title="Branches" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Branches</h1>
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Search branches..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            <Button
                                type="submit"
                                variant="secondary"
                                size="icon"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        {can.manage && (
                            <Button
                                onClick={() =>
                                    router.visit('/branches/create')
                                }
                                className="flex items-center gap-1.5"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Branch</span>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Chambers</TableHead>
                                {can.manage && (
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-6 text-center text-muted-foreground"
                                    >
                                        No branches found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.data.map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">
                                            {branch.name}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs uppercase">
                                            {branch.slug}
                                        </TableCell>
                                        <TableCell>
                                            {branch.status === 'Active' ? (
                                                <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                                                    Inactive
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {branch.chambers_count}
                                        </TableCell>
                                        {can.manage && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            router.visit(
                                                                `/branches/${branch.id}/edit`,
                                                            )
                                                        }
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDelete(
                                                                branch,
                                                            )
                                                        }
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                <Pagination links={branches.links} />
            </div>
        </>
    );
}
