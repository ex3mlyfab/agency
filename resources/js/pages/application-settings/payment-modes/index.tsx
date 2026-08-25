import { Head, useForm, router } from '@inertiajs/react';
import { Search, Plus, Edit2, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { InputError } from '@/components/input-error';
import type { PaginationLink } from '@/components/pagination';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {BreadcrumbItem} from '@/types';

interface PaymentMode {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    paymentModes: {
        data: PaymentMode[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Settings', href: '#' },
    { title: 'Payment Modes', href: '/settings/application-settings/payment-modes' },
];

export default function PaymentModesIndex({ paymentModes, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);

    const createForm = useForm({
        name: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        is_active: true,
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/settings/application-settings/payment-modes', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/settings/application-settings/payment-modes', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditClick = (mode: PaymentMode) => {
        setSelectedMode(mode);
        editForm.setData({
            name: mode.name,
            is_active: mode.is_active,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!selectedMode) {
return;
}

        editForm.put(`/settings/application-settings/payment-modes/${selectedMode.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedMode(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (mode: PaymentMode) => {
        if (confirm(`Are you sure you want to delete "${mode.name}"?`)) {
            router.delete(`/settings/application-settings/payment-modes/${mode.id}`);
        }
    };

    return (
        <>
            <Head title="Payment Modes" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Payment Modes</h1>
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Search payment modes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            <Button type="submit" variant="secondary" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5">
                            <Plus className="h-4 w-4" />
                            <span>Add Mode</span>
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paymentModes.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-6 text-muted-foreground"
                                    >
                                        No payment modes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paymentModes.data.map((mode) => (
                                    <TableRow key={mode.id}>
                                        <TableCell className="font-medium">{mode.name}</TableCell>
                                        <TableCell>
                                            {mode.is_active ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-500 border border-zinc-500/20">
                                                    <ShieldAlert className="h-3 w-3" />
                                                    Inactive
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(mode.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(mode)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(mode)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination links={paymentModes.links} />
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Payment Mode</DialogTitle>
                        <DialogDescription>
                            Create a new payment mode for processing invoices and deposits.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="create-name">Name</Label>
                            <Input
                                id="create-name"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="e.g. POS, Hospital Wallet"
                                required
                            />
                            <InputError message={createForm.errors.name} />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="create-is_active"
                                checked={createForm.data.is_active}
                                onChange={(e) => createForm.setData('is_active', e.target.checked)}
                                className="rounded border-input text-primary focus:ring-ring h-4 w-4"
                            />
                            <Label htmlFor="create-is_active" className="font-normal cursor-pointer select-none">
                                Active (Available for selection in payment form)
                            </Label>
                            <InputError message={createForm.errors.is_active} />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                Create Payment Mode
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Payment Mode</DialogTitle>
                        <DialogDescription>
                            Update the details or active status of the payment mode.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                placeholder="e.g. POS, Hospital Wallet"
                                required
                            />
                            <InputError message={editForm.errors.name} />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-is_active"
                                checked={editForm.data.is_active}
                                onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                className="rounded border-input text-primary focus:ring-ring h-4 w-4"
                            />
                            <Label htmlFor="edit-is_active" className="font-normal cursor-pointer select-none">
                                Active (Available for selection in payment form)
                            </Label>
                            <InputError message={editForm.errors.is_active} />
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setSelectedMode(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

PaymentModesIndex.layout = {
    breadcrumbs,
};
