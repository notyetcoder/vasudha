'use client';

import { findUserById, findChildren, findSiblings, findGrandparents } from '@/lib/data';
import { getUsers } from '@/actions/users';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Heart, Calendar, Users, GitBranch, VenetianMask, Smile, GitFork, Network } from 'lucide-react';
import RelationshipCard from '@/components/RelationshipCard';
import type { User } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode, children: React.ReactNode }) => {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3 text-primary">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {children}
                </div>
            </CardContent>
        </Card>
    )
};

const PlaceholderCard = ({ relationship, name }: { relationship: string, name?: string | null }) => (
    <div className="border border-dashed rounded-lg p-3 flex items-center justify-center h-full">
        {name ? (
            <div className='text-center'>
                <p className="text-muted-foreground font-semibold">{name}</p>
                <p className="text-muted-foreground italic text-xs">({relationship} - not linked)</p>
            </div>
        ) : (
            <p className="text-muted-foreground italic text-sm">{relationship} not linked</p>
        )}
    </div>
);


export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const usersFromServer = await getUsers();
        const mainUser = usersFromServer.find((u) => u.id === id);
        if (!mainUser) {
          notFound();
          return;
        }
        setUser(mainUser);
        setAllUsers(usersFromServer);
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const relationships = useMemo(() => {
    if (!user) return null;

    const father = findUserById(user.fatherId, allUsers);
    const mother = findUserById(user.motherId, allUsers);
    const spouse = findUserById(user.spouseId, allUsers);
    const children = findChildren(user, allUsers);
    const siblings = findSiblings(user, allUsers);
    const { paternalGrandfather, paternalGrandmother, maternalGrandfather, maternalGrandmother } = findGrandparents(user, allUsers);

    const fatherInLaw = spouse ? findUserById(spouse.fatherId, allUsers) : undefined;
    const motherInLaw = spouse ? findUserById(spouse.motherId, allUsers) : undefined;
    const brothersInLaw = spouse ? findSiblings(spouse, allUsers).filter(s => s.gender === 'male') : [];
    const sistersInLaw = spouse ? findSiblings(spouse, allUsers).filter(s => s.gender === 'female') : [];
    
    const paternalUncles = father ? findSiblings(father, allUsers).filter(s => s.gender === 'male') : [];
    const paternalAuntsByMarriage = paternalUncles.map(uncle => findUserById(uncle.spouseId, allUsers)).filter((aunt): aunt is User => !!aunt);
    const paternalAunts = father ? findSiblings(father, allUsers).filter(s => s.gender === 'female') : [];
    const paternalUnclesByMarriage = paternalAunts.map(aunt => findUserById(aunt.spouseId, allUsers)).filter((uncle): uncle is User => !!uncle);

    const maternalUncles = mother ? findSiblings(mother, allUsers).filter(s => s.gender === 'male') : [];
    const maternalAuntsByMarriage = maternalUncles.map(uncle => findUserById(uncle.spouseId, allUsers)).filter((aunt): aunt is User => !!aunt);
    const maternalAunts = mother ? findSiblings(mother, allUsers).filter(s => s.gender === 'female') : [];
    const maternalUnclesByMarriage = maternalAunts.map(aunt => findUserById(aunt.spouseId, allUsers)).filter((uncle): uncle is User => !!uncle);

    const paternalCousins = father ? findSiblings(father, allUsers).flatMap(sibling => findChildren(sibling, allUsers)) : [];
    const maternalCousins = mother ? findSiblings(mother, allUsers).flatMap(sibling => findChildren(sibling, allUsers)) : [];
    
    return {
      father, mother, spouse, children, siblings,
      ancestors: [
          paternalGrandfather && { person: paternalGrandfather, relationship: "Father's Father" },
          paternalGrandmother && { person: paternalGrandmother, relationship: "Father's Mother" },
          maternalGrandfather && { person: maternalGrandfather, relationship: "Mother's Father" },
          maternalGrandmother && { person: maternalGrandmother, relationship: "Mother's Mother" }
      ].filter((r): r is { person: User; relationship: string } => !!r),
      unclesAndAunts: [
        ...paternalUncles.map(p => ({ person: p, relationship: "Paternal Uncle" })),
        ...paternalAuntsByMarriage.map(p => ({ person: p, relationship: "Paternal Aunt (by marriage)" })),
        ...paternalAunts.map(p => ({ person: p, relationship: "Paternal Aunt" })),
        ...paternalUnclesByMarriage.map(p => ({ person: p, relationship: "Paternal Uncle (by marriage)" })),
        ...maternalUncles.map(p => ({ person: p, relationship: "Maternal Uncle" })),
        ...maternalAuntsByMarriage.map(p => ({ person: p, relationship: "Maternal Aunt (by marriage)" })),
        ...maternalAunts.map(p => ({ person: p, relationship: "Maternal Aunt" })),
        ...maternalUnclesByMarriage.map(p => ({ person: p, relationship: "Maternal Uncle (by marriage)" })),
      ],
      cousins: [
        ...paternalCousins.map(p => ({ person: p, relationship: 'Cousin' })),
        ...maternalCousins.map(p => ({ person: p, relationship: 'Cousin' })),
      ],
      allInLaws: [
          fatherInLaw && { person: fatherInLaw, relationship: "Father-in-law" },
          motherInLaw && { person: motherInLaw, relationship: "Mother-in-law" },
          ...brothersInLaw.map(p => ({ person: p, relationship: "Brother-in-law" })),
          ...sistersInLaw.map(p => ({ person: p, relationship: "Sister-in-law" })),
      ].filter((r): r is { person: User; relationship: string } => !!r),
    };
  }, [user, allUsers]);

  if (isLoading || !user || !relationships) {
    return (
        <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6">
            <div className="mb-8 flex justify-between items-center">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col items-center">
                    <Card className="w-full sticky top-24">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <Skeleton className="h-[150px] w-[150px] rounded-full mb-4" />
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-3/4 mb-6" />
                            <Separator className="my-6" />
                            <div className='text-left w-full space-y-4 text-sm'>
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full" />
                             <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
  }

  const { father, mother, spouse, children, siblings, ancestors, unclesAndAunts, cousins, allInLaws } = relationships;
  const birthDate = user.birthMonth && user.birthYear ? `${user.birthMonth.substring(0, 3).toUpperCase()}${user.birthYear}` : null;

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6">
       <div className="mb-8 flex justify-between items-center">
        <BackButton />
         <Button asChild>
          <Link href={`/tree/${user.id}`}>
            <Network className="mr-2 h-4 w-4" />
            View Family Tree
          </Link>
        </Button>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col items-center">
          <Card className="w-full sticky top-24">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Image
                src={user.profilePictureUrl}
                alt={`${user.name}`}
                width={150}
                height={150}
                data-ai-hint="profile picture"
                className="rounded-full mb-4 border-4 border-background shadow-lg"
              />
              <div className="flex items-center gap-2">
                <h1 className="font-headline text-3xl font-bold text-primary">
                  {user.name}
                </h1>
                {user.status === 'pending' && (
                  <Badge variant="secondary">Pending Approval</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-2">{user.description || ''}</p>
              <Separator className="my-6" />
              <div className='text-left w-full space-y-4 text-sm'>
                  <div className="flex items-center"><UserIcon className="w-4 h-4 mr-3 text-muted-foreground" /> <span className='font-semibold mr-2'>Gender:</span> {user.gender}</div>
                  <div className="flex items-center"><Heart className="w-4 h-4 mr-3 text-muted-foreground" /> <span className='font-semibold mr-2'>Marital Status:</span> {user.maritalStatus}</div>
                  {birthDate && (<div className="flex items-center"><Calendar className="w-4 h-4 mr-3 text-muted-foreground" /> <span className='font-semibold mr-2'>Born:</span> {birthDate}</div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
            <SectionCard title="Immediate Family" icon={<Users />}>
                {father ? <RelationshipCard person={father} relationship="Father" showSurname={user.gender === 'female'} /> : <PlaceholderCard relationship="Father" name={user.fatherName} />}
                {mother ? <RelationshipCard person={mother} relationship="Mother" /> : <PlaceholderCard relationship="Mother" name={user.motherName} />}
                {user.maritalStatus === 'married' ? 
                    (spouse ? <RelationshipCard person={spouse} relationship={user.gender === 'male' ? 'Wife' : 'Husband'} /> : <PlaceholderCard relationship="Spouse" name={user.spouseName} />)
                    : null
                }
            </SectionCard>
             
             <SectionCard title="Siblings" icon={<Users />}>
                {siblings.length > 0 ? (
                  siblings.map(s => <RelationshipCard key={s.id} person={s} relationship={s.gender === 'male' ? 'Brother' : 'Sister'} />)
                ) : (
                  <p className="text-muted-foreground italic col-span-full text-center py-4">No siblings found.</p>
                )}
            </SectionCard>

            <SectionCard title="Children" icon={<Smile />}>
                 {children.length > 0 ? (
                    children.map(c => <RelationshipCard key={c.id} person={c} relationship={c.gender === 'male' ? 'Son' : 'Daughter'} />)
                 ) : (
                  <p className="text-muted-foreground italic col-span-full text-center py-4">No children found.</p>
                 )}
            </SectionCard>

            <SectionCard title="Ancestors" icon={<GitBranch />}>
                {ancestors.length > 0 ? (
                    ancestors.map(r => <RelationshipCard key={r.person.id} person={r.person} relationship={r.relationship} />)
                ) : (
                  <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PlaceholderCard relationship="Father's Father" name={father?.fatherName} />
                    <PlaceholderCard relationship="Father's Mother" name={father?.motherName} />
                    <PlaceholderCard relationship="Mother's Father" name={mother?.fatherName} />
                    <PlaceholderCard relationship="Mother's Mother" name={mother?.motherName} />
                  </div>
                )}
            </SectionCard>
            
            <SectionCard title="Uncles & Aunts" icon={<GitFork />}>
                {unclesAndAunts.length > 0 ? (
                    unclesAndAunts.map(r => <RelationshipCard key={r.person.id} person={r.person} relationship={r.relationship} />)
                ) : (
                    <p className="text-muted-foreground italic col-span-full text-center py-4">No uncles or aunts found.</p>
                )}
            </SectionCard>
            
            <SectionCard title="Cousins" icon={<Users />}>
                {cousins.length > 0 ? (
                    cousins.map(r => <RelationshipCard key={r.person.id} person={r.person} relationship={r.relationship} />)
                ) : (
                    <p className="text-muted-foreground italic col-span-full text-center py-4">No cousins found.</p>
                )}
            </SectionCard>
            
            {user.maritalStatus === 'married' &&
              <SectionCard title="In-Laws" icon={<VenetianMask />}>
                  {allInLaws.length > 0 ? (
                      allInLaws.map(r => <RelationshipCard key={r.person.id} person={r.person} relationship={r.relationship} />)
                  ) : (
                      <p className="text-muted-foreground italic col-span-full text-center py-4">No in-laws found.</p>
                  )}
              </SectionCard>
            }
        </div>
      </div>
    </div>
  );
}
