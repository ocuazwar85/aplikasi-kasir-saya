'use client';

import * as React from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
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
import { PlusCircle, Edit, Trash2, Loader2, KeyRound, User as UserIcon } from 'lucide-react';
import { UserForm, type UserFormValues } from '@/components/forms/UserForm';
import { createUser, updateUser, deleteUser } from '@/lib/db';
import { Badge } from '../ui/badge';


export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const q = query(collection(firestore, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as User));
      setUsers(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data pengguna.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleFormSubmit = async (values: UserFormValues) => {
    try {
      if (selectedUser) {
        // Update user
        await updateUser(selectedUser.id!, values);
        toast({ title: 'Sukses', description: 'Data pengguna berhasil diperbarui.' });
      } else {
        // Create new user
        await createUser(values as Omit<User, 'id'>);
        toast({ title: 'Sukses', description: 'Pengguna baru berhasil ditambahkan.' });
      }
      setIsFormOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan data pengguna.' });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };
  
  const handleAdd = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      toast({ title: 'Sukses', description: 'Pengguna berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus pengguna.' });
    }
  };

  return (
    <>
        <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Manajemen Pengguna</CardTitle>
                    <CardDescription>Tambah, ubah, atau hapus akses pengguna.</CardDescription>
                </div>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2" />
                    Tambah Pengguna
                </Button>
            </div>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead className="w-[120px] text-right">Aksi</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.length > 0 ? (
                        users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                    {user.role === 'admin' ? <KeyRound className="mr-1"/> : <UserIcon className="mr-1"/>}
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:text-destructive"
                                        disabled={user.role === 'admin' || user.id === currentUser?.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pengguna <strong>{user.name}</strong> secara permanen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(user.id!)}>
                                    Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            Belum ada pengguna.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            )}
            </CardContent>
        </Card>
        <UserForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleFormSubmit}
            defaultValues={selectedUser}
        />
    </>
  );
}
