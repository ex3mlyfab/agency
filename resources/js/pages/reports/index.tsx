import { Head, useForm } from '@inertiajs/react';
import { DownloadIcon, FileTextIcon } from 'lucide-react';
import { InputError } from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormData {
    report_type: string;
    date_from: string;
    date_to: string;
    [key: string]: string;
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
    const { data, setData, processing, errors } =
        useForm<FormData>({
            report_type: 'deceased_summary',
            date_from: '',
            date_to: '',
        });

    const needsDateRange = data.report_type !== 'chamber_occupancy';

    function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/reports/generate';

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        if (csrfToken) {
            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = '_token';
            csrf.value = csrfToken;
            form.appendChild(csrf);
        }

        Object.entries(data).forEach(([key, value]) => {
            if (value) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
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
                                                setData('report_type', r.value)
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
                                            {data.report_type === r.value && (
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
                                                    setData(
                                                        'date_from',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={processing}
                                            />
                                            <InputError
                                                message={errors.date_from}
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
                                                    setData(
                                                        'date_to',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={processing}
                                            />
                                            <InputError
                                                message={errors.date_to}
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
                )}
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [{ title: 'Reports', href: '/reports' }],
};
