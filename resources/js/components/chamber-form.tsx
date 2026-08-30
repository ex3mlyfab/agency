import { useForm } from '@inertiajs/react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ChamberFormData {
    name: string;
    location: string;
    capacity: string;
    notes: string;
    service_id: string;
    [key: string]: string;
}

interface ChamberFormProps {
    initialValues?: Partial<ChamberFormData>;
    services?: { id: string; name: string }[];
    action: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
}

export function ChamberForm({
    initialValues = {},
    services = [],
    action,
    method = 'post',
    submitLabel = 'Save Chamber',
}: ChamberFormProps) {
    const { data, setData, submit, processing, errors } =
        useForm<ChamberFormData>({
            name: initialValues.name ?? '',
            location: initialValues.location ?? '',
            capacity: initialValues.capacity ?? '1',
            notes: initialValues.notes ?? '',
            service_id: initialValues.service_id ?? '',
        });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, action);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader className="border-b border-border px-6 py-3">
                    <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Chamber/Rack Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Chamber/Rack Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Chamber A-01"
                            disabled={processing}
                            className={cn(errors.name && 'border-destructive')}
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Location
                        </Label>
                        <Input
                            id="location"
                            value={data.location}
                            onChange={(e) =>
                                setData('location', e.target.value)
                            }
                            placeholder="e.g. Wing A, Ground Floor"
                            disabled={processing}
                        />
                        <InputError message={errors.location} />
                    </div>

                    {/* Capacity */}
                    <div className="space-y-1.5">
                        <Label htmlFor="capacity" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Capacity
                        </Label>
                        <Input
                            id="capacity"
                            type="number"
                            min={1}
                            max={10}
                            value={data.capacity}
                            onChange={(e) =>
                                setData('capacity', e.target.value)
                            }
                            disabled={processing}
                            className={cn(
                                errors.capacity && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.capacity} />
                    </div>

                    {/* Storage Service */}
                    <div className="space-y-1.5">
                        <Label htmlFor="service_id" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Storage Service
                        </Label>
                        <select
                            id="service_id"
                            value={data.service_id}
                            onChange={(e) => setData('service_id', e.target.value)}
                            disabled={processing}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">-- None (No Storage Service) --</option>
                            {services.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.service_id} />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="notes" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Notes
                        </Label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            disabled={processing}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={errors.notes} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" asChild>
                    <a href="/chambers">Cancel</a>
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Savingâ€¦' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
