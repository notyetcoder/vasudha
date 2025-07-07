'use client';

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { AdminUser } from "@/lib/admin-data";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import AdminLogin from '@/components/AdminLogin';
import AdminLayout from '@/components/AdminLayout';

function AdminAuthWrapper({ children }: { children: ReactNode }) {
    const { adminUser, setAdminUser } = useAdmin();
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    const handleLoginSuccess = (user: AdminUser) => {
        setAdminUser(user);
        toast({
            title: 'Login Successful',
            description: `Welcome, ${user.name}.`,
        });
    };

    const handleLogout = () => {
        setAdminUser(null);
        toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.',
        });
        router.push('/admin');
    };

    if (!adminUser) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }
    
    // If it's a page that needs a special layout (like the connect page),
    // don't wrap with the standard AdminLayout. The specific layout for that
    // page will be applied by Next.js.
    if (pathname.startsWith('/admin/connect')) {
        return <>{children}</>;
    }

    return (
        <AdminLayout adminUser={adminUser} onLogout={handleLogout}>
            {children}
        </AdminLayout>
    );
}

export default function AdminSectionLayout({ children }: { children: ReactNode; }) {
  return (
    <AdminProvider>
        <AdminAuthWrapper>
            {children}
        </AdminAuthWrapper>
    </AdminProvider>
  );
}
