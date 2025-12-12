'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { updateStoreSettings } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  storeName: z.string().min(2, 'Nama toko minimal 2 karakter.'),
  address: z.string().min(5, 'Alamat minimal 5 karakter.'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit.'),
  owner: z.string().min(2, 'Nama pemilik minimal 2 karakter.'),
  logoUrl: z.string().url('URL logo tidak valid.').or(z.literal('')).optional(),
  profitPercentage: z.coerce.number().min(0).max(100, 'Persentase harus antara 0 dan 100.'),
});

type StoreSettingsFormValues = z.infer<typeof formSchema>;

export default function StoreSettingsForm() {
  const { settings, reloadSettings } = useAuth();
  const { toast } = useToast();

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: '',
      address: '',
      phone: '',
      owner: '',
      logoUrl: '',
      profitPercentage: 30,
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting, isDirty },
  } = form;
  
  const logoUrl = watch('logoUrl');

  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (values: StoreSettingsFormValues) => {
    try {
      await updateStoreSettings(values);
      await reloadSettings();
      toast({
        title: 'Sukses',
        description: 'Pengaturan toko berhasil diperbarui.',
      });
      reset(values); // Reset form to new values to clear "dirty" state
    } catch (error) {
      console.error('Error updating store settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memperbarui pengaturan toko.',
      });
    }
  };

  if (!settings) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>Informasi Toko</CardTitle>
        <CardDescription>Ubah detail toko Anda. Perubahan akan terlihat di halaman login dan header.</CardDescription>
      </CardHeader>
      <CardContent>
         <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="space-y-4 flex-grow">
                    <FormField
                      control={control}
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
                      control={control}
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
                      control={control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alamat</FormLabel>
                          <FormControl>
                            <Input placeholder="Jl. Raya No. 123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="08123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="space-y-4 md:w-1/3">
                    <FormField
                      control={control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Logo</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="flex justify-center p-2 border rounded-md aspect-square bg-muted/50">
                        {logoUrl ? (
                            <Image src={logoUrl} alt="Logo preview" width={150} height={150} className="object-contain rounded-md"/>
                        ) : (
                            <div className="flex items-center justify-center text-sm text-muted-foreground">Pratinjau Logo</div>
                        )}
                    </div>
                </div>
            </div>
            
             <FormField
                control={control}
                name="profitPercentage"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Persentase Keuntungan Bersih (%)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
