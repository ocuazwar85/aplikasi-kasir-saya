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
import type { Product, Category } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import { ProductForm, type ProductFormValues } from '@/components/forms/ProductForm';

export default function ProdukPage() {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

  const categoryMap = React.useMemo(() => {
    return categories.reduce((acc, cat) => {
      if (cat.id) {
        acc[cat.id] = cat.name;
      }
      return acc;
    }, {} as { [key: string]: string });
  }, [categories]);
  
  React.useEffect(() => {
    const categoriesQuery = query(collection(firestore, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const data: Category[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Category));
      setCategories(data);
    });

    const productsQuery = query(collection(firestore, 'products'), orderBy('name', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const data: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data produk.",
      });
      setIsLoading(false);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeProducts();
    };
  }, [toast]);

  React.useEffect(() => {
      let filtered = products;

      if (categoryFilter !== 'all') {
          filtered = filtered.filter(p => p.categoryId === categoryFilter);
      }

      if (searchTerm) {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      setFilteredProducts(filtered);

  }, [products, searchTerm, categoryFilter]);


  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      const dataToSave = {
        ...values,
        price: Number(values.price),
        stock: Number(values.stock),
      };

      if (selectedProduct) {
        // Update
        const docRef = doc(firestore, 'products', selectedProduct.id!);
        await updateDoc(docRef, dataToSave);
        toast({
          title: 'Sukses',
          description: 'Produk berhasil diperbarui.',
        });
      } else {
        // Create
        await addDoc(collection(firestore, 'products'), dataToSave);
        toast({
          title: 'Sukses',
          description: 'Produk baru berhasil ditambahkan.',
        });
      }
      setIsFormOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyimpan produk.',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'products', id));
      toast({
        title: 'Sukses',
        description: 'Produk berhasil dihapus.',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menghapus produk.',
      });
    }
  };
  
  const highStockProducts = React.useMemo(() => 
    [...products].sort((a, b) => b.stock - a.stock).slice(0, 2), 
  [products]);
  
  const lowStockProducts = React.useMemo(() => 
    [...products].sort((a, b) => a.stock - b.stock).slice(0, 2), 
  [products]);


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
                    {highStockProducts.map(p => (
                        <div key={p.id} className="flex justify-between text-sm">
                            <span>{p.name}</span>
                            <span className="font-semibold">{p.stock}</span>
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
                    {lowStockProducts.map(p => (
                         <div key={p.id} className="flex justify-between text-sm">
                            <span>{p.name}</span>
                            <span className="font-semibold">{p.stock}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manajemen Produk</CardTitle>
                <CardDescription>Tambah, ubah, dan hapus produk jualan.</CardDescription>
              </div>
              <Button onClick={handleAdd}>
                <PlusCircle className="mr-2" />
                Tambah Produk
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
                <Input 
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>
                        ))}
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
                      <TableHead className="w-[80px]">Gambar</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="w-[120px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Image
                              src={product.imageUrl || 'https://picsum.photos/seed/placeholder/40/40'}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{categoryMap[product.categoryId] || 'N/A'}</TableCell>
                          <TableCell>Rp {product.price.toLocaleString('id-ID')}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{product.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
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
                                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus produk secara permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(product.id!)}>
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
                        <TableCell colSpan={7} className="h-24 text-center">
                          Tidak ada produk yang cocok.
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
      <ProductForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={selectedProduct}
        categories={categories}
      />
    </>
  );
}

    