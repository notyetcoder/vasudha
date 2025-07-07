
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

const navLinks = [
    { href: '/register', label: 'Register' },
    { href: '/explore', label: 'Explore' },
];

export default function MainHeader() {
    const pathname = usePathname();

    if (pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-12 w-12 text-primary" />
                </Link>
                <div className="flex items-center gap-4">
                     <nav className="hidden sm:flex items-center gap-4 text-sm md:gap-6">
                        {navLinks.map(link => (
                            <Link key={link.label} href={link.href} className={cn("transition-colors hover:text-foreground/80", pathname === link.href ? "text-foreground" : "text-foreground/60")}>
                            {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
}
