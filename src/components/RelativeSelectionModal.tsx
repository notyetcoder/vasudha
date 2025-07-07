
'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import type { User } from '@/lib/data';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

type RelativeSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  allUsers: User[];
  onSelect: (user: User) => void;
  onManualSave: (name: string) => void;
  title: string;
  selectionType: 'father' | 'mother' | 'spouse' | null;
};

export default function RelativeSelectionModal({
  isOpen,
  onClose,
  users,
  allUsers,
  onSelect,
  onManualSave,
  title,
  selectionType,
}: RelativeSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [manualName, setManualName] = useState('');

  const allSurnamesInDb = useMemo(() => {
    const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
    const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
    return [...new Set([...maidenNames, ...currentSurnames])].sort((a,b) => {
      if (a.length !== b.length) {
        return b.length - a.length;
      }
      return a.localeCompare(b);
    });
  }, [allUsers]);

  const getFirstName = (fullName?: string) => {
      if (!fullName) return '';
      let potentialFirstName = fullName;
      for (const surname of allSurnamesInDb) {
          if (potentialFirstName.endsWith(surname)) {
              return potentialFirstName.substring(0, potentialFirstName.length - surname.length).trim();
          }
      }
      return potentialFirstName;
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      `${user.name} ${user.surname} ${getFirstName(user.fatherName)}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm, getFirstName]);

  const handleManualSave = () => {
    if (manualName.trim()) {
      onManualSave(manualName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select an existing person from the list, or manually enter a name below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <p className="text-sm font-medium text-foreground">Select Existing Person</p>
            <Input
                placeholder="Search by name, surname, or father's name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-60 w-full rounded-md border">
                <div className="p-4 space-y-2">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      return (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-3">
                              <Image
                                  src={user.profilePictureUrl}
                                  alt={user.name}
                                  width={40}
                                  height={40}
                                  data-ai-hint="profile avatar"
                                  className="rounded-full"
                              />
                              <div>
                                  <div className="flex items-center gap-2">
                                     <p className="text-sm font-medium">{user.name} {user.surname}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {user.fatherName && (
                                        <p className="text-xs text-muted-foreground">
                                            {user.gender === 'male' ? 's/o' : 'd/o'} {getFirstName(user.fatherName)}
                                        </p>
                                    )}
                                  </div>
                              </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => onSelect(user)}>
                            Select
                          </Button>
                      </div>
                      )
                    })
                ) : (
                    <div className="text-center text-muted-foreground p-4 text-sm">
                        No matching users found.
                    </div>
                )}
                </div>
            </ScrollArea>
            
            <Separator className="my-2" />

            <div>
                <p className="text-sm font-medium mb-2 text-foreground">Manual Entry (if not found)</p>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter full name (e.g. RAMESHVARCHAND)"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    />
                    <Button onClick={handleManualSave} disabled={!manualName.trim()}>Save Name</Button>
                </div>
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
