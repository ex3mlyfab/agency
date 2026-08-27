import { Head, useForm } from '@inertiajs/react';
import { PlusIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { InputError } from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SimpleItem {
    id: string;
    name: string;
}

interface PriceTier {
    id?: string;
    start_day: number;
    end_day: number | null;
    price: string;
}

interface ServicePrice {
    id: string;
    service_id: string;
    service_category_id: string;
    price: string;
    source: string | null;
    service_price_tiers?: PriceTier[];
    servicePriceTiers?: PriceTier[];
}

interface Props {
    servicePrice: ServicePrice;
    services: SimpleItem[];
    serviceCategories: SimpleItem[];
}

export default function ServicePriceEdit({ servicePrice, services, serviceCategories }: Props) {
    const initialTiers = servicePrice.servicePriceTiers || servicePrice.service_price_tiers || [];
    const [enableTiers, setEnableTiers] = useState(initialTiers.length > 0);

    const { data, setData, put, processing, errors } = useForm<{
        service_id: string;
        service_category_id: string;
        source: string;
        price: string;
        tiers: PriceTier[];
    }>({
        service_id: servicePrice.service_id,
        service_category_id: servicePrice.service_category_id,
        source: servicePrice.source ?? '',
        price: servicePrice.price,
        tiers: initialTiers,
    });

    function handleToggleTiers(checked: boolean) {
        setEnableTiers(checked);

        if (checked) {
            if (data.tiers.length === 0) {
                setData('tiers', [{ start_day: 1, end_day: null, price: '' }]);
            }
        } else {
            setData('tiers', []);
        }
    }

    function addTier() {
        const lastTier = data.tiers[data.tiers.length - 1];
        const nextStart = lastTier ? (lastTier.end_day ? Number(lastTier.end_day) + 1 : lastTier.start_day + 1) : 1;
        
        setData('tiers', [
            ...data.tiers,
            { start_day: nextStart, end_day: null, price: '' },
        ]);
    }

    function removeTier(index: number) {
        setData('tiers', data.tiers.filter((_, i) => i !== index));
    }

    function updateTier(index: number, field: keyof PriceTier, value: any) {
        const updated = data.tiers.map((tier, i) => {
            if (i === index) {
                return { ...tier, [field]: value };
            }

            return tier;
        });
        setData('tiers', updated);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/service-prices/${servicePrice.id}`);
    }

    return (
        <>
            <Head title="Edit Service Price" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        Edit Price Configuration
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update the pricing configuration details.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-3">
                            <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Price Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                            {/* Service select */}
                            <div className="space-y-1.5">
                                <Label htmlFor="service_id" className="font-semibold">
                                    Select Service <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="service_id"
                                    value={data.service_id}
                                    onChange={(e) => setData('service_id', e.target.value)}
                                    disabled={processing}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">-- Choose a Service --</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.service_id} />
                            </div>

                            {/* Service Category select */}
                            <div className="space-y-1.5">
                                <Label htmlFor="service_category_id" className="font-semibold">
                                    Select Service Category <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="service_category_id"
                                    value={data.service_category_id}
                                    onChange={(e) => setData('service_category_id', e.target.value)}
                                    disabled={processing}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">-- Choose a Category --</option>
                                    {serviceCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.service_category_id} />
                            </div>

                            {/* Source Applicability */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="source" className="font-semibold">
                                    Source Applicability (Optional)
                                </Label>
                                <select
                                    id="source"
                                    value={data.source}
                                    onChange={(e) => setData('source', e.target.value)}
                                    disabled={processing}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">All Sources (Default)</option>
                                    <option value="In Hospital">In Hospital</option>
                                    <option value="Outside Hospital">Outside Hospital</option>
                                </select>
                                <InputError message={errors.source} />
                                <p className="text-xs text-muted-foreground">
                                    Select a source if this price configuration is specific to where the deceased came from.
                                </p>
                            </div>

                            {/* Base Price */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="price" className="font-semibold">
                                    Base Price (â‚¦) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    placeholder="0.00"
                                    disabled={processing}
                                />
                                <InputError message={errors.price} />
                            </div>

                            {/* Enable Tiers Toggle */}
                            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    id="enable_tiers"
                                    checked={enableTiers}
                                    onChange={(e) => handleToggleTiers(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="enable_tiers" className="font-semibold cursor-pointer">
                                    Enable Tiered Pricing (e.g. storage rates changing over time)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tier Builder */}
                    {enableTiers && (
                        <Card>
                            <CardHeader className="border-b border-border px-6 py-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                    Pricing Tiers
                                </CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addTier}>
                                    <PlusIcon className="h-4 w-4 mr-1" /> Add Tier
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4 px-6 py-6">
                                {data.tiers.map((tier, index) => (
                                    <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                                        <div className="space-y-1.5">
                                            <Label className="font-semibold">Start Day</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={tier.start_day}
                                                onChange={(e) => updateTier(index, 'start_day', Number(e.target.value))}
                                                placeholder="1"
                                                disabled={processing}
                                            />
                                            <InputError message={errors[`tiers.${index}.start_day` as keyof typeof errors]} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="font-semibold">End Day (leave blank for open tier)</Label>
                                            <Input
                                                type="number"
                                                min={tier.start_day}
                                                value={tier.end_day ?? ''}
                                                onChange={(e) => updateTier(index, 'end_day', e.target.value === '' ? null : Number(e.target.value))}
                                                placeholder="e.g. 5"
                                                disabled={processing}
                                            />
                                            <InputError message={errors[`tiers.${index}.end_day` as keyof typeof errors]} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="font-semibold">Rate Per Day (â‚¦)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={tier.price}
                                                onChange={(e) => updateTier(index, 'price', e.target.value)}
                                                placeholder="0.00"
                                                disabled={processing}
                                            />
                                            <InputError message={errors[`tiers.${index}.price` as keyof typeof errors]} />
                                        </div>

                                        <div className="flex justify-end sm:justify-start">
                                            {data.tiers.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => removeTier(index)}
                                                >
                                                    <TrashIcon className="h-4 w-4 mr-1" /> Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

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

ServicePriceEdit.layout = {
    breadcrumbs: [
        { title: 'Service Prices', href: '/service-prices' },
        { title: 'Edit Price', href: '/service-prices/edit' },
    ],
};
