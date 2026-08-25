import { Head, useForm } from '@inertiajs/react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Service {
    id: string;
    name: string;
    description: string | null;
}

interface Props {
    service: Service;
}

export default function ServiceEdit({ service }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: service.name,
        description: service.description ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/services/${service.id}`);
    }

    return (
        <>
            <Head title="Edit Service" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Edit Service
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Modify the details for this service.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Service Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-6 py-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="font-semibold">
                                    Service Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Body Embalming, Transportation, Coffin Selection"
                                    disabled={processing}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="font-semibold">
                                    Description
                                </Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter descriptive details for this service"
                                    disabled={processing}
                                    rows={3}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
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
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ServiceEdit.layout = {
    breadcrumbs: [
        { title: 'Service List', href: '/services' },
        { title: 'Edit Service', href: '/services/edit' },
    ],
};
