'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Shield, Link2 } from 'lucide-react';
import type { AdminUser } from '@/lib/admin-data';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

export default function AdminLayout({
  children,
  adminUser,
  onLogout
}: {
  children: React.ReactNode;
  adminUser: AdminUser | null;
  onLogout: () => void;
}) {
    const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex h-16 items-center justify-center p-3">
              <Link href="/" aria-label="Go to Homepage">
                <Logo className="text-primary-foreground transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
              </Link>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                <Link href="/admin">
                  <Users />
                  <span className="truncate group-data-[collapsible=icon]:hidden">Profiles</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/connect')}>
                <Link href="/admin/connect">
                  <Link2 />
                  <span className="truncate group-data-[collapsible=icon]:hidden">Connect</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {adminUser?.role === 'super-admin' && (
                <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/permissions')}>
                    <Link href="/admin/permissions">
                    <Shield />
                    <span className="truncate group-data-[collapsible=icon]:hidden">Permissions</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className='p-3 border-t border-primary-foreground/10 flex items-center justify-between'>
                 <div className='text-sm group-data-[collapsible=icon]:hidden'>
                    <p className='font-semibold'>{adminUser?.name}</p>
                    <p className='text-primary-foreground/70 capitalize'>{adminUser?.role.replace('-', ' ')}</p>
                </div>
                 <Button variant="ghost" size="icon" onClick={onLogout} className="text-primary-foreground hover:bg-primary-foreground/10" title="Logout">
                    <LogOut />
                    <span className="sr-only">Logout</span>
                </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background px-4 sm:hidden">
            <SidebarTrigger />
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
