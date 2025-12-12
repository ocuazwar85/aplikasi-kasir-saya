'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Wifi } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import FirstTimeSetupDialog from '@/components/auth/FirstTimeSetupDialog';
import LoginForm from '@/components/auth/LoginForm';

function LoginPageContent() {
  const { isFirstTime, settings, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <FirstTimeSetupDialog open={isFirstTime} />
      <Card className="w-full max-w-md animate-in fade-in-50 zoom-in-95">
        <CardHeader className="items-center text-center">
            {settings?.logoUrl ? (
            <Image src={settings.logoUrl} alt={settings.storeName || 'Logo'} width={120} height={40} className="object-contain h-14 w-auto mb-2" />
          ) : (
            <Logo className="mb-4" />
          )}
          {settings ? (
            <>
              <CardTitle className="text-2xl font-bold">{settings.storeName}</CardTitle>
              <CardDescription className="text-sm">
                {settings.address} | {settings.phone}
              </CardDescription>
            </>
          ) : (
             <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          {!isFirstTime && <LoginForm />}
        </CardContent>
        {!isFirstTime && (
            <CardFooter className="flex justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Database Connected</span>
                </div>
            </CardFooter>
        )}
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-secondary p-4">
       <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }>
         <LoginPageContent />
       </Suspense>
    </main>
  );
}
