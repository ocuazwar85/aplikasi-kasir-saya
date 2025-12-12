'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Terminal, Eraser } from 'lucide-react';
import { factoryReset } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';


export default function DatabaseSettings() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [isResetting, setIsResetting] = React.useState(false);

  const handleFactoryReset = async () => {
    setIsResetting(true);
    try {
      await factoryReset();
      toast({
        title: 'Reset Berhasil',
        description: 'Semua data telah dihapus. Aplikasi akan dimulai ulang.',
      });

      // Logout to clear session storage, then reload the page
      logout();
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (error) {
      console.error('Failed to factory reset:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal melakukan reset data.',
      });
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle>Reset Data Pabrik</CardTitle>
          <CardDescription>
            Menghapus **SEMUA** data di database saat ini (pengguna, penjualan, produk, dll.) dan memulai ulang aplikasi dari awal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Peringatan Keras!</AlertTitle>
            <AlertDescription>
              Tindakan ini tidak dapat dibatalkan. Hanya gunakan jika Anda ingin menghapus total database saat ini dan kembali ke setup awal.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Eraser className="mr-2 h-4 w-4" />
                Reset Total Aplikasi
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda benar-benar yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ini akan menghapus **SEMUA DATA** dari database yang terhubung saat ini.
                  Aplikasi akan kembali ke layar setup awal. Anda tidak bisa mengurungkan tindakan ini.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleFactoryReset} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
                  {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ya, Saya Mengerti dan Lanjutkan Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
