import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputError } from '@/components/input-error';
import { cn } from '@/lib/utils';

interface ChamberFormData {
    name: string;
    location: string;
    capacity: string;
    notes: string;
    [key: string]: string;
}

interface ChamberFormProps {
    initialValues?: Partial<ChamberFormData>;
    action: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
}

export function ChamberForm({
    initialValues = {},
    action,
    method = 'post',
    submitLabel = 'Save Chamber',
}: ChamberFormProps) {
    const { data, setData, submit, processing, errors } = useForm<ChamberFormData>({
        name: initialValues.name ?? '',
        location: initialValues.location ?? '',
        capacity: initialValues.capacity ?? '1',
        notes: initialValues.notes ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, action);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Chamber Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="font-semibold">
                            Chamber Name <span className="text-destructive">*</span>
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
                        <Label htmlFor="location" className="font-semibold">
                            Location
                        </Label>
                        <Input
                            id="location"
                            value={data.location}
                            onChange={(e) => setData('location', e.target.value)}
                            placeholder="e.g. Wing A, Ground Floor"
                            disabled={processing}
                        />
                        <InputError message={errors.location} />
                    </div>

                    {/* Capacity */}
                    <div className="space-y-1.5">
                        <Label htmlFor="capacity" className="font-semibold">
                            Capacity
                        </Label>
                        <Input
                            id="capacity"
                            type="number"
                            min={1}
                            max={10}
                            value={data.capacity}
                            onChange={(e) => setData('capacity', e.target.value)}
                            disabled={processing}
                            className={cn(errors.capacity && 'border-destructive')}
                        />
                        <InputError message={errors.capacity} />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="notes" className="font-semibold">
                            Notes
                        </Label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            disabled={processing}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    {processing ? 'Saving…' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
