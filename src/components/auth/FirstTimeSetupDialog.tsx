'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { createUser, updateStoreSettings } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { User, StoreSettings } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  // Admin User fields
  name: z.string().min(2, 'Nama admin minimal 2 karakter.'),
  username: z.string().min(4, 'Username admin minimal 4 karakter.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  
  // Store Settings fields
  storeName: z.string().min(2, 'Nama toko minimal 2 karakter.'),
  address: z.string().min(5, 'Alamat minimal 5 karakter.'),
  owner: z.string().min(2, 'Nama pemilik minimal 2 karakter.'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit.'),
  logoUrl: z.string().url('URL logo tidak valid.').optional().or(z.literal('')),
});

type FirstTimeSetupFormValues = z.infer<typeof formSchema>;

export default function FirstTimeSetupDialog({ open }: { open: boolean }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FirstTimeSetupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: 'admin',
      password: '',
      storeName: '',
      address: '',
      owner: '',
      phone: '',
      logoUrl: '',
    },
  });

  const onSubmit = async (values: FirstTimeSetupFormValues) => {
    setIsLoading(true);
    try {
      const adminUser: Omit<User, 'id'> = {
        name: values.name,
        username: values.username,
        password: values.password,
        role: 'admin',
      };
      
      const storeSettings: Omit<StoreSettings, 'id'> = {
        storeName: values.storeName,
        address: values.address,
        owner: values.owner,
        phone: values.phone,
        logoUrl: values.logoUrl,
        profitPercentage: 30, // Default value
      };

      // Create user and settings
      const newUser = await createUser(adminUser);
      await updateStoreSettings(storeSettings);

      toast({
        title: 'Setup Selesai!',
        description: `Akun admin ${newUser.name} dan pengaturan toko telah dibuat.`,
      });
      
      // Automatically log in the new admin. This will trigger a reload of the auth context.
      login(newUser);

    } catch (error) {
      console.error('Failed to create admin user and settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal melakukan setup awal. Silakan coba lagi.',
      });
      setIsLoading(false);
    }
    // No finally block to set loading to false, as a successful login will unmount this component anyway.
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if(!o) return; /* prevent closing by clicking outside */}}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Selamat Datang di SmartSeller!</DialogTitle>
          <DialogDescription>
            Ini adalah setup awal. Silakan buat akun administrator dan atur informasi dasar toko Anda.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="max-h-[60vh] p-1">
              <div className="space-y-4 p-4">
                <h3 className="text-lg font-semibold border-b pb-2">1. Akun Administrator</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap Admin</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <h3 className="text-lg font-semibold border-b pb-2 pt-4">2. Informasi Toko</h3>
                 <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Toko</FormLabel>
                      <FormControl>
                        <Input placeholder="Toko Sejahtera" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pemilik</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Toko</FormLabel>
                      <FormControl>
                        <Input placeholder="Jl. Raya No. 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon/HP</FormLabel>
                      <FormControl>
                        <Input placeholder="08123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link/URL Logo Toko (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Selesaikan Setup dan Login
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
