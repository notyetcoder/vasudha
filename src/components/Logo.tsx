'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-12 h-12", className)}>
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/7/7f/Rotating_earth_animated_transparent.gif"
        alt="Rotating Earth Logo"
        layout="fill"
        objectFit="contain"
        unoptimized
      />
    </div>
  );
}
