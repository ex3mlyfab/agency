import { Link } from '@inertiajs/react';
import {
    Briefcase,
    DollarSign,
    FolderOpen,
    Wallet,
    Receipt,
    FileText,
    CreditCard,
    ShieldCheck,
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

export function NavAccounts({ can }: { can: Record<string, boolean> }) {
    const { isCurrentUrl } = useCurrentUrl();

    const showAccounts =
        can['service_categories.view'] !== false ||
        can['services.view'] !== false ||
        can['service_prices.view'] !== false;

    const showBilling =
        can['invoices.view'] !== false ||
        can['payments.view'] !== false ||
        can['waivers.view'] !== false;

    if (!showAccounts && !showBilling) {
        return null;
    }

    const accountsUrls = [
        '/service-categories',
        '/services',
        '/service-prices',
    ];
    const billingUrls = ['/invoices', '/payments', '/waivers'];

    const accountsActive = accountsUrls.some((url) =>
        can['service_categories.view'] !== false ||
        can['services.view'] !== false ||
        can['service_prices.view'] !== false
            ? isCurrentUrl(url, undefined, url === '/services')
            : false,
    );
    const billingActive = billingUrls.some((url) =>
        can['invoices.view'] !== false ||
        can['payments.view'] !== false ||
        can['waivers.view'] !== false
            ? isCurrentUrl(url, undefined, url === '/invoices')
            : false,
    );

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Accounts & Services</SidebarGroupLabel>
            <SidebarMenu>
                {showAccounts && (
                    <Collapsible
                        asChild
                        defaultOpen={accountsActive}
                        className="group/collapsible mb-2"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    tooltip="Accounts"
                                    isActive={accountsActive}
                                >
                                    <Wallet />
                                    <span>Accounts</span>
                                    <NavChevron />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {can['service_categories.view'] !==
                                        false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/service-categories',
                                                )}
                                            >
                                                <Link
                                                    href="/service-categories"
                                                >
                                                    <FolderOpen className="h-4 w-4" />
                                                    <span>Service Category</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {can['services.view'] !== false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/services',
                                                )}
                                            >
                                                <Link href="/services">
                                                    <Briefcase className="h-4 w-4" />
                                                    <span>Service List</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {can['service_prices.view'] !== false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/service-prices',
                                                )}
                                            >
                                                <Link href="/service-prices">
                                                    <DollarSign className="h-4 w-4" />
                                                    <span>Service Price</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}

                {showBilling && (
                    <Collapsible
                        asChild
                        defaultOpen={billingActive}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    tooltip="Billing"
                                    isActive={billingActive}
                                >
                                    <Receipt />
                                    <span>Billing</span>
                                    <NavChevron />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {can['invoices.view'] !== false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/invoices',
                                                )}
                                            >
                                                <Link href="/invoices">
                                                    <FileText className="h-4 w-4" />
                                                    <span>Invoices</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {can['payments.view'] !== false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/payments',
                                                )}
                                            >
                                                <Link href="/payments">
                                                    <CreditCard className="h-4 w-4" />
                                                    <span>Payments</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                    {can['waivers.view'] !== false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/waivers',
                                                )}
                                            >
                                                <Link href="/waivers">
                                                    <ShieldCheck className="h-4 w-4" />
                                                    <span>Waivers</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
