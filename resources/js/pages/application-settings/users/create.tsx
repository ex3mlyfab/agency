import { Head, useForm } from '@inertiajs/react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {BreadcrumbItem} from '@/types';

interface Role {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Users', href: '/settings/application-settings/users' },
    { title: 'New User', href: '/settings/application-settings/users/create' },
];

export default function UserCreate({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: roles[0]?.name ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/settings/application-settings/users');
    }

    return (
        <>
            <Head title="New User" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        New User
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create a new system user and assign them a role.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                User Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="font-semibold">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. John Doe"
                                    disabled={processing}
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="font-semibold">
                                    Email Address <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="user@example.com"
                                    disabled={processing}
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="font-semibold">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Set a strong password"
                                    disabled={processing}
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Password Confirm */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="font-semibold">
                                    Confirm Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Re-enter password"
                                    disabled={processing}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Role */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="role" className="font-semibold">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    disabled={processing}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">— Select a role —</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.role} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

UserCreate.layout = { breadcrumbs };
