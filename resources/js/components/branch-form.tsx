import { useForm } from '@inertiajs/react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface BranchFormData {
    name: string;
    slug: string;
    status: string;
    [key: string]: string;
}

interface BranchFormProps {
    initialValues?: Partial<BranchFormData>;
    action: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
}

export function BranchForm({
    initialValues = {},
    action,
    method = 'post',
    submitLabel = 'Save Branch',
}: BranchFormProps) {
    const { data, setData, submit, processing, errors } = useForm<BranchFormData>(
        {
            name: initialValues.name ?? '',
            slug: initialValues.slug ?? '',
            status: initialValues.status ?? 'Active',
        },
    );

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, action);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader className="border-b border-border/60 bg-secondary/50 px-6 py-3 dark:bg-secondary/30">
                    <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Branch Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="name"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Branch Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Ikeja Branch"
                            disabled={processing}
                            className={cn(
                                errors.name && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="slug"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Slug
                        </Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="Auto-generated from name"
                            disabled={processing}
                            className={cn(
                                errors.slug && 'border-destructive',
                            )}
                        />
                        <p className="text-xs text-muted-foreground">
                            Used to prefix invoice and receipt numbers (e.g.
                            INV-IKEJA-XXXXXXXX). Leave blank to auto-generate.
                        </p>
                        <InputError message={errors.slug} />
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="status"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Status <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.status}
                            onValueChange={(val) => setData('status', val)}
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="status"
                                className={cn(
                                    errors.status && 'border-destructive',
                                )}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">
                                    Active
                                </SelectItem>
                                <SelectItem value="Inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Inactive branches cannot receive new chamber
                            placements.
                        </p>
                        <InputError message={errors.status} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" asChild>
                    <a href="/branches">Cancel</a>
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
