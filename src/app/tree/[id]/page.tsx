
'use client';
import { findUserById } from '@/lib/data';
import { getUsers } from '@/actions/users';
import { useParams, notFound } from 'next/navigation';
import FamilyTree from '@/components/FamilyTree';
import BackButton from '@/components/BackButton';
import { useEffect, useState } from 'react';
import type { User as UserData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TreePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [user, setUser] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const usersFromServer = await getUsers();
        const centralUser = findUserById(id, usersFromServer);
        
        if (!centralUser) {
          notFound();
          return;
        }

        setAllUsers(usersFromServer);
        setUser(centralUser);
      } catch (error) {
        console.error("Failed to fetch tree data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (isLoading || !user) {
    return (
        <div className="h-screen flex flex-col">
            <header className="container mx-auto py-4 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b">
                <div className='flex items-center gap-4'>
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-32" />
                </div>
            </header>
            <main className="flex-1 w-full p-4 border rounded-lg bg-white dark:bg-slate-950 shadow-inner overflow-hidden flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading Family Tree...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we assemble the connections.</p>
                </div>
            </main>
        </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
       <header className="container mx-auto py-4 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b">
            <div className='flex items-center gap-4'>
                <BackButton />
                 <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-primary text-center">
                  Family Tree of {user.name}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <Button asChild variant="outline">
                    <Link href={`/profile/${user.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        View Profile
                    </Link>
                </Button>
            </div>
      </header>
      <main className="flex-1 w-full p-4 border rounded-lg bg-white dark:bg-slate-950 shadow-inner overflow-hidden">
        <FamilyTree 
            key={user.id} 
            centralUser={user} 
            allUsers={allUsers}
        />
      </main>
    </div>
  );
}

    
