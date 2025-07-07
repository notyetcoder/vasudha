
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle, Eye, Upload, Download, Code, Users, UserCheck, UserPlus, FileUp, FileDown, Network } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useState, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
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
import type { AdminUser } from '@/lib/admin-data';
import UserFormModal from './UserFormModal';
import { useRouter } from 'next/navigation';
import { approveUserAction, deleteUserAction, importUsersAction, updateUserAction } from '@/actions/users';


function UsersTable({ users: userList, allUsers, isPending, onEdit, onDelete, onApprove, adminUser }: { users: User[]; allUsers: User[]; isPending: boolean; onEdit: (user: User) => void; onDelete: (user: User) => void; onApprove: (user: User) => void; adminUser: AdminUser }) {
  
  const canEdit = adminUser.role === 'super-admin' || adminUser.role === 'editor';
  const canDelete = adminUser.role === 'super-admin';
  const canApprove = adminUser.role === 'super-admin' || adminUser.role === 'editor';
  
  const sortedSurnames = useMemo(() => {
    const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
    const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
    return [...new Set([...maidenNames, ...currentSurnames])].sort((a, b) => b.length - a.length);
  }, [allUsers]);

  const parseFirstName = (fullName?: string) => {
      if (!fullName) return '';
      let potentialFirstName = fullName;
      for (const surname of sortedSurnames) {
          if (fullName.endsWith(surname)) {
              potentialFirstName = fullName.substring(0, fullName.length - surname.length).trim();
              return potentialFirstName;
          }
      }
      return potentialFirstName || fullName;
  };

  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Birth Date</TableHead>
          <TableHead>Parents</TableHead>
          <TableHead>Spouse</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-4">
                <Image
                  src={user.profilePictureUrl}
                  alt={user.name}
                  width={40}
                  height={40}
                  data-ai-hint="user avatar"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">
                    {user.name}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user.gender}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {user.birthMonth && user.birthYear ? (
                  <>
                    <div className="font-medium">{user.birthMonth.substring(0, 3).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{user.birthYear}</div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">N/A</div>
                )
              }
            </TableCell>
            <TableCell>
                <p className="font-medium">{parseFirstName(user.fatherName)}</p>
                <p className="text-sm text-muted-foreground">{parseFirstName(user.motherName)}</p>
            </TableCell>
            <TableCell>
                {parseFirstName(user.spouseName) || 'N/A'}
            </TableCell>
            <TableCell>
              <Badge variant={user.status === 'approved' ? 'default' : 'secondary'} className="capitalize">{user.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    {isPending && canApprove && (
                        <Button variant="ghost" size="icon" onClick={() => onApprove(user)}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="sr-only">Approve</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/profile/${user.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                    </Button>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tree/${user.id}`}>
                            <Network className="h-4 w-4" />
                            <span className="sr-only">View Tree</span>
                        </Link>
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(user)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                      </Button>
                    )}
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

type AdminDashboardProps = {
  allUsers: User[];
  totalUsers: number;
  pendingUsers: User[];
  approvedUsers: User[];
  adminUser: AdminUser;
};

export default function AdminDashboard({ allUsers, totalUsers, pendingUsers, approvedUsers, adminUser }: AdminDashboardProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const handleExport = () => {
        const usersToExport = [...pendingUsers, ...approvedUsers];
        const fields = [
            "name", "maidenName", "surname", "family", "gender", 
            "maritalStatus", "fatherName", "motherName", "spouseName", 
            "birthMonth", "birthYear", "description", "profilePictureUrl"
        ];
        const csvData = Papa.unparse({ fields, data: usersToExport });
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `vasudha_users_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
      const headers = ["name", "maidenName", "surname", "family", "gender", "maritalStatus", "fatherName", "motherName", "spouseName", "birthMonth", "birthYear", "description", "profilePictureUrl"];
      const csv = Papa.unparse([headers]);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "vasudha_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File is not readable");

                let importedData;
                if (file.type === 'text/csv') {
                    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
                    if(parsed.errors.length > 0){
                       throw new Error(`CSV Parsing Error: ${parsed.errors[0].message}`);
                    }
                    importedData = parsed.data;
                } else { // Assume JSON
                    importedData = JSON.parse(text);
                }
                
                if (!Array.isArray(importedData) || (importedData.length > 0 && !importedData.every(item => 'name' in item && 'surname' in item))) {
                    throw new Error("Invalid file format. Expected an array of user objects.");
                }

                const result = await importUsersAction(importedData as User[]);
                if (result.success) {
                    toast({ title: "Success", description: result.message });
                    router.refresh();
                } else {
                    toast({ variant: "destructive", title: "Import Failed", description: result.message });
                }

            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: "destructive", title: "Import Failed", description: message });
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleEditUser = (user: User) => {
      setEditingUser(user);
    }

    const handleSaveUser = async (updatedUser: User) => {
      const result = await updateUserAction(updatedUser);
      if (result.success) {
        toast({ title: "Success", description: "User data updated successfully." });
        setEditingUser(null);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update user." });
      }
    }
    
    const handleApproveUser = async (user: User) => {
        const result = await approveUserAction(user.id);
        if (result.success) {
            toast({ title: "Profile Approved", description: `${user.name} is now visible.` });
            router.refresh();
        } else {
            toast({ variant: "destructive", title: "Approval Failed" });
        }
    }

    const handleInitiateDelete = (user: User) => {
        setUserToDelete(user);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        const result = await deleteUserAction(userToDelete.id);
        if (result.success) {
            toast({ title: "User Deleted", description: `The profile for ${userToDelete.name} has been removed.`});
            router.refresh();
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete user."});
        }
        setUserToDelete(null);
    };
    
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Profiles</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{approvedUsers.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{pendingUsers.length}</div></CardContent>
                </Card>
            </div>
            
             <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">User Profiles</h2>
                <div className='flex gap-2'>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv,.json" />
                    <Button variant="outline" onClick={handleUploadClick}><FileUp className="mr-2 h-4 w-4" /> Import</Button>
                    <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /> Export All</Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Get Template</Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedUsers.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <Card><CardContent className="p-0"><UsersTable users={allUsers} allUsers={allUsers} isPending={false} adminUser={adminUser} onEdit={handleEditUser} onDelete={handleInitiateDelete} onApprove={handleApproveUser} /></CardContent></Card>
                </TabsContent>
                <TabsContent value="pending">
                     <Card><CardContent className="p-0"><UsersTable users={pendingUsers} allUsers={allUsers} isPending={true} adminUser={adminUser} onEdit={handleEditUser} onDelete={handleInitiateDelete} onApprove={handleApproveUser} /></CardContent></Card>
                </TabsContent>
                <TabsContent value="approved">
                     <Card><CardContent className="p-0"><UsersTable users={approvedUsers} allUsers={allUsers} isPending={false} adminUser={adminUser} onEdit={handleEditUser} onDelete={handleInitiateDelete} onApprove={handleApproveUser} /></CardContent></Card>
                </TabsContent>
            </Tabs>

            <UserFormModal mode="edit" isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser!} onSave={handleSaveUser} />

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the profile for <span className="font-bold">{userToDelete?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
