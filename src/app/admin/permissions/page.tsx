'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddAdminForm from '@/components/AddAdminForm';
import { useToast } from '@/hooks/use-toast';
import type { AdminUser } from '@/lib/admin-data';
import { getAdmins } from '@/lib/admin-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAdmin } from '@/context/AdminContext';
import { removeAdmin } from '@/actions/auth';


export default function PermissionsPage() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  const fetchAdmins = async () => {
    try {
        const adminList = await getAdmins();
        setAdmins(adminList);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to load admins',
            description: 'There was an error fetching the admin data.',
        });
    }
  };

  useEffect(() => {
    if (adminUser && adminUser.role !== 'super-admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
      });
      router.push('/admin');
    } else if (adminUser) {
      fetchAdmins();
    }
  }, [adminUser, router, toast]);

  const handleAdminAdded = () => {
    fetchAdmins();
    setIsAddDialogOpen(false);
  }

  const openDeleteDialog = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete || !adminUser) return;

    const result = await removeAdmin(adminToDelete.id, adminUser.id);
    if (result.success) {
      toast({
        title: 'Admin Removed',
        description: result.message,
      });
      fetchAdmins(); // Refresh list
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
    setIsDeleteDialogOpen(false);
    setAdminToDelete(null);
  };


  if (!adminUser || adminUser.role !== 'super-admin') {
    return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-amber-300 mb-2">
            User Permissions
          </h1>
          <p className="text-neutral-300">
            Manage admin users and their roles.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin User</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new administrator or editor.
              </DialogDescription>
            </DialogHeader>
            <AddAdminForm onAdminAdded={handleAdminAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            List of users with access to this admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.username}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === 'super-admin' ? 'default' : 'secondary'}>
                      {admin.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-right">
                    {admin.id !== adminUser.id && (
                       <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(admin)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete Admin</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the admin account for{' '}
              <span className="font-bold">{adminToDelete?.name}</span> and remove their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive hover:bg-destructive/90">
              Yes, delete admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
