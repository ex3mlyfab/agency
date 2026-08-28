import { Head } from '@inertiajs/react';
import { DownloadIcon, FileTextIcon } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormData {
    report_type: string;
    date_from: string;
    date_to: string;
}

interface Props {
    can: { generate: boolean };
}

const reportTypes = [
    {
        value: 'deceased_summary',
        label: 'Deceased Summary',
        description:
            'All deceased records with status, chamber assignment, and relative info.',
    },
    {
        value: 'chamber_occupancy',
        label: 'Chamber Occupancy',
        description: 'Current occupancy status and capacity for all chambers.',
    },
    {
        value: 'transfer_log',
        label: 'Transfer Log',
        description:
            'Full history of all chamber entry, transfer, and release events.',
    },
];

export default function ReportsIndex({ can }: Props) {
    const [data, setData] = useState<FormData>({
        report_type: 'deceased_summary',
        date_from: '',
        date_to: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const needsDateRange = data.report_type !== 'chamber_occupancy';

    function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append('report_type', data.report_type);
        if (data.date_from) formData.append('date_from', data.date_from);
        if (data.date_to) formData.append('date_to', data.date_to);

        fetch('/reports/generate', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':
                    document
                        .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                        ?.content ?? '',
            },
            body: formData,
        })
            .then(async (res) => {
                if (!res.ok) {
                    const json = await res.json().catch(() => null);
                    if (json?.errors) {
                        const messages = Object.values(json.errors)
                            .flat()
                            .join('\n');
                        setErrorMessage(messages);
                        return;
                    }
                    setErrorMessage('An unexpected error occurred.');
                    return;
                }

                const contentType = res.headers.get('content-type') ?? '';
                if (contentType.includes('text/csv')) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const dateStr = new Date()
                        .toISOString()
                        .slice(0, 10);
                    a.download = `${data.report_type}_${dateStr}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            })
            .catch(() => {
                setErrorMessage('Network error. Please try again.');
            })
            .finally(() => {
                setProcessing(false);
            });
    }

    return (
        <>
            <Head title="Reports" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Reports
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Generate and download operational reports for the
                        mortuary.
                    </p>
                </div>

                {!can.generate ? (
                    <Alert>
                        <AlertTitle>Access restricted</AlertTitle>
                        <AlertDescription>
                            You do not have permission to generate reports.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertTitle>Validation error</AlertTitle>
                                <AlertDescription>
                                    {errorMessage}
                                </AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <Card>
                                <CardHeader className="border-b border-border px-6 py-3">
                                    <CardTitle className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Report Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-6">
                                    {/* Report type cards */}
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        {reportTypes.map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() =>
                                                    !processing &&
                                                    setData((prev) => ({
                                                        ...prev,
                                                        report_type: r.value,
                                                    }))
                                                }
                                                className={`rounded-lg border p-4 text-left transition-all hover:border-primary/40 ${
                                                    data.report_type === r.value
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:bg-muted/50'
                                                } ${
                                                    processing
                                                        ? 'cursor-not-allowed opacity-60'
                                                        : ''
                                                }`}
                                            >
                                                <div className="mb-2 flex items-center gap-2">
                                                    <FileTextIcon
                                                        className={`h-4 w-4 ${
                                                            data.report_type ===
                                                            r.value
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    />
                                                    <span className="text-sm font-semibold">
                                                        {r.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {r.description}
                                                </p>
                                                {data.report_type ===
                                                    r.value && (
                                                    <div className="mt-2 text-xs font-medium text-primary">
                                                        Selected
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Date range (conditional) */}
                                    {needsDateRange && (
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="date_from"
                                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                                >
                                                    Date From
                                                </Label>
                                                <Input
                                                    id="date_from"
                                                    type="date"
                                                    value={data.date_from}
                                                    onChange={(e) =>
                                                        setData((prev) => ({
                                                            ...prev,
                                                            date_from:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    disabled={processing}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label
                                                    htmlFor="date_to"
                                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                                >
                                                    Date To
                                                </Label>
                                                <Input
                                                    id="date_to"
                                                    type="date"
                                                    value={data.date_to}
                                                    onChange={(e) =>
                                                        setData((prev) => ({
                                                            ...prev,
                                                            date_to:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    disabled={processing}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 flex items-center justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            size="lg"
                                        >
                                            <DownloadIcon className="mr-2 h-4 w-4" />
                                            {processing
                                                ? 'Generating…'
                                                : 'Generate Report'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/reports' }],
};
