'use client';

import * as React from 'react';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Sale, StoreSettings } from '@/lib/types';
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
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, Printer, Trash2, Package, Banknote, Users, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function Receipt({ sale, settings }: { sale: Sale | null, settings: StoreSettings | null }) {
    if (!sale) return null;
    const isTunai = sale.paymentMethod === 'Tunai';
    const paymentAmount = isTunai && sale.cashAmount ? sale.cashAmount : sale.total;
    const changeAmount = isTunai && sale.cashAmount ? sale.cashAmount - sale.total : 0;
    return (
        <div className="text-sm text-gray-800 bg-white p-4 font-mono">
            <div className="text-center">
                <h3 className="text-lg font-bold">{settings?.storeName || 'Toko Anda'}</h3>
                <p>{settings?.address || 'Alamat Toko'}</p>
                <p>{settings?.phone || 'No. Telepon'}</p>
            </div>
            <Separator className="my-2 border-dashed" />
            <div>
                <p>No: {sale.id?.substring(0, 8)}</p>
                <p>Kasir: {sale.cashierName}</p>
                <p>Tanggal: {sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yy HH:mm') : 'N/A'}</p>
            </div>
            <Separator className="my-2 border-dashed" />
            {sale.items.map((item, index) => (
                <div key={index}>
                    <p className="font-semibold">{item.productName}</p>
                    <div className="flex justify-between">
                        <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                        <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                    </div>
                     {item.toppings.length > 0 && (
                        <div className="pl-4 text-xs">
                            {item.toppings.map((topping, tIndex) => (
                                <div key={tIndex} className="flex justify-between">
                                    <span>+ {topping.toppingName}</span>
                                    <span>{topping.price.toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            <Separator className="my-2 border-dashed" />
            <div className="font-semibold">
                <div className="flex justify-between">
                    <span>TOTAL</span>
                    <span>Rp {sale.total.toLocaleString('id-ID')}</span>
                </div>
                 <div className="flex justify-between">
                    <span>BAYAR ({sale.paymentMethod})</span>
                    <span>Rp {(paymentAmount).toLocaleString('id-ID')}</span>
                </div>
                 {isTunai && changeAmount > 0 && (
                    <div className="flex justify-between">
                        <span>KEMBALI</span>
                        <span>Rp {(changeAmount).toLocaleString('id-ID')}</span>
                    </div>
                )}
            </div>
            <Separator className="my-2 border-dashed" />
            <p className="text-center mt-4">Terima kasih!</p>
        </div>
    );
}

export default function LaporanPage() {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [timeFilter, setTimeFilter] = React.useState('today');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    const salesQuery = query(collection(firestore, 'sales'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const data: Sale[] = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: (docData.createdAt as Timestamp)?.toDate(),
        } as Sale;
      });

      setSales(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching sales:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data penjualan.',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  React.useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (timeFilter === 'today') {
      setDateRange({ from: startOfToday, to: startOfToday });
    } else if (timeFilter === 'this_month') {
      setDateRange({ from: startOfMonth, to: endOfMonth });
    }
  }, [timeFilter]);
  
  const filteredSales = React.useMemo(() => {
    let preFiltered = sales;

    // Employee can only see their own input
    if (user?.role === 'employee') {
      preFiltered = sales.filter(sale => sale.cashierId === user.id);
    }

    let dateFiltered = preFiltered;
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      dateFiltered = dateFiltered.filter(s => {
        if (!s.createdAt) return false;
        const saleDate = new Date(s.createdAt);
        return saleDate >= fromDate && saleDate <= toDate;
      });
    }

    let finalFiltered = dateFiltered;
    if (searchTerm && user?.role === 'admin') {
      finalFiltered = dateFiltered.filter(s =>
        s.cashierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return finalFiltered;
  }, [sales, searchTerm, dateRange, user]);


  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'sales', id));
      toast({ title: 'Sukses', description: 'Data penjualan berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus data.' });
    }
  };
  
  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (printContent) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow?.document.write('<html><head><title>Struk Pembayaran</title>');
        printWindow?.document.write('<style>body { font-family: monospace; font-size: 10px; margin: 0; } .receipt-container { width: 280px; padding: 5px; } h3, p { margin: 0; } .separator { border-top: 1px dashed black; margin: 4px 0; } .flex { display: flex; } .justify-between { justify-content: space-between; } .text-center { text-align: center; } .font-bold { font-weight: bold; } .font-semibold { font-weight: 600; } .pl-4 { padding-left: 1rem; } .text-xs { font-size: 8px; } .mt-4 { margin-top: 1rem; }</style>');
        printWindow?.document.write('</head><body >');
        const contentWithClasses = printContent.innerHTML.replace(/class="/g, (match) => `${match} `).replace(/Separator/g, 'div');
        printWindow?.document.write(`<div class="receipt-container">${contentWithClasses}</div>`);
        printWindow?.document.write('</body></html>');
        printWindow?.document.close();
        printWindow?.focus();
        printWindow?.print();
        printWindow?.close();
    }
  };

  const { totalSales, totalTransactions, totalProductsSold } = React.useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
        acc.totalSales += sale.total;
        acc.totalTransactions += 1;
        acc.totalProductsSold += sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        return acc;
    }, { totalSales: 0, totalTransactions: 0, totalProductsSold: 0 });
  }, [filteredSales]);

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Laporan Penjualan</CardTitle>
                <CardDescription>Analisis performa penjualan toko Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</div>
                            <p className="text-xs text-muted-foreground">dari {totalTransactions} transaksi</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{totalTransactions}</div>
                            <p className="text-xs text-muted-foreground">transaksi berhasil</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Produk Terjual</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{totalProductsSold}</div>
                             <p className="text-xs text-muted-foreground">total item dari semua transaksi</p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
      
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {user?.role === 'admin' && (
                <Input
                  placeholder="Cari nama kasir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              )}
              <div className="flex items-center gap-2">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter waktu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hari Ini</SelectItem>
                        <SelectItem value="this_month">Bulan Ini</SelectItem>
                         {user?.role === 'admin' && <SelectItem value="custom">Rentang Kustom</SelectItem>}
                    </SelectContent>
                </Select>
                {timeFilter === 'custom' && user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[150px] justify-start text-left font-normal",
                                !dateRange?.from && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : <span>Mulai</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dateRange?.from}
                                onSelect={(date) => setDateRange(prev => ({...prev, from: date}))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <span>-</span>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[150px] justify-start text-left font-normal",
                                !dateRange?.to && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : <span>Selesai</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dateRange?.to}
                                onSelect={(date) => setDateRange(prev => ({...prev, to: date}))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                )}
              </div>
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
                      <TableHead>Jumlah Item</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pembayaran</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead className="w-[120px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length > 0 ? (
                      filteredSales.map((sale) => {
                        const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {sale.createdAt ? format(new Date(sale.createdAt), 'dd MMM yy, HH:mm', { locale: id }) : 'N/A'}
                          </TableCell>
                          <TableCell>{totalItems} item</TableCell>
                          <TableCell className="font-medium">Rp {sale.total.toLocaleString('id-ID')}</TableCell>
                          <TableCell>{sale.paymentMethod}</TableCell>
                           <TableCell>{sale.cashierName}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Lihat Detail</span>
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
                                    Tindakan ini akan menghapus data penjualan secara permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(sale.id!)}>
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
                        <TableCell colSpan={6} className="h-24 text-center">
                          Tidak ada data penjualan yang cocok.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Detail Transaksi</DialogTitle>
                </DialogHeader>
                <div ref={receiptRef}>
                    <Receipt sale={selectedSale} settings={settings} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Tutup</Button>
                    </DialogClose>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print Struk</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
