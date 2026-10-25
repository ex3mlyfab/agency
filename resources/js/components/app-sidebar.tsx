import { usePage, Link } from '@inertiajs/react';
import {
    Building2,
    ClipboardList,
    GitBranch,
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
            tone: 'text-primary',
        },
        ...(can['deceased.view'] !== true
            ? [
                  {
                      title: 'Records',
                      href: '/deceased',
                      icon: Users,
                      tone: 'text-destructive',
                      action: {
                          title: 'Add New Record',
                          href: '/deceased/create',
                          icon: Plus,
                      },
                  },
              ]
            : []),
        ...(can['chambers.view'] !== true
            ? [
                  {
                      title: 'Cold Rooms',
                      href: '/chambers',
                      icon: Building2,
                      tone: 'text-success',
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
        ...(can['branches.view'] !== true
            ? [
                  {
                      title: 'Branches',
                      href: '/branches',
                      icon: GitBranch,
                      tone: 'text-info',
                  },
              ]
            : []),
        ...(can['transfers.view'] !== true
            ? [
                  {
                      title: 'Transfers',
                      href: '/transfers',
                      icon: MoveRight,
                      tone: 'text-highlight',
                  },
              ]
            : []),
        ...(can['history.view'] !== true
            ? [
                  {
                      title: 'History',
                      href: auditsIndex.url(),
                      icon: ClipboardList,
                      tone: 'text-warning',
                  },
              ]
            : []),
        ...(can['reports.view'] !== true
            ? [
                  {
                      title: 'Reports',
                      href: '/reports',
                      icon: ScrollText,
                      tone: 'text-info',
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

            <SidebarContent className="gap-4">
                <NavMain items={mainNavItems} label="Platform" />
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
