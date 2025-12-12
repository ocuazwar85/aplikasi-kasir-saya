'use client';

import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import FooterMenu from '@/components/layout/FooterMenu';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col bg-background shadow-lg">
        <AppHeader />
        
        {/* Sticky Navigation below header */}
        <div className="sticky top-0 z-30 bg-card p-2 shadow-md">
          <BottomNav />
        </div>

        <main className="flex-grow p-4 md:p-6 pb-24 md:pb-6">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
