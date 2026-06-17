import { cn } from '@/lib/utils';

type DeceasedStatus = 'Pending' | 'InChamber' | 'Released';
type EventType = 'Entered' | 'Transferred' | 'Released';

type StatusChipProps = {
    status: DeceasedStatus | EventType | string;
    className?: string;
};

const statusMap: Record<string, string> = {
    Pending: 'mma-chip mma-chip-pending',
    InChamber: 'mma-chip mma-chip-in-chamber',
    Released: 'mma-chip mma-chip-released',
    Entered: 'mma-chip mma-chip-entered',
    Transferred: 'mma-chip mma-chip-transferred',
    Completed: 'mma-chip mma-chip-completed',
};

const labelMap: Record<string, string> = {
    InChamber: 'In Chamber',
};

export function StatusChip({ status, className }: StatusChipProps) {
    const chipClass = statusMap[status] ?? 'mma-chip mma-chip-pending';
    const label = labelMap[status] ?? status;

    return <span className={cn(chipClass, className)}>{label}</span>;
}
