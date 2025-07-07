'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Search, ArrowRight } from 'lucide-react';

export default function Home() {
  
  const navItems = [
    {
      href: '/register',
      label: 'Register Your Profile',
      description: 'Join the community by adding your family details.',
      icon: <UserPlus className="h-6 w-6 text-primary" />,
    },
    {
      href: '/explore',
      label: 'Explore The Community',
      description: 'Search for relatives and explore family connections.',
      icon: <Search className="h-6 w-6 text-primary" />,
    },
  ];
  
  return (
    <div className="relative flex-grow flex flex-col items-center justify-center p-4 lg:p-8 bg-background">
      <div className="max-w-4xl w-full text-center space-y-6">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-wide">
          वसुधैव कुटुम्बकम्
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
          Welcome to a living digital archive of our family tree. A place to register, connect, and explore our shared roots and preserve generations of relationships.
        </p>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-12">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="block group">
            <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-secondary p-3 rounded-lg">
                  {item.icon}
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">{item.label}</CardTitle>
                </div>
                 <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
