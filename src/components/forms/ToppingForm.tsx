'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';
import type { Topping } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Nama toping minimal 2 karakter.'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif.'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif.'),
  imageUrl: z.string().url('URL gambar tidak valid.').optional().or(z.literal('')),
  description: z.string().optional(),
});

export type ToppingFormValues = z.infer<typeof formSchema>;

interface ToppingFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: ToppingFormValues) => Promise<void>;
  defaultValues: Topping | null;
}

export function ToppingForm({ isOpen, onOpenChange, onSubmit, defaultValues }: ToppingFormProps) {
  const form = useForm<ToppingFormValues>({
    resolver: zodResolver(formSchema),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = form;

  useEffect(() => {
    if (isOpen) {
      const values = defaultValues
        ? {
            ...defaultValues,
            description: defaultValues.description || '',
            imageUrl: defaultValues.imageUrl || '',
          }
        : {
            name: '',
            price: 0,
            stock: 0,
            imageUrl: '',
            description: '',
          };
      reset(values);
    }
  }, [isOpen, defaultValues, reset]);

  const handleFormSubmit = async (values: ToppingFormValues) => {
    await onSubmit(values);
    if (Object.keys(errors).length === 0) {
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Edit Toping' : 'Tambah Toping Baru'}</DialogTitle>
          <DialogDescription>
            {defaultValues ? 'Ubah detail toping di bawah ini.' : 'Isi detail untuk toping baru.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Toping</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Boba" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Gambar (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi singkat tentang toping" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
