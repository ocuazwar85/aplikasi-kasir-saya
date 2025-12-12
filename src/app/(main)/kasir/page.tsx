'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { Product, Topping, Category, CartItem, User, Sale } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ToppingSelectionDialog from '@/components/kasir/ToppingSelectionDialog';
import PaymentModal from '@/components/kasir/PaymentModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { addSale } from '@/lib/db';


function ProductGrid({ products, categories, isLoading, onProductClick }: { products: Product[], categories: Category[], isLoading: boolean, onProductClick: (product: Product) => void }) {
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      if (cat.id) {
        acc[cat.id] = cat.name;
      }
      return acc;
    }, {} as { [key: string]: string });
  }, [categories]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <Card key={product.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors flex flex-col" onClick={() => onProductClick(product)}>
          <div className="relative aspect-square w-full">
            <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`} alt={product.name} fill className="object-cover" data-ai-hint="product image" />
          </div>
           <CardContent className="p-3 space-y-1 flex-grow flex flex-col">
              <p className="font-semibold text-sm leading-snug">{product.name}</p>
              <p className="font-semibold text-primary text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5 flex-grow">
                  <p>{categoryMap[product.categoryId] || 'N/A'}</p>
                  <p>Stok: {product.stock}</p>
              </div>
              {product.description && <p className="text-xs italic truncate text-muted-foreground pt-1">{product.description}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ToppingGrid({ toppings, isLoading, onToppingClick }: { toppings: Topping[], isLoading: boolean, onToppingClick: (topping: Topping) => void }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  return (
     <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {toppings.map(topping => (
        <Card key={topping.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors flex flex-col" onClick={() => onToppingClick(topping)}>
          <div className="relative aspect-square w-full">
            <Image src={topping.imageUrl || `https://picsum.photos/seed/${topping.id}/200/200`} alt={topping.name} fill className="object-cover" data-ai-hint="food topping" />
          </div>
          <CardContent className="p-3 space-y-1 flex-grow flex flex-col">
             <p className="font-semibold text-sm leading-snug">{topping.name}</p>
             <p className="font-semibold text-primary text-sm">Rp {topping.price.toLocaleString('id-ID')}</p>
             <div className="text-xs text-muted-foreground mt-1 space-y-0.5 flex-grow">
                <p>Stok: {topping.stock}</p>
             </div>
             {topping.description && <p className="text-xs italic truncate text-muted-foreground pt-1">{topping.description}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout }: { cartItems: CartItem[], onUpdateQuantity: (cartItemId: string, newQuantity: number) => void, onRemoveItem: (cartItemId: string) => void, onCheckout: () => void }) {
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.itemTotal, 0), [cartItems]);
  
  const cartContent = (
    <Card className="flex flex-col h-full sticky top-[var(--header-height)]">
      <CardHeader>
        <CardTitle>Keranjang</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
            <ShoppingBag className="mx-auto h-16 w-16" />
            <p className="mt-4">Keranjang Anda kosong</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="flex gap-4">
                <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/80/80`} alt={item.name} width={80} height={80} className="rounded-md object-cover w-16 h-16" />
                <div className="flex-grow">
                  <p className="font-semibold text-sm">{item.name}</p>
                  {item.selectedToppings.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + {item.selectedToppings.map(t => t.name).join(', ')}
                    </p>
                  )}
                   {item.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Catatan: {item.notes}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-primary">Rp {item.itemTotal.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.cartItemId!, item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="h-4 w-4" /></Button>
                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.cartItemId!, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveItem(item.cartItemId!)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 p-6 border-t">
        <div className="flex w-full justify-between font-semibold">
          <span>Total</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <Button className="w-full" disabled={cartItems.length === 0} onClick={onCheckout}>
          Lanjut ke Pembayaran
        </Button>
      </CardFooter>
    </Card>
  );

  return cartContent;
}

export default function KasirPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProductForToppings, setSelectedProductForToppings] = useState<Product | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const productsQuery = query(collection(firestore, 'products'), orderBy('name', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const data: Product[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(data);
      setIsLoading(false);
    });

    const toppingsQuery = query(collection(firestore, 'toppings'), orderBy('name', 'asc'));
    const unsubscribeToppings = onSnapshot(toppingsQuery, (snapshot) => {
      const data: Topping[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Topping));
      setToppings(data);
    });

    const categoriesQuery = query(collection(firestore, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
        const data: Category[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as Category));
        setCategories(data);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeToppings();
      unsubscribeCategories();
    };
  }, []);
  
  const handleProductClick = (product: Product) => {
    setSelectedProductForToppings(product);
  };
  
  const handleToppingClick = (topping: Topping) => {
    const cartItemId = `topping-${topping.id}-${Date.now()}`;
    const newItem: CartItem = {
      ...topping,
      // The line below is a bit of a hack to make the types work. 
      // A topping is not a full product, but we are treating it as one in the cart.
      categoryId: '',
      cartItemId: cartItemId,
      id: topping.id!,
      quantity: 1,
      selectedToppings: [],
      itemTotal: topping.price,
    };
  
    const existingItemIndex = cartItems.findIndex(item => item.id === topping.id && item.selectedToppings.length === 0 && !item.notes);
    
    if (existingItemIndex > -1) {
      const updatedCart = [...cartItems];
      const existingItem = updatedCart[existingItemIndex];
      existingItem.quantity += 1;
      existingItem.itemTotal = existingItem.price * existingItem.quantity;
      setCartItems(updatedCart);
    } else {
      setCartItems(prevCart => [...prevCart, newItem]);
    }
     toast({ title: `${topping.name} ditambahkan ke keranjang.` });
  };

  const handleAddToCart = (product: Product, selectedToppings: Topping[], notes?: string) => {
    const toppingIds = selectedToppings.map(t => t.id).sort().join(',');
    const cartItemId = `${product.id}-${toppingIds}-${notes || ''}`;

    const existingItemIndex = cartItems.findIndex(item => item.cartItemId === cartItemId);

    if (existingItemIndex > -1) {
        const updatedCart = [...cartItems];
        const existingItem = updatedCart[existingItemIndex];
        existingItem.quantity += 1;
        const toppingsTotal = existingItem.selectedToppings.reduce((sum, t) => sum + t.price, 0);
        existingItem.itemTotal = (existingItem.price + toppingsTotal) * existingItem.quantity;
        setCartItems(updatedCart);
        toast({ title: "Jumlah item diperbarui di keranjang." });
    } else {
        const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
        const newItem: CartItem = {
            ...product,
            cartItemId: cartItemId,
            quantity: 1,
            selectedToppings: selectedToppings,
            notes: notes,
            itemTotal: (product.price + toppingsTotal),
        };
        setCartItems(prevCart => [...prevCart, newItem]);
        toast({ title: `${product.name} ditambahkan ke keranjang.` });
    }
    setSelectedProductForToppings(null);
  }

  const handleUpdateCartQuantity = (cartItemId: string, newQuantity: number) => {
    setCartItems(currentCart => {
      const itemIndex = currentCart.findIndex(item => item.cartItemId === cartItemId);
      if (itemIndex === -1) return currentCart;

      if (newQuantity <= 0) {
        return currentCart.filter(item => item.cartItemId !== cartItemId);
      }
      
      return currentCart.map(item => {
        if (item.cartItemId === cartItemId) {
          const toppingsTotal = item.selectedToppings.reduce((sum, t) => sum + t.price, 0);
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: (item.price + toppingsTotal) * newQuantity
          };
        }
        return item;
      });
    });
  };
  
  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems(currentCart => currentCart.filter(item => item.cartItemId !== cartItemId));
  };
  
  const handleCheckout = () => {
    setIsPaymentModalOpen(true);
  }

  const handleProcessSale = async (paymentMethod: string, cashAmount?: number): Promise<Sale | undefined> => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Anda harus login untuk melakukan penjualan."});
      throw new Error("User not logged in");
    }

    try {
        const total = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const newSale = await addSale(user, cartItems, paymentMethod, total, cashAmount);
        
        toast({ title: "Penjualan Berhasil!", description: `Pembayaran dengan ${paymentMethod}.`});
        
        setCartItems([]);
        return newSale;
        
    } catch (error) {
        console.error("Failed to process sale:", error);
        toast({
            variant: "destructive",
            title: "Gagal Memproses Penjualan",
            description: "Terjadi kesalahan saat menyimpan data penjualan. Stok barang tidak diubah.",
        });
        throw error; // Re-throw to be caught by the modal
    }
  }


  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.categoryId === categoryFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered;
  }, [products, searchTerm, categoryFilter]);

  const filteredToppings = useMemo(() => {
     return toppings.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [toppings, searchTerm]);


  const productSection = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari produk atau topping..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="toppings">Toping</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductGrid products={filteredProducts} categories={categories} isLoading={isLoading} onProductClick={handleProductClick} />
        </TabsContent>
        <TabsContent value="toppings" className="mt-4">
          <ToppingGrid toppings={filteredToppings} isLoading={isLoading} onToppingClick={handleToppingClick}/>
        </TabsContent>
      </Tabs>
    </div>
  );

  const cartForMobile = (
     <SheetContent className="flex flex-col p-0 sm:max-w-lg">
        <ScrollArea className="flex-grow">
          <Cart cartItems={cartItems} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveCartItem} onCheckout={handleCheckout} />
        </ScrollArea>
     </SheetContent>
  );

  const totalCartQuantity = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  return (
    <>
    <ToppingSelectionDialog 
      product={selectedProductForToppings}
      toppings={toppings}
      isOpen={!!selectedProductForToppings}
      onOpenChange={() => setSelectedProductForToppings(null)}
      onAddToCart={handleAddToCart}
    />
    <PaymentModal 
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        cartItems={cartItems}
        onProcessSale={handleProcessSale}
    />
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3">
            {productSection}
        </div>
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg z-40">
                    <ShoppingBag className="h-7 w-7" />
                    {totalCartQuantity > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {totalCartQuantity}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            {cartForMobile}
          </Sheet>
        ) : (
          <div className="md:col-span-2 h-full">
            <Cart cartItems={cartItems} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveCartItem} onCheckout={handleCheckout} />
          </div>
        )}
    </div>
    </>
  );
}
