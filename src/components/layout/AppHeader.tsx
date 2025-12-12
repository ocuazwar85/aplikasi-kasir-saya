'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, LogOut, UserCircle, Wifi } from 'lucide-react';
import { format } from 'date-fns';

export default function AppHeader() {
  const { user, settings, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // This code runs only on the client, after hydration
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="shrink-0 bg-card shadow-sm z-40">
      {/* Top Row */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/kasir" aria-label="Home">
            {settings?.logoUrl ? (
                <Image src={settings.logoUrl} alt={settings.storeName || 'Logo'} width={140} height={40} className="object-contain h-10 w-auto" />
            ) : (
                <Logo />
            )}
          </Link>
          {settings && (
            <div className="text-xs text-muted-foreground">
                <div className="font-bold text-sm text-foreground">{settings.storeName}</div>
                <div>{settings.address} | {settings.phone}</div>
                <div>Owner: {settings.owner}</div>
            </div>
        )}
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Button asChild variant="ghost" size="icon">
              <Link href="/pengaturan">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
          )}
           <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
            <UserCircle className="h-5 w-5 text-primary"/>
            <span>{user?.name || 'Guest'}</span>
          </div>
        </div>
      </div>
      
      <Separator />

      {/* Middle Row */}
      <div className="flex items-center justify-between p-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-xs">{currentTime ? format(currentTime, 'eeee, dd MMM yyyy') : '...'}</span>
        </div>
        <span className="text-xs font-semibold tabular-nums">{currentTime ? format(currentTime, 'HH:mm:ss') : '--:--:--'}</span>
        <Button variant="ghost" size="sm" onClick={logout} className="text-xs">
          <LogOut className="mr-1 h-3 w-3" />
          Log Off
        </Button>
      </div>
    </header>
  );
}
