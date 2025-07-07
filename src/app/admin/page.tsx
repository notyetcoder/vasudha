'use client';
import React, { useEffect, useState, useCallback } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import { getUsers } from '@/actions/users';
import type { User } from '@/lib/data';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { adminUser } = useAdmin();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const usersFromServer = await getUsers();
      setAllUsers(usersFromServer);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load users',
        description: 'There was an error fetching the user data.',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser, fetchUsers]);

  if (!adminUser) {
    return null; // Handled by the layout
  }

  const pendingUsers = allUsers.filter(u => u.status === 'pending');
  const approvedUsers = allUsers.filter(u => u.status === 'approved');

  return (
    <>
      <div className="flex justify-between items-center mb-8">
            <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-amber-300 mb-2">
                Profiles
            </h1>
            <p className="text-neutral-300">
                Manage all user entries. You can edit, delete, and approve registrations.
            </p>
            </div>
      </div>
      <AdminDashboard 
        adminUser={adminUser}
        allUsers={allUsers}
        totalUsers={allUsers.length}
        pendingUsers={pendingUsers} 
        approvedUsers={approvedUsers}
      />
    </>
  );
}
