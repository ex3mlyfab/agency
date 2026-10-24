import { Head, router } from '@inertiajs/react';
import {
    ClockIcon,
    SearchIcon,
    XIcon,
    UserIcon,
    ActivityIcon,
    FileTextIcon,
    DatabaseIcon,
    FilterIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

import type { PaginationLink } from '@/components/pagination';
import { Pagination } from '@/components/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index } from '@/routes/application-settings/audits';
import type { BreadcrumbItem } from '@/types';

interface Audit {
    id: number;
    log_name: string;
    description: string;
    subject_type: string | null;
    subject_id: string | number | null;
    causer: {
        name: string;
    } | null;
    properties: Record<string, any>;
    created_at: string;
}

interface Props {
    audits: {
        data: Audit[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Audits', href: '/settings/application-settings/audits' },
];

const logNameIcons: Record<string, React.ReactNode> = {
    default: <DatabaseIcon className="h-3 w-3" />,
    'App\Models\Deceased': <FileTextIcon className="h-3 w-3" />,
    'App\Models\Chamber': <ActivityIcon className="h-3 w-3" />,
    'App\Models\Transfer': <ActivityIcon className="h-3 w-3" />,
    'App\Models\User': <UserIcon className="h-3 w-3" />,
    'App\Models\Service': <FileTextIcon className="h-3 w-3" />,
};

function getLogNameIcon(logName: string) {
    if (logName.includes('Deceased')) {
        return <FileTextIcon className="h-3 w-3" />;
    }

    if (logName.includes('Chamber') || logName.includes('Transfer')) {
        return <ActivityIcon className="h-3 w-3" />;
    }

    if (logName.includes('User')) {
        return <UserIcon className="h-3 w-3" />;
    }

    return <DatabaseIcon className="h-3 w-3" />;
}

function getDescriptionIcon(description: string): string {
    if (description.includes('entered') || description.includes('Admitted')) {
        return 'bg-success/15 text-success border border-success/30';
    }

    if (
        description.includes('transferred') ||
        description.includes('Transfer')
    ) {
        return 'bg-info/15 text-info border border-info/30';
    }

    if (
        description.includes('released') ||
        description.includes('Released') ||
        description.includes('Discharged')
    ) {
        return 'bg-muted text-foreground border border-border';
    }

    if (description.includes('created') || description.includes('Created')) {
        return 'bg-success/15 text-success border border-success/30';
    }

    if (
        description.includes('updated') ||
        description.includes('Updated') ||
        description.includes('changed')
    ) {
        return 'bg-warning/15 text-warning border border-warning/30';
    }

    if (description.includes('deleted') || description.includes('Deleted')) {
        return 'bg-destructive/15 text-destructive border border-destructive/30';
    }

    return 'bg-secondary text-secondary-foreground border-border';
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return 'Just now';
    }

    if (diffMins < 60) {
        return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AuditsIndex({ audits, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(index.url({ query: { search } }), undefined, {
            preserveState: true,
            replace: true,
        });
    };

    function clearSearch() {
        setSearch('');
        router.get(index.url(), undefined, {
            preserveState: true,
            replace: true,
        });
    }

    function toggleExpand(id: number) {
        setExpandedRows((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }

    const logNameCounts: Record<string, number> = {};
    audits.data.forEach((audit) => {
        logNameCounts[audit.log_name] =
            (logNameCounts[audit.log_name] ?? 0) + 1;
    });

    const totalEvents = audits.data.length;
    const uniqueUsers = new Set(
        audits.data.map((a) => a.causer?.name).filter(Boolean),
    ).size;
    const systemEvents = audits.data.filter((a) => !a.causer?.name).length;

    return (
        <>
            <Head title="Audit Log" />
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            Audit Log
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track every action across the system — who did what,
                            and when.
                        </p>
                    </div>
                    <form
                        onSubmit={handleSearch}
                        className="flex w-full items-center gap-2 sm:w-auto"
                    >
                        <div className="relative flex-1 sm:w-72">
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search logs…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleSearch(e)
                                }
                                className="pr-9 pl-9"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="secondary" size="icon">
                            <SearchIcon className="h-4 w-4" />
                        </Button>
                    </form>
                </div>

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-primary bg-primary/[0.07]">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <ActivityIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl leading-none font-bold">
                                    {audits.data.length}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Total Events
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-success bg-success/[0.07]">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                                <UserIcon className="h-4 w-4 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl leading-none font-bold">
                                    {uniqueUsers}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Active Users
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-warning bg-warning/[0.07]">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl leading-none font-bold">
                                    {Object.keys(logNameCounts).length}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Log Categories
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-highlight bg-highlight/[0.07]">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
                                <ClockIcon className="h-4 w-4 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl leading-none font-bold">
                                    {systemEvents}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    System Events
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Log category badges */}
                {Object.keys(logNameCounts).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {Object.entries(logNameCounts).map(
                            ([logName, count]) => (
                                <Badge
                                    key={logName}
                                    variant="outline"
                                    className="gap-1.5 px-2 py-0.5 text-xs"
                                >
                                    <span className="opacity-60">
                                        {getLogNameIcon(logName)}
                                    </span>
                                    {logName.split('\\').pop() ?? logName}
                                    <span className="ml-1 opacity-50">
                                        ×{count}
                                    </span>
                                </Badge>
                            ),
                        )}
                    </div>
                )}

                {/* Audit Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="w-36">
                                        Timestamp
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audits.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="h-24 text-center"
                                        >
                                            <Alert
                                                variant="default"
                                                className="rounded-lg border-dashed"
                                            >
                                                <AlertDescription className="text-muted-foreground">
                                                    No audit events found.
                                                    {search &&
                                                        ' No events match your search.'}
                                                </AlertDescription>
                                            </Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.data.map((audit) => {
                                        const isExpanded = expandedRows.has(
                                            audit.id,
                                        );
                                        const statusClass = getDescriptionIcon(
                                            audit.description,
                                        );
                                        const subjectLabel = audit.subject_type
                                            ? audit.subject_type
                                                  .split('\\')
                                                  .pop()
                                            : null;

                                        return (
                                            <>
                                                <TableRow
                                                    key={audit.id}
                                                    className="group"
                                                >
                                                    <TableCell className="py-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`h-6 w-6 p-0 transition-transform ${isExpanded ? '' : 'rotate-0'}`}
                                                            onClick={() =>
                                                                toggleExpand(
                                                                    audit.id,
                                                                )
                                                            }
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUpIcon className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <ChevronDownIcon className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                                                        >
                                                            {getLogNameIcon(
                                                                audit.log_name,
                                                            )}
                                                            {audit.log_name
                                                                .split('\\')
                                                                .pop() ??
                                                                audit.log_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-md py-3">
                                                        <div className="space-y-1">
                                                            <p className="line-clamp-1 text-sm font-medium text-foreground">
                                                                {
                                                                    audit.description
                                                                }
                                                            </p>
                                                            {isExpanded && (
                                                                <div className="space-y-1 pt-1">
                                                                    {audit.properties &&
                                                                        Object.keys(
                                                                            audit.properties,
                                                                        )
                                                                            .length >
                                                                            0 && (
                                                                            <div className="space-y-0.5">
                                                                                {Object.entries(
                                                                                    audit.properties,
                                                                                ).map(
                                                                                    ([
                                                                                        key,
                                                                                        value,
                                                                                    ]) => (
                                                                                        <div
                                                                                            key={
                                                                                                key
                                                                                            }
                                                                                            className="flex gap-2 text-xs"
                                                                                        >
                                                                                            <span className="shrink-0 font-medium text-muted-foreground">
                                                                                                {
                                                                                                    key
                                                                                                }
                                                                                                :
                                                                                            </span>
                                                                                            <span className="break-all text-foreground">
                                                                                                {typeof value ===
                                                                                                'object'
                                                                                                    ? JSON.stringify(
                                                                                                          value,
                                                                                                      )
                                                                                                    : String(
                                                                                                          value,
                                                                                                      )}
                                                                                            </span>
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                                {(
                                                                    audit.causer
                                                                        ?.name ??
                                                                    'S'
                                                                )
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <span className="text-sm text-foreground">
                                                                {audit.causer
                                                                    ?.name ??
                                                                    'System'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {subjectLabel &&
                                                        audit.subject_id ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                {subjectLabel} #
                                                                {
                                                                    audit.subject_id
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(
                                                                    audit.created_at,
                                                                )}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground/60">
                                                                {formatFullDate(
                                                                    audit.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {audits.links.length > 3 && <Pagination links={audits.links} />}
            </div>
        </>
    );
}

AuditsIndex.layout = {
    breadcrumbs,
};
