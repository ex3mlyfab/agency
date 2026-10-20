import { Link } from '@inertiajs/react';
import { NavChevron } from '@/components/nav-chevron';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    label,
}: {
    items: NavItem[];
    label?: string;
}) {
    const { isCurrentUrl } = useCurrentUrl();

    const isChildActive = (item: NavItem) => {
        if (!item.children) {
            return false;
        }

        return item.children.some((child) =>
            isCurrentUrl(child.href, undefined, child.href === item.href),
        );
    };

    const toneClass = (item: NavItem) => item.tone ?? 'text-primary';

    return (
        <SidebarGroup className="px-2 py-0">
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) =>
                    item.children ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={isChildActive(item)}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={isChildActive(item)}
                                    >
                                        {item.icon && (
                                            <item.icon
                                                className={toneClass(item)}
                                            />
                                        )}
                                        <span>{item.title}</span>
                                        <NavChevron />
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
                            <div className="flex items-center">
                                <SidebarMenuButton
                                    asChild
                                    className="flex-1"
                                    isActive={isCurrentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon
                                                className={toneClass(item)}
                                            />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                                {item.action && (
                                    <SidebarMenuAction asChild>
                                        <Link
                                            href={item.action.href}
                                            prefetch
                                            aria-label={item.action.title}
                                        >
                                            {item.action.icon && (
                                                <item.action.icon />
                                            )}
                                        </Link>
                                    </SidebarMenuAction>
                                )}
                            </div>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
