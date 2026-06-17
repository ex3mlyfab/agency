import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputError } from '@/components/input-error';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CameraIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface DeceasedFormData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    date_of_death: string;
    gender: string;
    cause_of_death: string;
    notes: string;
    relative_name: string;
    relative_phone: string;
    relative_relationship: string;
    relative_address: string;
    chamber_id: string;
    stored_at: string;
    picture?: File | null | string;
    [key: string]: string | File | null | undefined;
}

interface DeceasedFormProps {
    initialValues?: Partial<DeceasedFormData>;
    action: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
    cancelHref?: string;
    chambers?: { id: string; name: string }[];
}

export function DeceasedForm({
    initialValues = {},
    action,
    method = 'post',
    submitLabel = 'Save Record',
    cancelHref = '/deceased',
    chambers = [],
}: DeceasedFormProps) {
    const { data, setData, submit, processing, errors } =
        useForm<DeceasedFormData>({
            first_name: initialValues.first_name ?? '',
            last_name: initialValues.last_name ?? '',
            date_of_birth: initialValues.date_of_birth ?? '',
            date_of_death: initialValues.date_of_death ?? '',
            gender: initialValues.gender ?? 'Male',
            cause_of_death: initialValues.cause_of_death ?? '',
            notes: initialValues.notes ?? '',
            relative_name: initialValues.relative_name ?? '',
            relative_phone: initialValues.relative_phone ?? '',
            relative_relationship: initialValues.relative_relationship ?? '',
            relative_address: initialValues.relative_address ?? '',
            chamber_id: initialValues.chamber_id ?? '',
            stored_at: initialValues.stored_at ?? '',
            picture: null,
        });

    const [previewUrl, setPreviewUrl] = useState<string | null>(
        typeof initialValues.picture === 'string' && initialValues.picture
            ? `/storage/${initialValues.picture}`
            : null,
    );

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // If updating and there's a file, we might need to spoof PUT
        if (method === 'put' || method === 'patch') {
            submit('post', `${action}?_method=${method.toUpperCase()}`);
        } else {
            submit(method, action);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Deceased identity */}
            <Card>
                <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                    <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Deceased Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* First Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="first_name" className="font-semibold">
                            First Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="first_name"
                            value={data.first_name}
                            onChange={(e) =>
                                setData('first_name', e.target.value)
                            }
                            placeholder="e.g. John"
                            disabled={processing}
                            className={cn(
                                errors.first_name && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.first_name} />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="last_name" className="font-semibold">
                            Last Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="last_name"
                            value={data.last_name}
                            onChange={(e) =>
                                setData('last_name', e.target.value)
                            }
                            placeholder="e.g. Doe"
                            disabled={processing}
                            className={cn(
                                errors.last_name && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.last_name} />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="date_of_birth"
                            className="font-semibold"
                        >
                            Date of Birth
                        </Label>
                        <DatePicker
                            value={
                                data.date_of_birth
                                    ? parseISO(data.date_of_birth)
                                    : undefined
                            }
                            onChange={(date) =>
                                setData(
                                    'date_of_birth',
                                    date ? format(date, 'yyyy-MM-dd') : '',
                                )
                            }
                            disabled={processing}
                            className={cn(
                                errors.date_of_birth && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.date_of_birth} />
                    </div>

                    {/* Date of Death */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="date_of_death"
                            className="font-semibold"
                        >
                            Date of Death{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <DatePicker
                            value={
                                data.date_of_death
                                    ? parseISO(data.date_of_death)
                                    : undefined
                            }
                            onChange={(date) =>
                                setData(
                                    'date_of_death',
                                    date ? format(date, 'yyyy-MM-dd') : '',
                                )
                            }
                            disabled={processing}
                            className={cn(
                                errors.date_of_death && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.date_of_death} />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <Label htmlFor="gender" className="font-semibold">
                            Gender <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.gender}
                            onValueChange={(val) => setData('gender', val)}
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="gender"
                                className={cn(
                                    errors.gender && 'border-destructive',
                                )}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.gender} />
                    </div>

                    {/* Cause of Death */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="cause_of_death"
                            className="font-semibold"
                        >
                            Cause of Death
                        </Label>
                        <Input
                            id="cause_of_death"
                            value={data.cause_of_death}
                            onChange={(e) =>
                                setData('cause_of_death', e.target.value)
                            }
                            placeholder="e.g. Cardiac arrest"
                            disabled={processing}
                        />
                        <InputError message={errors.cause_of_death} />
                    </div>

                    {/* Picture Upload */}
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="picture" className="font-semibold">
                            Picture
                        </Label>
                        <div className="mt-2 flex items-center gap-4">
                            <Avatar className="h-20 w-20 border shadow-sm">
                                <AvatarImage
                                    src={previewUrl || undefined}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-muted">
                                    <CameraIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="picture"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file =
                                            e.target.files?.[0] || null;
                                        setData('picture', file);
                                        if (file) {
                                            setPreviewUrl(
                                                URL.createObjectURL(file),
                                            );
                                        } else {
                                            setPreviewUrl(
                                                typeof initialValues.picture ===
                                                    'string' &&
                                                    initialValues.picture
                                                    ? `/storage/${initialValues.picture}`
                                                    : null,
                                            );
                                        }
                                    }}
                                    disabled={processing}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        document
                                            .getElementById('picture')
                                            ?.click()
                                    }
                                    disabled={processing}
                                >
                                    Select New Picture
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    JPEG, PNG or GIF up to 2MB.
                                </p>
                            </div>
                        </div>
                        <InputError message={errors.picture} />
                    </div>

                    {/* Chamber Selection */}
                    <div className="space-y-1.5">
                        <Label htmlFor="chamber_id" className="font-semibold">
                            Chamber Assignment
                        </Label>
                        <Select
                            value={data.chamber_id || 'none'}
                            onValueChange={(val) =>
                                setData('chamber_id', val === 'none' ? '' : val)
                            }
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="chamber_id"
                                className={cn(
                                    errors.chamber_id && 'border-destructive',
                                )}
                            >
                                <SelectValue placeholder="Select a chamber" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {chambers?.map((chamber) => (
                                    <SelectItem
                                        key={chamber.id}
                                        value={chamber.id}
                                    >
                                        {chamber.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.chamber_id} />
                    </div>

                    {/* Stored At Date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="stored_at" className="font-semibold">
                            Storage Date
                        </Label>
                        <DatePicker
                            value={
                                data.stored_at
                                    ? parseISO(data.stored_at)
                                    : undefined
                            }
                            onChange={(date) =>
                                setData(
                                    'stored_at',
                                    date ? format(date, 'yyyy-MM-dd') : '',
                                )
                            }
                            disabled={processing || !data.chamber_id}
                            className={cn(
                                errors.stored_at && 'border-destructive',
                            )}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            When was the deceased moved to this chamber?
                        </p>
                        <InputError message={errors.stored_at} />
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
                            placeholder="Additional observations or context…"
                            disabled={processing}
                            className={cn(
                                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                            )}
                        />
                        <InputError message={errors.notes} />
                    </div>
                </CardContent>
            </Card>

            {/* Section 2: Relative / bringer information */}
            <Card>
                <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                    <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Relative / Bringer Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* Relative Name */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="relative_name"
                            className="font-semibold"
                        >
                            Relative Name{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="relative_name"
                            value={data.relative_name}
                            onChange={(e) =>
                                setData('relative_name', e.target.value)
                            }
                            disabled={processing}
                            className={cn(
                                errors.relative_name && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.relative_name} />
                    </div>

                    {/* Relative Phone */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="relative_phone"
                            className="font-semibold"
                        >
                            Phone Number{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="relative_phone"
                            type="tel"
                            value={data.relative_phone}
                            onChange={(e) =>
                                setData('relative_phone', e.target.value)
                            }
                            disabled={processing}
                            className={cn(
                                errors.relative_phone && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.relative_phone} />
                    </div>

                    {/* Relationship */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="relative_relationship"
                            className="font-semibold"
                        >
                            Relationship{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="relative_relationship"
                            value={data.relative_relationship}
                            onChange={(e) =>
                                setData('relative_relationship', e.target.value)
                            }
                            placeholder="e.g. Spouse, Child, Parent"
                            disabled={processing}
                            className={cn(
                                errors.relative_relationship &&
                                    'border-destructive',
                            )}
                        />
                        <InputError message={errors.relative_relationship} />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="relative_address"
                            className="font-semibold"
                        >
                            Address
                        </Label>
                        <Input
                            id="relative_address"
                            value={data.relative_address}
                            onChange={(e) =>
                                setData('relative_address', e.target.value)
                            }
                            disabled={processing}
                        />
                        <InputError message={errors.relative_address} />
                    </div>
                </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3">
                <Button type="button" variant="outline" asChild>
                    <a href={cancelHref}>Cancel</a>
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
