import { Link } from '@inertiajs/react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

const ChevronSvg = () => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M6.1584 3.13508C6.35985 2.95692 6.66436 2.9753 6.84253 3.17675L10.2711 7.04684C10.4223 7.2177 10.4223 7.4699 10.2711 7.64076L6.84253 11.5108C6.66436 11.7123 6.35985 11.7307 6.1584 11.5525C5.95694 11.3743 5.93857 11.0698 6.11673 10.8684L9.12458 7.48512C9.17674 7.42624 9.17674 7.33777 9.12458 7.27889L6.11673 3.89569C5.93857 3.69424 5.95694 3.38973 6.1584 3.13508Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
        ></path>
    </svg>
);

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    const iconTone = (title: string) => {
        if (title === 'Deceased') {
            return 'text-destructive';
        }

        if (title === 'Cold Rooms & Depositions') {
            return 'text-success';
        }

        if (title === 'Transfers') {
            return 'text-highlight';
        }

        if (title === 'History') {
            return 'text-warning';
        }

        if (title === 'Reports') {
            return 'text-info';
        }

        if (title === 'Dashboard') {
            return 'text-primary';
        }

        if (title === 'Record') {
            return 'text-destructive';
        }

        return 'text-primary';
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.children ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={item.children.some(
                                            (child) => isCurrentUrl(child.href),
                                        )}
                                    >
                                        {item.icon && (
                                            <item.icon
                                                className={iconTone(item.title)}
                                            />
                                        )}
                                        <span>{item.title}</span>
                                        <span className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
                                            <ChevronSvg />
                                        </span>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.children.map((child) => (
                                            <SidebarMenuSubItem
                                                key={child.title}
                                            >
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(
                                                        child.href,
                                                    )}
                                                >
                                                    <Link
                                                        href={child.href}
                                                        prefetch
                                                    >
                                                        {child.icon && (
                                                            <child.icon className="h-4 w-4" />
                                                        )}
                                                        <span>
                                                            {child.title}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && (
                                        <item.icon
                                            className={iconTone(item.title)}
                                        />
                                    )}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
