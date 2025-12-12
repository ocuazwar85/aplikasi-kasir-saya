'use client';

import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { loading } = useAuth();

  // The sole purpose of this page is to act as a loading gate.
  // The AuthProvider is now responsible for all redirection logic.
  // We just show a loader until the AuthProvider redirects the user.
  // This prevents any rendering of child pages before the auth state is fully determined.

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Once loading is false, the AuthProvider will have already initiated a redirect.
  // We can show a loader as a fallback.
   return (
    <div className="flex h-screen items-center justify-center bg-secondary">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4">Mengarahkan...</p>
    </div>
  );
}
