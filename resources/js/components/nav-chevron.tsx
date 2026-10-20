import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavChevron({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'ml-auto text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                className,
            )}
        >
            <ChevronRight className="h-4 w-4" />
        </span>
    );
}
