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
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Purchase } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Loader2, Eye } from 'lucide-react';
import { PurchaseForm, type PurchaseFormValues } from '@/components/forms/PurchaseForm';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PembelianPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = React.useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedPurchase, setSelectedPurchase] = React.useState<Purchase | null>(null);
  const [purchaseForDetail, setPurchaseForDetail] = React.useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeFilter, setTimeFilter] = React.useState('all');

  React.useEffect(() => {
    const q = query(collection(firestore, 'purchases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Purchase[] = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate(),
        } as Purchase;
      });
      setPurchases(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching purchases:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data pembelian.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  React.useEffect(() => {
    let filtered = purchases;
    
    // Employee can only see their own input
    if (user?.role === 'employee') {
        filtered = filtered.filter(p => p.userId === user.id);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user?.role === 'admin' && p.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user?.role === 'admin' && p.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by time
    if (timeFilter !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (timeFilter === 'today') {
            filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= startOfToday);
        } else if (timeFilter === 'this_month') {
            filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= startOfMonth);
        }
    }

    setFilteredPurchases(filtered);
  }, [purchases, searchTerm, timeFilter, user]);


  const handleFormSubmit = async (values: PurchaseFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Anda harus login.' });
      return;
    }
    try {
      const dataToSave = {
        ...values,
        price: Number(values.price),
        quantity: Number(values.quantity),
      };

      if (selectedPurchase) {
        // Update
        const docRef = doc(firestore, 'purchases', selectedPurchase.id!);
        await updateDoc(docRef, dataToSave);
        toast({ title: 'Sukses', description: 'Data pembelian berhasil diperbarui.' });
      } else {
        // Create
        await addDoc(collection(firestore, 'purchases'), {
            ...dataToSave,
            userId: user.id,
            userName: user.name,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Sukses', description: 'Data pembelian berhasil dicatat.' });
      }
      setIsFormOpen(false);
      setSelectedPurchase(null);
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan data.' });
    }
  };

  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedPurchase(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'purchases', id));
      toast({ title: 'Sukses', description: 'Data pembelian berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus data.' });
    }
  };

  const totalSpending = React.useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.price, 0);
  }, [filteredPurchases]);

  const totalTransactions = filteredPurchases.length;

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Riwayat Pembelian Barang</CardTitle>
                <CardDescription>Lihat dan kelola semua data pembelian stok.</CardDescription>
              </div>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2" />
                Tambah Pembelian
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Total Pengeluaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">Rp {totalSpending.toLocaleString('id-ID')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Jumlah Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalTransactions}</p>
                    </CardContent>
                </Card>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder={user?.role === 'admin' ? "Cari barang, supplier, atau user..." : "Cari nama barang..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter waktu" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="this_month">Bulan Ini</SelectItem>
                </SelectContent>
              </Select>
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
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      {user?.role === 'admin' && <TableHead>Supplier</TableHead>}
                      <TableHead>Total Harga</TableHead>
                      {user?.role === 'admin' && <TableHead>Diinput oleh</TableHead>}
                      <TableHead className="w-[120px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.length > 0 ? (
                      filteredPurchases.map((purchase) => {
                        const pricePerUnit = purchase.quantity > 0 ? purchase.price / purchase.quantity : 0;
                        return(
                        <TableRow key={purchase.id}>
                          <TableCell>
                            {purchase.createdAt ? format(new Date(purchase.createdAt), 'dd MMM yyyy, HH:mm', { locale: id }) : 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {purchase.itemName} ({purchase.quantity} unit)
                          </TableCell>
                          {user?.role === 'admin' && <TableCell>{purchase.supplier}</TableCell>}
                          <TableCell>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">
                                    {purchase.quantity} x Rp {pricePerUnit.toLocaleString('id-ID')}
                                </span>
                                <span className="font-semibold">
                                    Rp {purchase.price.toLocaleString('id-ID')}
                                </span>
                            </div>
                          </TableCell>
                          {user?.role === 'admin' && <TableCell>{purchase.userName}</TableCell>}
                          <TableCell className="text-right space-x-0">
                                <Button variant="ghost" size="icon" onClick={() => setPurchaseForDetail(purchase)}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Lihat Detail</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(purchase)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Ubah</span>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Hapus</span>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tindakan ini akan menghapus data pembelian secara permanen.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(purchase.id!)}>
                                                Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                          </TableCell>
                        </TableRow>
                      )})
                    ) : (
                      <TableRow>
                        <TableCell colSpan={user?.role === 'admin' ? 6 : 4} className="h-24 text-center">
                          Tidak ada data pembelian.
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

      <PurchaseForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={selectedPurchase}
      />
      
      <Dialog open={!!purchaseForDetail} onOpenChange={(open) => !open && setPurchaseForDetail(null)}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Detail Pembelian</DialogTitle>
                {purchaseForDetail && (
                   <DialogDescription asChild>
                    <div className="space-y-2 pt-4 text-sm text-foreground">
                        <div><strong>Nama Barang:</strong> {purchaseForDetail.itemName}</div>
                        <div><strong>Supplier:</strong> {purchaseForDetail.supplier}</div>
                        <div><strong>Kuantitas:</strong> {purchaseForDetail.quantity}</div>
                        <div><strong>Total Harga:</strong> Rp {purchaseForDetail.price.toLocaleString('id-ID')}</div>
                        <div><strong>Keterangan:</strong> {purchaseForDetail.description || '-'}</div>
                        <div><strong>Diinput oleh:</strong> {purchaseForDetail.userName}</div>
                        <div><strong>Tanggal:</strong> {purchaseForDetail.createdAt ? format(new Date(purchaseForDetail.createdAt), 'eeee, dd MMMM yyyy, HH:mm', { locale: id }) : 'N/A'}</div>
                    </div>
                  </DialogDescription>
                )}
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setPurchaseForDetail(null)}>Tutup</Button>
                <Button onClick={() => { if (purchaseForDetail) { handleEdit(purchaseForDetail); setPurchaseForDetail(null); }}}>Ubah</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
