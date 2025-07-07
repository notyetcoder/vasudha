'use client';
import React, { useEffect, useState, useCallback } from 'react';
import ConnectRelationsDashboard from '@/components/ConnectRelationsDashboard';
import { getUsers } from '@/actions/users';
import type { User } from '@/lib/data';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/hooks/use-toast';

export default function ConnectPage() {
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
    return null; 
  }

  return (
    <ConnectRelationsDashboard allUsers={allUsers} adminUser={adminUser} />
  );
}
