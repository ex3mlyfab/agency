import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-4">
            {links.map((link, i) => {
                const label = link.label.replace('&laquo;', '«').replace('&raquo;', '»');
                return link.url ? (
                    <Button
                        key={i}
                        asChild
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                            'min-w-8 px-2',
                            link.active ? 'pointer-events-none' : ''
                        )}
                    >
                        <Link href={link.url} dangerouslySetInnerHTML={{ __html: label }} />
                    </Button>
                ) : (
                    <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        disabled
                        className="min-w-8 px-2 opacity-50"
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
}
