import { Link } from '@inertiajs/react';
import {
    Settings2,
    Shield,
    UserCog,
    Users,
    History,
    Paintbrush,
    CreditCard,
} from 'lucide-react';
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

export function NavSettings({ can }: { can: Record<string, boolean> }) {
    const { isCurrentUrl } = useCurrentUrl();

    // Note: We're checking permissions to conditionally render items
    // In a real scenario, use actual permissions like 'users.view', 'roles.view', etc.
    const showSettings =
        can['users.view'] !== false ||
        can['roles.view'] !== false ||
        can['permissions.view'] !== false ||
        can['audits.view'] !== false ||
        can['branding.manage'] !== false;

    if (!showSettings) {
return null;
}

    return (
        <SidebarGroup className="mt-4 px-2 py-0">
            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible asChild defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip="Application Settings">
                                <Settings2 />
                                <span>Application Settings</span>
                                <span className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90">
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
                                </span>
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {can['users.view'] !== false && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/settings/application-settings/users',
                                            )}
                                        >
                                            <Link href="/settings/application-settings/users">
                                                <Users className="h-4 w-4" />
                                                <span>User Management</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                                {can['roles.view'] !== false && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/settings/application-settings/roles',
                                            )}
                                        >
                                            <Link href="/settings/application-settings/roles">
                                                <UserCog className="h-4 w-4" />
                                                <span>Roles</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                                {can['permissions.view'] !== false && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/settings/application-settings/permissions',
                                            )}
                                        >
                                            <Link href="/settings/application-settings/permissions">
                                                <Shield className="h-4 w-4" />
                                                <span>Permissions</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                                {can['audits.view'] !== false && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/settings/application-settings/audits',
                                            )}
                                        >
                                            <Link href="/settings/application-settings/audits">
                                                <History className="h-4 w-4" />
                                                <span>Audits</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                                {can['branding.manage'] !== false && (
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isCurrentUrl(
                                                '/settings/application-settings/branding',
                                            )}
                                        >
                                            <Link href="/settings/application-settings/branding">
                                                <Paintbrush className="h-4 w-4" />
                                                <span>Branding</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )}
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={isCurrentUrl(
                                            '/settings/application-settings/payment-modes',
                                        )}
                                    >
                                        <Link href="/settings/application-settings/payment-modes">
                                            <CreditCard className="h-4 w-4" />
                                            <span>Payment Modes</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarMenu>
        </SidebarGroup>
    );
}
