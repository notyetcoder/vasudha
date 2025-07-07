'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConnectLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-start border-b bg-white px-6 dark:bg-slate-950">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Back to Admin Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
