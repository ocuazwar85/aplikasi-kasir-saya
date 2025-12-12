'use client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StoreSettingsForm from '@/components/settings/StoreSettingsForm';
import UserManagement from '@/components/settings/UserManagement';
import DatabaseSettings from '@/components/settings/DatabaseSettings';

export default function PengaturanPage() {
    const { user } = useAuth();

    if (user?.role !== 'admin') {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Akses Ditolak</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Aplikasi</CardTitle>
        <CardDescription>Kelola pengaturan toko, pengguna, dan data aplikasi Anda.</CardDescription>
      </CardHeader>
      <CardContent>
         <Tabs defaultValue="store">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="store">Toko</TabsTrigger>
                <TabsTrigger value="users">Pengguna</TabsTrigger>
                <TabsTrigger value="database">Data</TabsTrigger>
            </TabsList>
            <TabsContent value="store" className="mt-6">
                <StoreSettingsForm />
            </TabsContent>
            <TabsContent value="users" className="mt-6">
                <UserManagement />
            </TabsContent>
             <TabsContent value="database" className="mt-6">
                <DatabaseSettings />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
