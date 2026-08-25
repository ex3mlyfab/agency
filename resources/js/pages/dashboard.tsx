import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Users,
    ScrollText,
    ClipboardList,
    PlusCircle,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';

import { useState } from 'react';
import { OpsPulse } from '@/components/ops-pulse';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';

interface DashboardStats {
    totalChambers: number;
    totalCapacity: number;
    occupiedChambers: number;
    emptyChambers: number;
    occupancyRate: number;
    pendingAdmissions: number;
    totalReleases: number;
}

interface OccupancyItem {
    chamberId: string;
    chamberName: string;
    status: 'In use' | 'Empty';
    daysInChamber: number | null;
}

interface LatestEvent {
    id: string;
    occurredAt: string;
    type: string;
    label: string;
    actor: string;
}

interface TrendItem {
    date: string;
    label: string;
    admissions: number;
    releases: number;
}

interface Props {
    stats: DashboardStats;
    occupancy: OccupancyItem[];
    latestEvents: LatestEvent[];
    trendData: TrendItem[];
    can: {
        createDeceased: boolean;
        manageChambers: boolean;
        createTransfer: boolean;
        viewReports: boolean;
        viewHistory: boolean;
    };
}

export default function Dashboard({
    stats,
    occupancy,
    latestEvents,
    trendData,
    can,
}: Props) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    // Chart dimensions & scaling
    const width = 500;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(
        ...(trendData?.map((d) => Math.max(d.admissions, d.releases)) ?? [0]),
    );
    const maxY = maxVal > 0 ? Math.ceil(maxVal * 1.25) : 4; // safe height ceiling

    // Generate grid line values
    const gridLinesCount = 4;
    const gridLineValues = Array.from({ length: gridLinesCount + 1 }, (_, i) =>
        Math.round((maxY / gridLinesCount) * i),
    );

    const getX = (index: number) =>
        paddingLeft + (index * chartWidth) / ((trendData?.length || 1) - 1);
    const getY = (value: number) =>
        height - paddingBottom - (value * chartHeight) / maxY;

    // Build SVG paths
    const admissionsPoints =
        trendData?.map((d, i) => `${getX(i)},${getY(d.admissions)}`) || [];
    const admissionsPath =
        admissionsPoints.length > 0 ? `M ${admissionsPoints.join(' L ')}` : '';
    const admissionsArea =
        admissionsPoints.length > 0
            ? `M ${getX(0)},${height - paddingBottom} L ${admissionsPoints.join(' L ')} L ${getX((trendData?.length || 1) - 1)},${height - paddingBottom} Z`
            : '';

    const releasesPoints =
        trendData?.map((d, i) => `${getX(i)},${getY(d.releases)}`) || [];
    const releasesPath =
        releasesPoints.length > 0 ? `M ${releasesPoints.join(' L ')}` : '';
    const releasesArea =
        releasesPoints.length > 0
            ? `M ${getX(0)},${height - paddingBottom} L ${releasesPoints.join(' L ')} L ${getX((trendData?.length || 1) - 1)},${height - paddingBottom} Z`
            : '';

    const availableSlots = Math.max(
        0,
        stats.totalCapacity - stats.occupiedChambers,
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header Welcome Bar */}
                <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Mortuary Operations
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Real-time facility occupancy, case tracking, and
                            audit log.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                            Live updates active
                        </span>
                    </div>
                </div>

                {/* Key Metric Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Chamber Occupancy */}
                    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Chamber Occupancy
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline space-x-1.5">
                                <span className="text-2xl font-bold">
                                    {stats.occupiedChambers}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {stats.totalCapacity} slots
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-1.5 rounded-full bg-indigo-600 transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, stats.occupancyRate)}%`,
                                    }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Occupancy Rate</span>
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                    {stats.occupancyRate}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available Slots */}
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Available Slots
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {availableSlots}
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                {stats.emptyChambers} empty chambers
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pending Assignment */}
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Admissions
                            </CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.pendingAdmissions}
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                Awaiting chamber setup
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Released Cases */}
                    <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Discharged Cases
                            </CardTitle>
                            <Users className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalReleases}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Successfully released records
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid: Chart & Quick Actions */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Trend Chart (2 cols) */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold">
                                        Operations Trend
                                    </CardTitle>
                                    <CardDescription>
                                        Daily admissions vs releases (last 7
                                        days)
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                                        Admissions
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                        Releases
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pt-2">
                                {/* Interactive Tooltip Overlay */}
                                {hoveredIdx !== null &&
                                    trendData &&
                                    trendData[hoveredIdx] && (
                                        <div
                                            className="pointer-events-none absolute z-10 space-y-1 rounded-lg border border-border bg-background/95 p-2.5 text-xs shadow-md backdrop-blur-xs transition-all"
                                            style={{
                                                left: `${Math.min(getX(hoveredIdx) + 10, width - 130)}px`,
                                                top: `10px`,
                                            }}
                                        >
                                            <div className="font-bold text-muted-foreground">
                                                {trendData[hoveredIdx].label}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                                <span>
                                                    Admissions:{' '}
                                                    <strong>
                                                        {
                                                            trendData[
                                                                hoveredIdx
                                                            ].admissions
                                                        }
                                                    </strong>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                <span>
                                                    Releases:{' '}
                                                    <strong>
                                                        {
                                                            trendData[
                                                                hoveredIdx
                                                            ].releases
                                                        }
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                {/* Custom SVG Line Chart */}
                                <svg
                                    viewBox={`0 0 ${width} ${height}`}
                                    className="h-auto w-full overflow-visible"
                                >
                                    <defs>
                                        {/* Gradients for Areas */}
                                        <linearGradient
                                            id="colorAdmissions"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#6366f1"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#6366f1"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="colorReleases"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#10b981"
                                                stopOpacity={0.25}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#10b981"
                                                stopOpacity={0.0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    {/* Gridlines */}
                                    {gridLineValues.map((val, idx) => {
                                        const y = getY(val);

                                        return (
                                            <g
                                                key={idx}
                                                className="opacity-15 dark:opacity-10"
                                            >
                                                <line
                                                    x1={paddingLeft}
                                                    y1={y}
                                                    x2={width - paddingRight}
                                                    y2={y}
                                                    stroke="currentColor"
                                                    strokeWidth={1}
                                                    strokeDasharray={
                                                        val === 0
                                                            ? 'none'
                                                            : '3,3'
                                                    }
                                                />
                                                <text
                                                    x={paddingLeft - 8}
                                                    y={y + 4}
                                                    textAnchor="end"
                                                    className="fill-muted-foreground text-[10px]"
                                                >
                                                    {val}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* X-axis labels */}
                                    {trendData?.map((d, i) => (
                                        <text
                                            key={i}
                                            x={getX(i)}
                                            y={height - paddingBottom + 18}
                                            textAnchor="middle"
                                            className="fill-muted-foreground text-[10px] opacity-80"
                                        >
                                            {d.label}
                                        </text>
                                    ))}

                                    {/* Areas */}
                                    {admissionsArea && (
                                        <path
                                            d={admissionsArea}
                                            fill="url(#colorAdmissions)"
                                        />
                                    )}
                                    {releasesArea && (
                                        <path
                                            d={releasesArea}
                                            fill="url(#colorReleases)"
                                        />
                                    )}

                                    {/* Trend Lines */}
                                    {admissionsPath && (
                                        <path
                                            d={admissionsPath}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth={2.5}
                                            strokeLinecap="round"
                                            className="transition-all duration-300"
                                        />
                                    )}
                                    {releasesPath && (
                                        <path
                                            d={releasesPath}
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth={2.5}
                                            strokeLinecap="round"
                                            className="transition-all duration-300"
                                        />
                                    )}

                                    {/* Vertical guide line on hover */}
                                    {hoveredIdx !== null && (
                                        <line
                                            x1={getX(hoveredIdx)}
                                            y1={paddingTop}
                                            x2={getX(hoveredIdx)}
                                            y2={height - paddingBottom}
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                            strokeDasharray="4,4"
                                            className="opacity-30 dark:opacity-20"
                                        />
                                    )}

                                    {/* Highlight dots on hover */}
                                    {hoveredIdx !== null &&
                                        trendData &&
                                        trendData[hoveredIdx] && (
                                            <>
                                                {/* Admissions Dot */}
                                                <circle
                                                    cx={getX(hoveredIdx)}
                                                    cy={getY(
                                                        trendData[hoveredIdx]
                                                            .admissions,
                                                    )}
                                                    r={5}
                                                    fill="#6366f1"
                                                    stroke="white"
                                                    strokeWidth={1.5}
                                                />
                                                {/* Releases Dot */}
                                                <circle
                                                    cx={getX(hoveredIdx)}
                                                    cy={getY(
                                                        trendData[hoveredIdx]
                                                            .releases,
                                                    )}
                                                    r={5}
                                                    fill="#10b981"
                                                    stroke="white"
                                                    strokeWidth={1.5}
                                                />
                                            </>
                                        )}

                                    {/* Invisible interactive hover rects */}
                                    {trendData?.map((_, i) => {
                                        const x = getX(i);
                                        const stepWidth =
                                            chartWidth / (trendData.length - 1);
                                        const hoverWidth =
                                            i === 0 ||
                                            i === trendData.length - 1
                                                ? stepWidth / 2
                                                : stepWidth;
                                        const hoverX =
                                            i === 0 ? x : x - stepWidth / 2;

                                        return (
                                            <rect
                                                key={i}
                                                x={hoverX}
                                                y={paddingTop}
                                                width={hoverWidth}
                                                height={chartHeight}
                                                fill="transparent"
                                                className="cursor-crosshair"
                                                onMouseEnter={() =>
                                                    setHoveredIdx(i)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredIdx(null)
                                                }
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions (1 col) */}
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Quick Actions
                            </CardTitle>
                            <CardDescription>
                                Mortuary workflow shortcuts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {can.createDeceased ? (
                                <Button
                                    asChild
                                    className="w-full justify-start text-left"
                                    variant="default"
                                >
                                    <Link href="/deceased/create">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Register Deceased
                                    </Link>
                                </Button>
                            ) : null}

                            {can.createTransfer ? (
                                <Button
                                    asChild
                                    className="w-full justify-start text-left"
                                    variant="outline"
                                >
                                    <Link href="/transfers">
                                        <ArrowRightLeft className="mr-2 h-4 w-4 text-indigo-500" />
                                        Transfer Chamber
                                    </Link>
                                </Button>
                            ) : null}

                            <Button
                                asChild
                                className="w-full justify-start text-left"
                                variant="outline"
                            >
                                <Link href="/deceased">
                                    <Users className="mr-2 h-4 w-4 text-emerald-500" />
                                    Release Deceased (Select Record)
                                </Link>
                            </Button>

                            {can.viewReports ? (
                                <Button
                                    asChild
                                    className="w-full justify-start text-left"
                                    variant="outline"
                                >
                                    <Link href="/reports">
                                        <ScrollText className="mr-2 h-4 w-4 text-amber-500" />
                                        Reports & Export
                                    </Link>
                                </Button>
                            ) : null}

                            {can.viewHistory ? (
                                <Button
                                    asChild
                                    className="w-full justify-start text-left"
                                    variant="outline"
                                >
                                    <Link href="/transfers">
                                        <ClipboardList className="mr-2 h-4 w-4 text-slate-500" />
                                        View Action History
                                    </Link>
                                </Button>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Snapshot and Audit events */}
                <div className="mt-2">
                    <OpsPulse
                        latestEvents={latestEvents}
                        occupancy={occupancy}
                        ctas={{
                            historyHref: '/transfers',
                            reportsHref: '/reports',
                        }}
                    />
                </div>
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
