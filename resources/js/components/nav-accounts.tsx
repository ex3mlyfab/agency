import { Link } from '@inertiajs/react';
import {
    Briefcase,
    DollarSign,
    FolderOpen,
    Wallet,
    Receipt,
    FileText,
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

export function NavAccounts({ can }: { can: Record<string, boolean> }) {
    const { isCurrentUrl } = useCurrentUrl();

    const showAccounts =
        can['service_categories.view'] !== false ||
        can['services.view'] !== false ||
        can['service_prices.view'] !== false;

    const showBilling =
        can['invoices.view'] !== false ||
        can['payments.view'] !== false;

    if (!showAccounts && !showBilling) return null;

    return (
        <SidebarGroup className="mt-4 px-2 py-0">
            <SidebarGroupLabel>Accounts & Services</SidebarGroupLabel>
            <SidebarMenu>
                {showAccounts && (
                    <Collapsible asChild defaultOpen className="group/collapsible mb-2">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Accounts">
                                    <Wallet />
                                    <span>Accounts</span>
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
                                    {can['service_categories.view'] !== false && (
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isCurrentUrl(
                                                    '/service-categories',
                                                )}
                                            >
                                                <Link href="/service-categories">
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
                    <Collapsible asChild defaultOpen className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip="Billing">
                                    <Receipt />
                                    <span>Billing</span>
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
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
