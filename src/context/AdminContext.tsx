'use client';
import type { AdminUser } from '@/lib/admin-data';
import { createContext, useContext, useState, type ReactNode } from 'react';

type AdminContextType = {
    adminUser: AdminUser | null;
    setAdminUser: (user: AdminUser | null) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

    return (
        <AdminContext.Provider value={{ adminUser, setAdminUser }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
