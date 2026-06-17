import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldCheckIcon, UserIcon, ArrowLeftIcon, FileTextIcon, BuildingIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputError } from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Chamber {
    id: string;
    name: string;
    location: string | null;
}

interface Deceased {
    id: string;
    first_name: string;
    last_name: string;
    date_of_death: string;
    status: 'Pending' | 'InChamber' | 'Released';
    chamber: Chamber | null;
    relative_name: string;
    relative_phone: string;
    relative_relationship: string;
    relative_address: string | null;
    release_code: string;
}

interface Props {
    deceased: Deceased;
}

interface ReleaseFormData {
    release_code: string;
    released_to_name: string;
    released_to_phone: string;
    released_to_relationship: string;
    released_to_id_type: string;
    released_to_id_number: string;
    release_notes: string;
    confirm_physical_verification: boolean;
}

export default function DeceasedRelease({ deceased }: Props) {
    const { data, setData, post, processing, errors } = useForm<ReleaseFormData>({
        release_code: '',
        released_to_name: '',
        released_to_phone: '',
        released_to_relationship: '',
        released_to_id_type: 'National ID',
        released_to_id_number: '',
        release_notes: '',
        confirm_physical_verification: false,
    });

    function handlePrefill() {
        setData((prev) => ({
            ...prev,
            released_to_name: deceased.relative_name,
            released_to_phone: deceased.relative_phone,
            released_to_relationship: deceased.relative_relationship,
        }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/deceased/${deceased.id}/release`);
    }

    return (
        <>
            <Head title={`Release — ${deceased.first_name} ${deceased.last_name}`} />
            <div className="space-y-6 p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Link href={`/deceased/${deceased.id}`} className="hover:underline flex items-center gap-1">
                                <ArrowLeftIcon className="h-3 w-3" /> Back to Record
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheckIcon className="h-6 w-6 text-primary" />
                            Verify & Release Deceased
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Authorize the release of {deceased.first_name} {deceased.last_name} and free chamber capacity.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Form Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Security Verification Code Card */}
                            <Card className="border border-primary/20 shadow-sm">
                                <CardHeader className="bg-primary/5 pb-4">
                                    <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
                                        Security Code Verification
                                    </CardTitle>
                                    <CardDescription>
                                        Enter the secure Intake Release Code issued to the family member during intake.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="release_code">Intake Release Code <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="release_code"
                                            value={data.release_code}
                                            onChange={(e) => setData('release_code', e.target.value)}
                                            placeholder="e.g. DEC-ABC12345"
                                            className="font-mono text-base tracking-wider"
                                            required
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.release_code} />
                                        <p className="text-xs text-muted-foreground">
                                            This code must exactly match the unique code registered on the intake document.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Collector Details Card */}
                            <Card>
                                <CardHeader className="pb-4 border-b border-border bg-secondary/10">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                                                Collector Information
                                            </CardTitle>
                                            <CardDescription>
                                                Details of the person claiming the deceased.
                                            </CardDescription>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePrefill}
                                            className="text-xs"
                                        >
                                            Copy registered bringer's details
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="released_to_name">Collector Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="released_to_name"
                                                value={data.released_to_name}
                                                onChange={(e) => setData('released_to_name', e.target.value)}
                                                placeholder="Full Name"
                                                required
                                            />
                                            <InputError message={errors.released_to_name} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="released_to_relationship">Relationship to Deceased <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="released_to_relationship"
                                                value={data.released_to_relationship}
                                                onChange={(e) => setData('released_to_relationship', e.target.value)}
                                                placeholder="e.g. Spouse, Son, Daughter, Sibling"
                                                required
                                            />
                                            <InputError message={errors.released_to_relationship} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="released_to_phone">Collector Phone <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="released_to_phone"
                                            value={data.released_to_phone}
                                            onChange={(e) => setData('released_to_phone', e.target.value)}
                                            placeholder="Phone number"
                                            required
                                        />
                                        <InputError message={errors.released_to_phone} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Collector ID Verification Card */}
                            <Card>
                                <CardHeader className="pb-4 border-b border-border bg-secondary/10">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                                        Official ID Verification
                                    </CardTitle>
                                    <CardDescription>
                                        Collect and verify a valid, government-issued physical ID.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2 sm:col-span-1">
                                            <Label htmlFor="released_to_id_type">ID Type <span className="text-destructive">*</span></Label>
                                            <Select
                                                value={data.released_to_id_type}
                                                onValueChange={(val) => setData('released_to_id_type', val)}
                                            >
                                                <SelectTrigger id="released_to_id_type">
                                                    <SelectValue placeholder="Select ID Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="National ID">National ID</SelectItem>
                                                    <SelectItem value="Driver's License">Driver's License</SelectItem>
                                                    <SelectItem value="Passport">Passport</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.released_to_id_type} />
                                        </div>

                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="released_to_id_number">ID Document Number <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="released_to_id_number"
                                                value={data.released_to_id_number}
                                                onChange={(e) => setData('released_to_id_number', e.target.value)}
                                                placeholder="Enter ID / Document Number"
                                                required
                                            />
                                            <InputError message={errors.released_to_id_number} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="release_notes">Release / Transfer Notes</Label>
                                        <textarea
                                            id="release_notes"
                                            value={data.release_notes}
                                            onChange={(e) => setData('release_notes', e.target.value)}
                                            placeholder="Add any specific observations or details about the collection process..."
                                            className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <InputError message={errors.release_notes} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Confirmation Checkbox */}
                            <Card className="border border-success/30 bg-success/5 shadow-sm">
                                <CardContent className="pt-6">
                                    <div className="flex items-start space-x-3">
                                        <Checkbox
                                            id="confirm_physical_verification"
                                            checked={data.confirm_physical_verification}
                                            onCheckedChange={(checked) =>
                                                setData('confirm_physical_verification', checked === true)
                                            }
                                            required
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label
                                                htmlFor="confirm_physical_verification"
                                                className="text-sm font-medium leading-normal cursor-pointer select-none text-foreground"
                                            >
                                                Physical ID Check Confirmation <span className="text-destructive">*</span>
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                I confirm that I have physically checked and verified the collector's official identity document, matched their photo, and verified their relationship details.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <Button asChild variant="outline">
                                    <Link href={`/deceased/${deceased.id}`}>Cancel</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.confirm_physical_verification || !data.release_code}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    {processing ? 'Processing...' : 'Authorize Release'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Quick Reference Side Column */}
                    <div className="space-y-6">
                        {/* Deceased Info Reference Card */}
                        <Card>
                            <CardHeader className="bg-secondary/20 pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Deceased Reference
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">Full Name</div>
                                    <div className="text-sm font-medium text-foreground">{deceased.first_name} {deceased.last_name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Date of Death</div>
                                    <div className="text-sm font-medium text-foreground">{deceased.date_of_death}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Assigned Chamber</div>
                                    <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                        <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                                        {deceased.chamber ? (
                                            <span>
                                                {deceased.chamber.name}
                                                {deceased.chamber.location && ` (${deceased.chamber.location})`}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </div>
                                    {deceased.chamber && (
                                        <p className="text-[11px] text-success font-medium mt-1">
                                            * Releasing will immediately free 1 slot in this chamber.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Intake Bringer Reference Card */}
                        <Card>
                            <CardHeader className="bg-secondary/20 pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Registered Bringer (Brought In By)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">Name</div>
                                    <div className="text-sm font-medium text-foreground">{deceased.relative_name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Relationship</div>
                                    <div className="text-sm font-medium text-foreground">{deceased.relative_relationship}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Phone Number</div>
                                    <div className="text-sm font-medium text-foreground">{deceased.relative_phone}</div>
                                </div>
                                {deceased.relative_address && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Address</div>
                                        <div className="text-sm text-foreground">{deceased.relative_address}</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

DeceasedRelease.layout = {
    breadcrumbs: [
        { title: 'Deceased', href: '/deceased' },
        { title: 'Release Record', href: '#' },
    ],
};
