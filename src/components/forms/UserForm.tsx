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
import type { User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter.'),
  username: z.string().min(4, 'Username minimal 4 karakter.'),
  password: z.string().min(6, 'Password minimal 6 karakter.').optional().or(z.literal('')),
  role: z.enum(['admin', 'employee'], { required_error: 'Peran harus dipilih.' }),
});

export type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
  defaultValues: User | null;
}

export function UserForm({ isOpen, onOpenChange, onSubmit, defaultValues }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    if (isOpen) {
      const values = defaultValues 
        ? { name: defaultValues.name, username: defaultValues.username, password: '', role: defaultValues.role }
        : { name: '', username: '', password: '', role: 'employee' as const };
      reset(values);
    }
  }, [isOpen, defaultValues, reset]);

  const handleFormSubmit = async (values: UserFormValues) => {
    // For updates, if password is empty, don't include it in the submission
    const submissionValues = { ...values };
    if (defaultValues && !submissionValues.password) {
      delete submissionValues.password;
    }
    
    if (!defaultValues && !submissionValues.password) {
        form.setError('password', { message: 'Password harus diisi untuk pengguna baru.'});
        return;
    }

    await onSubmit(submissionValues);
    if (!form.formState.isSubmitSuccessful) {
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Budi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. budi_kasir" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={defaultValues ? 'Kosongkan jika tidak ingin ganti' : '••••••••'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peran</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={defaultValues?.role === 'admin'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih peran pengguna" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="employee">Karyawan</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
