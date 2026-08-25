import { Head, router } from '@inertiajs/react';
import { Paintbrush, Upload, X, ImageIcon, CoinsIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { update } from '@/routes/application-settings/branding';
import type {BreadcrumbItem} from '@/types';

interface Props {
    settings: {
        app_name: string;
        app_logo: string | null;
        currency_symbol: string;
    };
    status?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Branding', href: '/settings/application-settings/branding' },
];

/** Common world currency symbols for the quick-pick palette */
const COMMON_SYMBOLS = [
    { symbol: '₦', label: 'NGN – Naira' },
    { symbol: '$', label: 'USD – Dollar' },
    { symbol: '£', label: 'GBP – Pound' },
    { symbol: '€', label: 'EUR – Euro' },
    { symbol: '¥', label: 'JPY – Yen' },
    { symbol: '₹', label: 'INR – Rupee' },
    { symbol: 'R', label: 'ZAR – Rand' },
    { symbol: 'KSh', label: 'KES – Shilling' },
    { symbol: 'GH₵', label: 'GHS – Cedi' },
    { symbol: 'FCFA', label: 'XOF – Franc' },
];

export default function BrandingEdit({ settings, status }: Props) {
    const [appName, setAppName] = useState(settings.app_name);
    const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol || '₦');
    const [logoPreview, setLogoPreview] = useState<string | null>(
        settings.app_logo ? `/storage/${settings.app_logo}` : null,
    );
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
return;
}

        setLogoFile(file);
        setRemoveLogo(false);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setRemoveLogo(true);

        if (fileInputRef.current) {
fileInputRef.current.value = '';
}
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        formData.append('app_name', appName);
        formData.append('currency_symbol', currencySymbol);

        if (logoFile) {
            formData.append('logo', logoFile);
        }

        if (removeLogo) {
            formData.append('remove_logo', '1');
        }

        router.post(update.url(), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Head title="Branding" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Paintbrush className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Branding</h1>
                        <p className="text-sm text-muted-foreground">
                            Customize your application name, logo, and currency symbol
                        </p>
                    </div>
                </div>

                <Separator />

                {status === 'branding-updated' && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                        Branding settings saved successfully.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
                    {/* Application Name */}
                    <div className="space-y-2">
                        <Label htmlFor="app_name" className="text-base font-medium">
                            Application Name
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            This name is displayed throughout the application.
                        </p>
                        <Input
                            id="app_name"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="My Application"
                            required
                            className="max-w-sm"
                        />
                    </div>

                    <Separator />

                    {/* Currency Symbol */}
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="currency_symbol" className="text-base font-medium flex items-center gap-2">
                                <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                                Currency Symbol
                            </Label>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                This symbol is used on all invoices, payments, and financial figures across the application.
                            </p>
                        </div>

                        {/* Quick-pick palette */}
                        <div className="flex flex-wrap gap-2">
                            {COMMON_SYMBOLS.map(({ symbol, label }) => (
                                <button
                                    key={symbol}
                                    type="button"
                                    title={label}
                                    onClick={() => setCurrencySymbol(symbol)}
                                    className={`inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                        currencySymbol === symbol
                                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                            : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                >
                                    {symbol}
                                </button>
                            ))}
                        </div>

                        {/* Custom / manual input with live preview */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Input
                                    id="currency_symbol"
                                    value={currencySymbol}
                                    onChange={(e) => setCurrencySymbol(e.target.value)}
                                    placeholder="₦"
                                    maxLength={10}
                                    required
                                    className="w-28 pr-10 font-mono text-base"
                                />
                            </div>
                            {/* Live preview */}
                            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">Preview:</span>
                                <span className="font-semibold text-foreground">
                                    {currencySymbol || '₦'}1,500.00
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Select a preset above or type a custom symbol (e.g. <code className="font-mono">Fr</code>, <code className="font-mono">Br</code>, <code className="font-mono">лв</code>). Max 10 characters.
                        </p>
                    </div>

                    <Separator />

                    {/* Logo Upload */}
                    <div className="space-y-3">
                        <div>
                            <Label className="text-base font-medium">
                                Application Logo
                            </Label>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Upload a PNG, JPG, SVG, or WebP image. Max 2MB.
                            </p>
                        </div>

                        <div className="flex items-start gap-6">
                            {/* Preview */}
                            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="h-full w-full object-contain p-1"
                                    />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-fit"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                </Button>
                                {logoPreview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveLogo}
                                        className="w-fit text-destructive hover:text-destructive"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Remove Logo
                                    </Button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                {logoFile && (
                                    <p className="text-xs text-muted-foreground">
                                        Selected: {logoFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Save Branding'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

BrandingEdit.layout = {
    breadcrumbs,
};
