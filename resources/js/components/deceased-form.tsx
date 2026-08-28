import { useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { CameraIcon, TriangleAlertIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { InputError } from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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

interface DeceasedFormData {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    date_of_death: string;
    body_tag_number: string;
    body_condition: string;
    place_of_death: string;
    hospital_number: string;
    gender: string;
    cause_of_death: string;
    notes: string;
    relative_name: string;
    relative_phone: string;
    relative_relationship: string;
    relative_address: string;
    chamber_id: string;
    stored_at: string;
    service_category_id: string;
    source: string;
    picture?: File | null | string;
    [key: string]: string | File | null | undefined;
}

interface DeceasedFormProps {
    initialValues?: Partial<DeceasedFormData>;
    action: string;
    method?: 'post' | 'put' | 'patch';
    submitLabel?: string;
    cancelHref?: string;
    chambers?: { id: string; name: string; available_spaces: number; is_current?: boolean }[];
    serviceCategories?: { id: string; name: string }[];
}

export function DeceasedForm({
    initialValues = {},
    action,
    method = 'post',
    submitLabel = 'Save Record',
    cancelHref = '/deceased',
    chambers = [],
    serviceCategories = [],
}: DeceasedFormProps) {
    const { data, setData, submit, processing, errors } =
        useForm<DeceasedFormData>({
            first_name: initialValues.first_name ?? '',
            last_name: initialValues.last_name ?? '',
            date_of_birth: initialValues.date_of_birth ?? '',
            date_of_death: initialValues.date_of_death ?? '',
            body_tag_number: initialValues.body_tag_number ?? '',
            body_condition: initialValues.body_condition ?? '',
            place_of_death: initialValues.place_of_death ?? '',
            place_of_death_other: initialValues.place_of_death_other ?? '',
            hospital_number: initialValues.hospital_number ?? '',
            gender: initialValues.gender ?? 'Male',
            cause_of_death: initialValues.cause_of_death ?? '',
            notes: initialValues.notes ?? '',
            relative_name: initialValues.relative_name ?? '',
            relative_phone: initialValues.relative_phone ?? '',
            relative_relationship: initialValues.relative_relationship ?? '',
            relative_address: initialValues.relative_address ?? '',
            chamber_id: initialValues.chamber_id ?? '',
            stored_at: initialValues.stored_at ?? '',
            service_category_id: initialValues.service_category_id ?? '',
            source: initialValues.source ?? '',
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
                <CardHeader className="border-b border-border px-6 py-3">
                    <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Deceased Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* First Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="first_name" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                        <Label htmlFor="last_name" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
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
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Date of Death{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="date_of_death"
                            type="datetime-local"
                            value={data.date_of_death ? data.date_of_death.slice(0, 16) : ''}
                            onChange={(e) =>
                                setData('date_of_death', e.target.value)
                            }
                            disabled={processing}
                            className={cn(
                                errors.date_of_death && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.date_of_death} />
                    </div>

                    {/* Place of Death */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="place_of_death"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Place of Death
                        </Label>
                        <Select
                            value={data.place_of_death}
                            onValueChange={(val) =>
                                setData('place_of_death', val)
                            }
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="place_of_death"
                                className={cn(
                                    errors.place_of_death && 'border-destructive',
                                )}
                            >
                                <SelectValue placeholder="Select place of death" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Home">Home</SelectItem>
                                <SelectItem value="Roadside">Roadside</SelectItem>
                                <SelectItem value="Hotel">Hotel</SelectItem>
                                <SelectItem value="Hospital">Hospital</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                        </Select>
                        {data.place_of_death === 'Others' && (
                            <Input
                                id="place_of_death_other"
                                value={data.place_of_death_other ?? ''}
                                onChange={(e) =>
                                    setData(
                                        'place_of_death_other',
                                        e.target.value,
                                    )
                                }
                                placeholder="Specify place of death"
                                disabled={processing}
                                className="mt-2"
                            />
                        )}
                        <InputError message={errors.place_of_death} />
                    </div>

                    {/* Hospital Number */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="hospital_number"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Hospital Number
                        </Label>
                        <Input
                            id="hospital_number"
                            value={data.hospital_number}
                            onChange={(e) =>
                                setData('hospital_number', e.target.value)
                            }
                            placeholder="e.g. HN-12345"
                            disabled={processing}
                            className={cn(
                                errors.hospital_number && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.hospital_number} />
                    </div>

                    {/* Body Tag Number */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="body_tag_number"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Body Tag Number
                        </Label>
                        <Input
                            id="body_tag_number"
                            value={data.body_tag_number}
                            onChange={(e) =>
                                setData('body_tag_number', e.target.value)
                            }
                            placeholder="e.g. TAG-001"
                            disabled={processing}
                            className={cn(
                                errors.body_tag_number && 'border-destructive',
                            )}
                        />
                        <InputError message={errors.body_tag_number} />
                    </div>

                    {/* Body Condition */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="body_condition"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Body Condition
                        </Label>
                        <Select
                            value={data.body_condition}
                            onValueChange={(val) =>
                                setData('body_condition', val)
                            }
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="body_condition"
                                className={cn(
                                    errors.body_condition && 'border-destructive',
                                )}
                            >
                                <SelectValue placeholder="Select body condition" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Fresh">Fresh</SelectItem>
                                <SelectItem value="Embalmed">Embalmed</SelectItem>
                                <SelectItem value="Decomposed">Decomposed</SelectItem>
                                <SelectItem value="Autolyzed">Autolyzed</SelectItem>
                                <SelectItem value="Skelentonized">Skelentonized</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.body_condition} />
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <Label htmlFor="gender" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            Reported Cause of Death
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

                    {/* Service Category */}
                    <div className="space-y-1.5">
                        <Label htmlFor="service_category_id" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Service Category <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.service_category_id}
                            onValueChange={(val) => setData('service_category_id', val)}
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="service_category_id"
                                className={cn(
                                    errors.service_category_id && 'border-destructive',
                                )}
                            >
                                <SelectValue placeholder="-- Choose Category --" />
                            </SelectTrigger>
                            <SelectContent>
                                {serviceCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.service_category_id} />
                    </div>

                    {/* Source */}
                    <div className="space-y-1.5">
                        <Label htmlFor="source" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Source of Deceased <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.source}
                            onValueChange={(val) => setData('source', val)}
                            disabled={processing}
                        >
                            <SelectTrigger
                                id="source"
                                className={cn(
                                    errors.source && 'border-destructive',
                                )}
                            >
                                <SelectValue placeholder="-- Choose Source --" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="In Hospital">In Hospital</SelectItem>
                                <SelectItem value="Outside Hospital">Outside Hospital</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.source} />
                    </div>

                    {/* Picture Upload */}
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="picture" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                        {chambers?.length === 0 && (
                            <Alert variant="destructive" className="mb-3">
                                <TriangleAlertIcon />
                                <AlertTitle>No chambers available</AlertTitle>
                                <AlertDescription>
                                    All chambers are at full capacity. Please
                                    release a deceased or add a new chamber to
                                    continue.
                                </AlertDescription>
                            </Alert>
                        )}
                        <Label htmlFor="chamber_id" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                                        {!chamber.is_current && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({chamber.available_spaces} left)
                                            </span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.chamber_id} />
                    </div>

                    {/* Stored At Date */}
                    <div className="space-y-1.5">
                        <Label htmlFor="stored_at" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                        <Label htmlFor="notes" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Notes
                        </Label>
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            placeholder="Additional observations or contextâ€¦"
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
                <CardHeader className="border-b border-border px-6 py-3">
                    <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Relative / Bringer Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                    {/* Relative Name */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="relative_name"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
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
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
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
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
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
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
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
                    {processing ? 'Savingâ€¦' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
