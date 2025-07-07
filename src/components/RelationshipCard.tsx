'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';

type RelationshipCardProps = {
  person: User;
  relationship: string;
  showSurname?: boolean;
};

export default function RelationshipCard({ person, relationship, showSurname = false }: RelationshipCardProps) {
  const displayName = showSurname ? `${person.name} ${person.surname}` : person.name;

  return (
    <Link href={`/profile/${person.id}`} className="block group">
      <Card className="hover:shadow-md transition-shadow duration-200 hover:border-primary/30">
        <CardContent className="p-3 flex items-center gap-4">
          <Image
            src={person.profilePictureUrl}
            alt={displayName}
            width={40}
            height={40}
            data-ai-hint="profile avatar"
            className="rounded-full"
          />
          <div>
            <div className="leading-tight">
              <p className="font-semibold text-primary">{person.name}</p>
              {showSurname && (
                <p className="text-sm font-medium text-primary/80">{person.surname}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {relationship}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
