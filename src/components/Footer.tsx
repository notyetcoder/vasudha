'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="w-full py-4 px-8 text-sm text-muted-foreground bg-background border-t">
      <div className="container flex items-center justify-center gap-4">
          <p>&copy; 2025 Vasudha | All Rights Reserved</p>
          <Link href="/admin" title="Go to Admin Panel">
            <Logo className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity" />
          </Link>
      </div>
    </footer>
  );
}
