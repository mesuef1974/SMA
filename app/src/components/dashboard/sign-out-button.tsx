'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="تسجيل الخروج"
      onClick={() => signOut({ callbackUrl: '/login' })}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
