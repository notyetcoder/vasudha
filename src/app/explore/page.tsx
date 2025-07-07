
'use client';

import { useState, useEffect, useMemo } from 'react';
import { type User } from '@/lib/data';
import { getUsers } from '@/actions/users';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { SearchIcon, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Copied from registration form for consistency
const familyOptionsBySurname = {
  VARCHAND: [
    'DODHIYEVARA', 'GOKREVARA', 'KESRANI', 'PATEL', 'VARCHAND',
  ].sort(),
  MATA: [
    'BHANA RAMAIYA', 'DEVANI', 'DHANANI', 'JAGANI', 'KHENGAR', 'LADHANI',
    'RUPANI', 'SUJANI', 'TEJA TRIKAM', 'UKERANI', 'VAGHANI', 'VARJANG',
    'VIRANI', 'VISAMAN',
  ].sort(),
  CHHANGA: [
    'BHAGVANI', 'BHIMNAI', 'BHOJANI', 'DEHAR MANDA', 'GANGANI', 'NATHANI',
    'RATANI', 'SAMRANI', 'SAMTANI',
  ].sort(),
};

const surnameOptions = ['MATA', 'CHHANGA', 'VARCHAND'];

// Create a reverse mapping to find a surname from a family
const surnameByFamily = Object.entries(familyOptionsBySurname).reduce((acc, [surname, families]) => {
  families.forEach(family => {
    acc[family] = surname;
  });
  return acc;
}, {} as Record<string, string>);


function UserResultCard({ user }: { user: User }) {
  const birthDate = user.birthMonth && user.birthYear ? `${user.birthMonth.substring(0, 3).toUpperCase()}${user.birthYear}` : null;
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 group">
      <CardContent className="p-4 flex items-center gap-4">
        <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-grow">
          <Image
            src={user.profilePictureUrl}
            alt={`${user.name} ${user.surname}`}
            width={60}
            height={60}
            data-ai-hint="profile avatar"
            className="rounded-full border-2 border-background shadow-sm"
          />
          <div>
            <h3 className="font-semibold text-lg text-primary group-hover:underline">
              {user.name} {user.surname}
            </h3>
            {birthDate && (
                <p className="text-muted-foreground text-sm">
                  {birthDate}
                </p>
            )}
          </div>
        </Link>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/tree/${user.id}`} title="View Family Tree">
            <Network className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [surnameFilter, setSurnameFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchApprovedUsers = async () => {
      const allUsers = await getUsers();
      setApprovedUsers(allUsers.filter(user => user.status === 'approved'));
    };

    fetchApprovedUsers();
    window.addEventListener('users-updated', fetchApprovedUsers);
    return () => {
      window.removeEventListener('users-updated', fetchApprovedUsers);
    };
  }, []);
  
  // When surname filter changes, reset the family filter
  useEffect(() => {
    setFamilyFilter('all');
  }, [surnameFilter]);

  const filteredUsers = useMemo(() => {
    return approvedUsers.filter(user => {
        const searchMatch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.surname.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Match surname group by looking up the user's family in our reverse map
        const surnameMatch = surnameFilter === 'all' || surnameByFamily[user.family] === surnameFilter;
        // Match the specific family
        const familyMatch = familyFilter === 'all' || user.family === familyFilter;

        const genderMatch = genderFilter === 'all' || user.gender === genderFilter;
        const statusMatch = statusFilter === 'all' || user.maritalStatus === statusFilter;
        return searchMatch && surnameMatch && familyMatch && genderMatch && statusMatch;
    });
  }, [approvedUsers, searchTerm, surnameFilter, familyFilter, genderFilter, statusFilter]);

  const showResults = searchTerm.length > 0 || surnameFilter !== 'all' || familyFilter !== 'all' || genderFilter !== 'all' || statusFilter !== 'all';
  const currentFamilyOptions = familyOptionsBySurname[surnameFilter as keyof typeof familyOptionsBySurname] || [];


  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">
          वसुधैव कुटुम्बकम्
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Search for anyone in the community to view their profile and family connections.
        </p>
      </div>
      <div className="max-w-4xl mx-auto mb-12 space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or surname..."
            className="w-full pl-12 h-12 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={surnameFilter} onValueChange={setSurnameFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Surname" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Surnames</SelectItem>
                    {surnameOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={familyFilter} onValueChange={setFamilyFilter} disabled={surnameFilter === 'all'}>
                <SelectTrigger><SelectValue placeholder="Filter by Family" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Families</SelectItem>
                    {currentFamilyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Gender" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                </SelectContent>
            </Select>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Marital Status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {showResults ? (
        filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredUsers.map((user) => (
                <UserResultCard key={user.id} user={user} />
            ))}
            </div>
        ) : (
            <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No members found matching your search.</p>
            </div>
        )
      ) : (
         <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Use the search bar or filters to find community members.</p>
        </div>
      )}
    </div>
  );
}
