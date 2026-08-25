import { Head, router } from '@inertiajs/react';
import { Search, Shield, ChevronRight } from 'lucide-react';
import type { FormEvent} from 'react';
import { useState, useMemo } from 'react';
import type { PaginationLink } from '@/components/pagination';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {BreadcrumbItem} from '@/types';

interface Permission {
    id: number | string;
    name: string;
    guard_name: string;
    created_at: string;
}

interface Props {
    permissions: {
        data: Permission[];
        links: PaginationLink[];
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Permissions', href: '/settings/application-settings/permissions' },
];

export default function PermissionsIndex({ permissions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/settings/application-settings/permissions', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    // Group permissions by prefix for better display
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        
        permissions.data.forEach((permission) => {
            const parts = permission.name.split('.');
            const moduleName = parts.length > 1 ? parts[0] : 'general';
            
            if (!groups[moduleName]) {
                groups[moduleName] = [];
            }

            groups[moduleName].push(permission);
        });
        
        return groups;
    }, [permissions.data]);

    return (
        <>
            <Head title="System Permissions" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            System Permissions
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Read-only list of all available system permissions. To assign these, edit a Role.
                        </p>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Search permissions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="secondary" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                <div className="flex-1 space-y-6">
                    {Object.keys(groupedPermissions).length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-card">
                            <p className="text-sm text-muted-foreground">No permissions found.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div key={module} className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
                                    <div className="bg-secondary/30 px-4 py-3 border-b border-border flex items-center justify-between">
                                        <h3 className="font-semibold text-foreground capitalize tracking-wide text-sm flex items-center gap-2">
                                            {module.replace('_', ' ')}
                                            <span className="bg-background text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full border border-border">
                                                {perms.length}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="p-2">
                                        <ul className="space-y-1">
                                            {perms.map((p) => {
                                                const action = p.name.split('.')[1] || p.name;

                                                return (
                                                    <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-secondary/50 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                                                            <span className="font-medium text-foreground">{action}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                            {p.name}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {permissions.total > permissions.data.length && (
                    <div className="mt-4 flex justify-center">
                        <Pagination links={permissions.links} />
                    </div>
                )}
            </div>
        </>
    );
}

PermissionsIndex.layout = { breadcrumbs };
