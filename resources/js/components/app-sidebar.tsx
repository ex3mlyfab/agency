import { usePage, Link } from '@inertiajs/react';
import {
    Building2,
    ClipboardList,
    LayoutGrid,
    MoveRight,
    ScrollText,
    Plus,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavAccounts } from '@/components/nav-accounts';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavSettings } from '@/components/nav-settings';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as auditsIndex } from '@/routes/application-settings/audits';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { props } = usePage();
    const can = (props as { can?: Record<string, boolean> }).can ?? {};

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard.url(),
            icon: LayoutGrid,
        },
        ...(can['deceased.view'] !== false
            ? [
                  {
                      title: 'Record',
                      href: '/deceased',
                      icon: Users,
                      children: [
                          {
                              title: 'Add New Record',
                              href: '/deceased/create',
                              icon: Plus,
                          },
                          {
                              title: 'View Records',
                              href: '/deceased',
                          },
                      ],
                  },
              ]
            : []),
        ...(can['chambers.view'] !== false
            ? [
                  {
                      title: 'Cold Rooms & Depositions',
                      href: '/chambers',
                      icon: Building2,
                      children: [
                          {
                              title: 'Cold Rooms',
                              href: '/chambers',
                              icon: Building2,
                          },
                          {
                              title: 'Depositions',
                              href: '/chambers/deposers',
                              icon: Users,
                          },
                      ],
                  },
              ]
            : []),
        ...(can['transfers.view'] !== false
            ? [
                  {
                      title: 'Transfers',
                      href: '/transfers',
                      icon: MoveRight,
                  },
              ]
            : []),
        ...(can['history.view'] !== false
            ? [
                  {
                      title: 'History',
                      href: auditsIndex.url(),
                      icon: ClipboardList,
                  },
              ]
            : []),
        ...(can['reports.view'] !== false
            ? [
                  {
                      title: 'Reports',
                      href: '/reports',
                      icon: ScrollText,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavAccounts can={can} />
                <NavSettings can={can} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
