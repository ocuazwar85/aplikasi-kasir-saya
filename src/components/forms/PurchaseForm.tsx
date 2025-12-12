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
import { Loader2 } from 'lucide-react';
import type { Purchase } from '@/lib/types';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  itemName: z.string().min(2, 'Nama barang minimal 2 karakter.'),
  supplier: z.string().min(2, 'Nama supplier minimal 2 karakter.'),
  quantity: z.coerce.number().min(1, 'Kuantitas minimal 1.'),
  price: z.coerce.number().min(1, 'Harga harus diisi.'), // This will now be price per unit
  description: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof formSchema>;

interface PurchaseFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: PurchaseFormValues) => Promise<void>;
  defaultValues: Omit<Purchase, 'userId' | 'userName' | 'createdAt'> | null;
}

export function PurchaseForm({ isOpen, onOpenChange, onSubmit, defaultValues }: PurchaseFormProps) {
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        itemName: '',
        supplier: '',
        quantity: 1,
        price: 0,
        description: ''
    }
  });

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  const quantity = watch('quantity');
  const pricePerUnit = watch('price');
  const totalPrice = (quantity || 0) * (pricePerUnit || 0);

  useEffect(() => {
    if (isOpen) {
      if (defaultValues) {
          // When editing, we can't easily reverse-calculate price per unit
          // So we set quantity to 1 and price to the total, and the user can adjust.
          const values = { 
            ...defaultValues, 
            description: defaultValues.description || '',
            quantity: defaultValues.quantity || 1,
            price: defaultValues.price / (defaultValues.quantity || 1) // Calculate price per unit
          };
          reset(values);
      } else {
          // For new entries
          reset({ itemName: '', supplier: '', quantity: 1, price: 0, description: '' });
      }
    }
  }, [isOpen, defaultValues, reset]);

  const handleFormSubmit = async (values: PurchaseFormValues) => {
    // We send the total price, not the price per unit.
    const submissionValues = {
        ...values,
        price: totalPrice,
    };
    await onSubmit(submissionValues);
    if (!form.formState.isSubmitSuccessful) {
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Edit Pembelian' : 'Catat Pembelian Baru'}</DialogTitle>
          <DialogDescription>
            {defaultValues ? 'Ubah detail pembelian di bawah ini.' : 'Isi detail untuk pembelian baru.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Barang</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Biji Kopi Arabika" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Supplier Kopi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kuantitas (unit)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga per Unit (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 bg-muted rounded-md text-center">
                <p className="text-sm text-muted-foreground">Total Harga Pembelian</p>
                <p className="text-2xl font-bold text-primary">Rp {totalPrice.toLocaleString('id-ID')}</p>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan"
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || totalPrice <= 0}>
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
