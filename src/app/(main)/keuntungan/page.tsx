'use client';

import * as React from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Sale, Purchase, StoreSettings } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, TrendingDown, TrendingUp, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';


interface DailyProfit {
  date: string;
  totalRevenue: number;
  totalExpense: number;
  grossProfit: number;
  netProfit: number;
}

export default function KeuntunganPage() {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [timeFilter, setTimeFilter] = React.useState('this_month');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return { from: startOfMonth, to: endOfMonth };
  });

  React.useEffect(() => {
    if (user?.role !== 'admin') {
      setIsLoading(false);
      return;
    }

    const salesQuery = query(collection(firestore, 'sales'), orderBy('createdAt', 'desc'));
    const purchasesQuery = query(collection(firestore, 'purchases'), orderBy('createdAt', 'desc'));

    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const data: Sale[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp)?.toDate() } as Sale));
      setSales(data);
    }, (error) => {
      console.error('Error fetching sales:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data penjualan.' });
    });

    const unsubscribePurchases = onSnapshot(purchasesQuery, (snapshot) => {
      const data: Purchase[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp)?.toDate() } as Purchase));
      setPurchases(data);
    }, (error) => {
      console.error('Error fetching purchases:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat data pembelian.' });
    });
    
    setIsLoading(false);

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
    };
  }, [toast, user]);
  
  React.useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    if (timeFilter === 'today') {
      setDateRange({ from: startOfToday, to: startOfToday });
    } else if (timeFilter === 'this_month') {
      setDateRange({ from: startOfMonth, to: endOfMonth });
    } else if (timeFilter === 'custom') {
        // For custom, we wait for user to select
    } else {
        setDateRange(undefined);
    }
  }, [timeFilter]);


  const { filteredData, totalRevenue, totalExpense, grossProfit, netProfit } = React.useMemo(() => {
    const fromDate = dateRange?.from;
    const toDate = dateRange?.to ? new Date(dateRange.to) : new Date();
    if (dateRange?.to) toDate.setHours(23, 59, 59, 999);

    const getFiltered = (items: (Sale | Purchase)[]) => {
        if (!fromDate) return items;
        // if no 'to' date, filter for the single day
        const to = toDate || fromDate;
        return items.filter(item => {
            if (!item.createdAt) return false;
            const itemDate = new Date(item.createdAt);
            const from = new Date(fromDate);
from.setHours(0,0,0,0);
            return itemDate >= from && itemDate <= to;
        });
    };

    const filteredSales = getFiltered(sales);
    const filteredPurchases = getFiltered(purchases);

    const dailyData: { [key: string]: { revenue: number, expense: number } } = {};

    filteredSales.forEach(sale => {
      const dateStr = format(new Date(sale.createdAt), 'yyyy-MM-dd');
      if (!dailyData[dateStr]) dailyData[dateStr] = { revenue: 0, expense: 0 };
      dailyData[dateStr].revenue += sale.total;
    });

    filteredPurchases.forEach(purchase => {
      const dateStr = format(new Date(purchase.createdAt), 'yyyy-MM-dd');
      if (!dailyData[dateStr]) dailyData[dateStr] = { revenue: 0, expense: 0 };
      dailyData[dateStr].expense += purchase.price;
    });

    const profitPercentage = settings?.profitPercentage ?? 30;

    const formattedData = Object.keys(dailyData).map(date => {
      const { revenue, expense } = dailyData[date];
      const gross = revenue - expense;
      const net = gross * (profitPercentage / 100);
      return {
        date,
        totalRevenue: revenue,
        totalExpense: expense,
        grossProfit: gross,
        netProfit: net
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totals = formattedData.reduce((acc, day) => {
        acc.totalRevenue += day.totalRevenue;
        acc.totalExpense += day.totalExpense;
        acc.grossProfit += day.grossProfit;
        acc.netProfit += day.netProfit;
        return acc;
    }, { totalRevenue: 0, totalExpense: 0, grossProfit: 0, netProfit: 0 });

    return { filteredData: formattedData, ...totals };

  }, [sales, purchases, dateRange, settings]);
  
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
      );
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Laporan Keuntungan</CardTitle>
                <CardDescription>Analisis keuntungan kotor dan bersih toko Anda.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter waktu" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Hari Ini</SelectItem>
                            <SelectItem value="this_month">Bulan Ini</SelectItem>
                            <SelectItem value="custom">Rentang Kustom</SelectItem>
                        </SelectContent>
                    </Select>
                    {timeFilter === 'custom' && (
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {totalExpense.toLocaleString('id-ID')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Keuntungan Bersih ({settings?.profitPercentage}%)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit < 0 ? 'text-destructive' : ''}`}>
                                Rp {netProfit.toLocaleString('id-ID')}
                            </div>
                             <p className="text-xs text-muted-foreground">
                                Keuntungan Kotor: Rp {grossProfit.toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Rincian Keuntungan Harian</CardTitle>
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
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Total Pendapatan</TableHead>
                      <TableHead>Total Pengeluaran</TableHead>
                      <TableHead>Keuntungan Kotor</TableHead>
                      <TableHead>Keuntungan Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <TableRow key={item.date}>
                          <TableCell className="font-medium">
                             {format(new Date(item.date), 'eeee, dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell className="text-green-600">Rp {item.totalRevenue.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-red-600">Rp {item.totalExpense.toLocaleString('id-ID')}</TableCell>
                          <TableCell className={`font-semibold ${item.grossProfit < 0 ? 'text-destructive' : ''}`}>
                            Rp {item.grossProfit.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className={`font-bold ${item.netProfit < 0 ? 'text-destructive' : ''}`}>
                            Rp {item.netProfit.toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Tidak ada data keuntungan pada rentang waktu ini.
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
  );
}
