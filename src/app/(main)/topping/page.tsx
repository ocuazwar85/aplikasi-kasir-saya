'use client';

import * as React from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Topping } from '@/lib/types';
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
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import { ToppingForm, type ToppingFormValues } from '@/components/forms/ToppingForm';

export default function ToppingPage() {
  const { toast } = useToast();
  const [toppings, setToppings] = React.useState<Topping[]>([]);
  const [filteredToppings, setFilteredToppings] = React.useState<Topping[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedTopping, setSelectedTopping] = React.useState<Topping | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const q = query(collection(firestore, 'toppings'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Topping[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Topping));
      setToppings(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching toppings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data toping.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  React.useEffect(() => {
    let filtered = toppings;

    if (searchTerm) {
        filtered = filtered.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    setFilteredToppings(filtered);
  }, [toppings, searchTerm]);

  const handleFormSubmit = async (values: ToppingFormValues) => {
    try {
      const dataToSave = {
          ...values,
          price: Number(values.price),
          stock: Number(values.stock),
      };

      if (selectedTopping) {
        // Update
        const docRef = doc(firestore, 'toppings', selectedTopping.id!);
        await updateDoc(docRef, dataToSave);
        toast({
          title: 'Sukses',
          description: 'Toping berhasil diperbarui.',
        });
      } else {
        // Create
        await addDoc(collection(firestore, 'toppings'), dataToSave);
        toast({
          title: 'Sukses',
          description: 'Toping baru berhasil ditambahkan.',
        });
      }
      setIsFormOpen(false);
      setSelectedTopping(null);
    } catch (error) {
      console.error('Error saving topping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyimpan toping.',
      });
    }
  };

  const handleEdit = (topping: Topping) => {
    setSelectedTopping(topping);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedTopping(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'toppings', id));
      toast({
        title: 'Sukses',
        description: 'Toping berhasil dihapus.',
      });
    } catch (error) {
      console.error('Error deleting topping:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus toping.',
      });
    }
  };

  const highStockToppings = React.useMemo(() => 
    [...toppings].sort((a, b) => b.stock - a.stock).slice(0, 2), 
  [toppings]);
  
  const lowStockToppings = React.useMemo(() => 
    [...toppings].sort((a, b) => a.stock - b.stock).slice(0, 2), 
  [toppings]);

  // Helper to check for valid, non-Google Drive image URLs
  const getSafeImageUrl = (url: string) => {
    try {
      if (!url) return `https://picsum.photos/seed/placeholder/40/40`;
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('google.com')) {
        return `https://picsum.photos/seed/${parsedUrl.pathname}/40/40`;
      }
      return url;
    } catch (e) {
      return `https://picsum.photos/seed/placeholder/40/40`;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Stok Terbanyak</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {highStockToppings.map(t => (
                        <div key={t.id} className="flex justify-between text-sm">
                            <span>{t.name}</span>
                            <span className="font-semibold">{t.stock}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Stok Paling Sedikit</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {lowStockToppings.map(t => (
                         <div key={t.id} className="flex justify-between text-sm">
                            <span>{t.name}</span>
                            <span className="font-semibold">{t.stock}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manajemen Varian/Toping</CardTitle>
                <CardDescription>Tambah, ubah, dan hapus toping produk.</CardDescription>
              </div>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2" />
                Tambah Toping
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Input 
                  placeholder="Cari toping..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
              />
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Gambar</TableHead>
                      <TableHead>Nama Toping</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="w-[120px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredToppings.length > 0 ? (
                      filteredToppings.map((topping) => (
                        <TableRow key={topping.id}>
                          <TableCell>
                            <Image
                              src={getSafeImageUrl(topping.imageUrl || '')}
                              alt={topping.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{topping.name}</TableCell>
                          <TableCell>Rp {topping.price.toLocaleString('id-ID')}</TableCell>
                          <TableCell>{topping.stock}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{topping.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(topping)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus toping secara permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(topping.id!)}>
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
                        <TableCell colSpan={6} className="h-24 text-center">
                          Tidak ada toping yang cocok.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ToppingForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={selectedTopping}
      />
    </>
  );
}
