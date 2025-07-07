'use client';
import type { User } from '@/lib/data';
import { findChildren, findSiblings, findUserByName } from '@/lib/data';
import { Card, CardContent } from './ui/card';
import Image from 'next/image';
import { UserPlus } from 'lucide-react';
import { Button } from './ui/button';

interface FamilyConnectionDetailsProps {
  selectedUser: User;
  allUsers: User[];
  onAddNewRelative: (prefillData: Partial<User>) => void;
}

const RelativeCard = ({ person, relationship }: { person: User; relationship: string }) => (
  <Card className="bg-background">
    <CardContent className="p-2 flex items-center gap-3">
      <Image src={person.profilePictureUrl} alt={person.name} width={40} height={40} data-ai-hint="profile avatar" className="rounded-full" />
      <div>
        <p className="font-semibold text-sm leading-tight">{person.name} {person.surname}</p>
        <p className="text-xs text-muted-foreground">{relationship}</p>
      </div>
    </CardContent>
  </Card>
);

const AddRelativeCard = ({ relationship, onClick, disabled = false }: { relationship: string, onClick: () => void, disabled?: boolean }) => (
    <Button variant="outline" onClick={onClick} disabled={disabled} className="w-full h-full border-dashed border-2 flex items-center justify-center gap-2">
        <UserPlus className="h-4 w-4" />
        Add {relationship}
    </Button>
);

export default function FamilyConnectionDetails({ selectedUser, allUsers, onAddNewRelative }: FamilyConnectionDetailsProps) {
  const siblings = findSiblings(selectedUser, allUsers);
  const children = findChildren(selectedUser, allUsers);
  
  const handleAddSibling = () => {
    onAddNewRelative({
        fatherName: selectedUser.fatherName,
        motherName: selectedUser.motherName,
        surname: selectedUser.surname,
    });
  };

  const handleAddChild = () => {
     const prefill: Partial<User> = { surname: selectedUser.surname };
     if (selectedUser.gender === 'male') {
        prefill.fatherName = `${selectedUser.name} ${selectedUser.surname}`;
        if(selectedUser.spouseName) prefill.motherName = selectedUser.spouseName;
     } else {
        prefill.motherName = `${selectedUser.name} ${selectedUser.surname}`;
        if(selectedUser.spouseName) prefill.fatherName = selectedUser.spouseName;
     }
     onAddNewRelative(prefill);
  };

  return (
    <div>
      <h4 className="font-semibold text-sm mb-3">Immediate Family</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {siblings.map(s => <RelativeCard key={s.id} person={s} relationship={s.gender === 'male' ? 'Brother' : 'Sister'} />)}
        {children.map(c => <RelativeCard key={c.id} person={c} relationship={c.gender === 'male' ? 'Son' : 'Daughter'} />)}
        <AddRelativeCard relationship="Sibling" onClick={handleAddSibling} disabled={!selectedUser.fatherName && !selectedUser.motherName} />
        <AddRelativeCard relationship="Child" onClick={handleAddChild} />
      </div>
    </div>
  );
}
