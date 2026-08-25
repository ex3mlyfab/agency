import { Head, useForm } from '@inertiajs/react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ServiceCategoryCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/service-categories');
    }

    return (
        <>
            <Head title="Create Service Category" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        New Service Category
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Define a new category to group services under.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border bg-secondary/30 px-6 py-4">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Category Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-6 py-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="font-semibold">
                                    Category Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Standard, Premium, VIP"
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
                                    placeholder="Enter descriptive details for this category"
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
                            {processing ? 'Saving...' : 'Save Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ServiceCategoryCreate.layout = {
    breadcrumbs: [
        { title: 'Service Categories', href: '/service-categories' },
        { title: 'New Category', href: '/service-categories/create' },
    ],
};
