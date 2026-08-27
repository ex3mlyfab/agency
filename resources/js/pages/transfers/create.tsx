import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { InputError } from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DeceasedOption {
    id: number;
    first_name: string;
    last_name: string;
    status: string;
    chamber_id: number | null;
}

interface ChamberOption {
    id: number;
    name: string;
    location: string | null;
}

interface FormData {
    deceased_id: string;
    to_chamber_id: string;
    event_type: string;
    notes: string;
    [key: string]: string;
}

interface Props {
    deceasedOptions: DeceasedOption[];
    chamberOptions: ChamberOption[];
}

export default function TransferCreate({
    deceasedOptions,
    chamberOptions,
}: Props) {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        deceased_id: '',
        to_chamber_id: '',
        event_type: 'Entered',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setConfirmOpen(true);
    }

    function handleConfirm() {
        post('/transfers', {
            onFinish: () => setConfirmOpen(false),
        });
    }

    const selectedDeceased = deceasedOptions.find(
        (d) => String(d.id) === data.deceased_id,
    );
    const selectedChamber = chamberOptions.find(
        (c) => String(c.id) === data.to_chamber_id,
    );

    const confirmDescription =
        data.event_type === 'Released'
            ? `${selectedDeceased?.first_name ?? ''} ${selectedDeceased?.last_name ?? ''} will be marked as Released.`
            : `${selectedDeceased?.first_name ?? ''} ${selectedDeceased?.last_name ?? ''} will be moved to ${selectedChamber?.name ?? 'selected chamber'}.`;

    return (
        <>
            <Head title="Record Transfer" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Record Transfer
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Record a chamber entry, transfer, or release event.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-3">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Transfer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                            {/* Deceased */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label
                                    htmlFor="deceased_id"
                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                >
                                    Deceased{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.deceased_id}
                                    onValueChange={(val) =>
                                        setData('deceased_id', val)
                                    }
                                    disabled={processing}
                                >
                                    <SelectTrigger
                                        id="deceased_id"
                                        className={cn(
                                            errors.deceased_id &&
                                                'border-destructive',
                                        )}
                                    >
                                        <SelectValue placeholder="Select deceasedâ€¦" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deceasedOptions.map((d) => (
                                            <SelectItem
                                                key={d.id}
                                                value={String(d.id)}
                                            >
                                                {d.first_name} {d.last_name} â€”{' '}
                                                {d.status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.deceased_id} />
                            </div>

                            {/* Event type */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="event_type"
                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                >
                                    Event Type{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.event_type}
                                    onValueChange={(val) =>
                                        setData('event_type', val)
                                    }
                                    disabled={processing}
                                >
                                    <SelectTrigger id="event_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entered">
                                            Entered
                                        </SelectItem>
                                        <SelectItem value="Transferred">
                                            Transferred
                                        </SelectItem>
                                        <SelectItem value="Released">
                                            Released
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.event_type} />
                            </div>

                            {/* Target chamber (hidden for Released) */}
                            {data.event_type !== 'Released' && (
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="to_chamber_id"
                                        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                    >
                                        Target Chamber
                                    </Label>
                                    <Select
                                        value={data.to_chamber_id}
                                        onValueChange={(val) =>
                                            setData('to_chamber_id', val)
                                        }
                                        disabled={processing}
                                    >
                                        <SelectTrigger
                                            id="to_chamber_id"
                                            className={cn(
                                                errors.to_chamber_id &&
                                                    'border-destructive',
                                            )}
                                        >
                                            <SelectValue placeholder="Select chamberâ€¦" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {chamberOptions.map((c) => (
                                                <SelectItem
                                                    key={c.id}
                                                    value={String(c.id)}
                                                >
                                                    {c.name}
                                                    {c.location
                                                        ? ` â€” ${c.location}`
                                                        : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.to_chamber_id}
                                    />
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label
                                    htmlFor="notes"
                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                >
                                    Notes
                                </Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    rows={3}
                                    disabled={processing}
                                    placeholder="Reason for transfer, special instructionsâ€¦"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {data.event_type === 'Released' && (
                        <Alert>
                            <AlertDescription>
                                Selecting <strong>Released</strong> will mark
                                the deceased as released and remove them from
                                their current chamber.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <a href="/transfers">Cancel</a>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.deceased_id}
                            variant={
                                data.event_type === 'Released'
                                    ? 'destructive'
                                    : 'default'
                            }
                        >
                            Review Transfer
                        </Button>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={`Confirm ${data.event_type}`}
                description={confirmDescription}
                confirmLabel={`Confirm ${data.event_type}`}
                isDestructive={data.event_type === 'Released'}
                isLoading={processing}
                onConfirm={handleConfirm}
            />
        </>
    );
}

TransferCreate.layout = {
    breadcrumbs: [
        { title: 'Transfers', href: '/transfers' },
        { title: 'Record Transfer', href: '/transfers/create' },
    ],
};
