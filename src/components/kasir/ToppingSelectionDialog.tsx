'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { Product, Topping } from '@/lib/types';

interface ToppingSelectionDialogProps {
  product: Product | null;
  toppings: Topping[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddToCart: (product: Product, selectedToppings: Topping[], notes?: string) => void;
}

export default function ToppingSelectionDialog({
  product,
  toppings,
  isOpen,
  onOpenChange,
  onAddToCart,
}: ToppingSelectionDialogProps) {
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Reset selection when dialog opens for a new product
    if (isOpen) {
      setSelectedToppings([]);
      setNotes('');
    }
  }, [isOpen]);

  if (!product) return null;

  const handleToppingChange = (topping: Topping, checked: boolean) => {
    setSelectedToppings((prev) => {
      if (checked) {
        return [...prev, topping];
      } else {
        return prev.filter((t) => t.id !== topping.id);
      }
    });
  };

  const handleSubmit = () => {
    onAddToCart(product, selectedToppings, notes);
  };

  const handleAddToppingless = () => {
    onAddToCart(product, [], notes);
  }

  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const grandTotal = product.price + toppingsTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Varian/Toping</DialogTitle>
          <DialogDescription>
            Pilih toping untuk <strong>{product.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[40vh] pr-4">
            <div className="space-y-4 my-4">
            {toppings.map((topping) => (
                <div key={topping.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id={`topping-${topping.id}`}
                            onCheckedChange={(checked) => handleToppingChange(topping, !!checked)}
                            checked={selectedToppings.some((t) => t.id === topping.id)}
                        />
                        <Label htmlFor={`topping-${topping.id}`} className="flex flex-col cursor-pointer">
                            <span className="font-medium">{topping.name}</span>
                            <span className="text-xs text-muted-foreground">{topping.description}</span>
                        </Label>
                    </div>
                     <span className="text-sm font-semibold text-primary">
                        + Rp {topping.price.toLocaleString('id-ID')}
                    </span>
                </div>
            ))}
            </div>
        </ScrollArea>
        
        <div>
            <Label htmlFor="notes" className="mb-2 block">Catatan (opsional)</Label>
            <Textarea 
                id="notes"
                placeholder="Contoh: jangan terlalu manis, es-nya sedikit."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </div>

        <div className="border-t pt-4 mt-2">
            <div className="flex justify-between font-semibold">
                <span>Harga Produk:</span>
                <span>Rp {product.price.toLocaleString('id-ID')}</span>
            </div>
            {selectedToppings.length > 0 && (
                 <div className="flex justify-between text-sm">
                    <span>Harga Toping:</span>
                    <span>Rp {toppingsTotal.toLocaleString('id-ID')}</span>
                </div>
            )}
             <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total:</span>
                <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2 sm:flex-row sm:justify-end sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
            </Button>
            {selectedToppings.length === 0 ? (
                <Button type="button" onClick={handleAddToppingless} className="w-full">
                    Tanpa Toping
                </Button>
            ) : (
                 <Button type="submit" onClick={handleSubmit} className="w-full">
                   Pesan
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
