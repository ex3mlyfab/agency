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
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';

export function NavSettings({ can }: { can: Record<string, boolean> }) {
    const { isCurrentUrl } = useCurrentUrl();

    const showSettings =
        can['users.view'] !== true ||
        can['roles.view'] !== true ||
        can['permissions.view'] !== true ||
        can['audits.view'] !== true ||
        can['branding.manage'] !== true;

    if (!showSettings) {
        return null;
    }

    const settingsUrls = [
        '/settings/application-settings/users',
        '/settings/application-settings/roles',
        '/settings/application-settings/permissions',
        '/settings/application-settings/audits',
        '/settings/application-settings/branding',
        '/settings/application-settings/payment-modes',
    ];
    const settingsActive = settingsUrls.some((url) =>
        isCurrentUrl(url, undefined, url === '/settings/application-settings/users'),
    );

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
            <SidebarMenu>
                <Collapsible
                    asChild
                    defaultOpen={settingsActive}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip="Application Settings"
                                isActive={settingsActive}
                            >
                                <Settings2 />
                                <span>Application Settings</span>
                                <NavChevron />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {can['users.view'] !== true && (
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
                                {can['roles.view'] !== true && (
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
                                {can['permissions.view'] !== true && (
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
                                {can['audits.view'] !== true && (
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
                                {can['branding.manage'] !== true && (
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
