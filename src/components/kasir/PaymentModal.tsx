'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CartItem, Sale, StoreSettings } from '@/lib/types';
import { Banknote, QrCode, Smartphone, CreditCard, Bike, Loader2, PartyPopper, Printer, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { toPng } from 'html-to-image';


interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  onProcessSale: (paymentMethod: string, cashAmount?: number) => Promise<Sale | undefined>;
}

const paymentMethods = [
    { name: 'Tunai', icon: Banknote },
    { name: 'QRIS', icon: QrCode },
    { name: 'E-Wallet', icon: Smartphone },
    { name: 'Transfer Bank', icon: CreditCard },
    { name: 'Ojek Online', icon: Bike },
]

function Receipt({ sale, settings, receiptRef }: { sale: Sale | null, settings: StoreSettings | null, receiptRef?: React.RefObject<HTMLDivElement> }) {
    if (!sale) return null;
    const isTunai = sale.paymentMethod === 'Tunai';
    const paymentAmount = isTunai && sale.cashAmount ? sale.cashAmount : sale.total;
    const changeAmount = isTunai && sale.cashAmount ? sale.cashAmount - sale.total : 0;

    return (
        <div ref={receiptRef} className="text-sm text-gray-800 bg-white p-4 font-mono">
            <div className="text-center">
                <h3 className="text-lg font-bold">{settings?.storeName || 'Toko Anda'}</h3>
                <p>{settings?.address || 'Alamat Toko'}</p>
                <p>{settings?.phone || 'No. Telepon'}</p>
            </div>
            <Separator className="my-2 border-dashed" />
            <div>
                <p>No: {sale.id?.substring(0, 8)}</p>
                <p>Kasir: {sale.cashierName}</p>
                <p>Tanggal: {format(new Date(sale.createdAt), 'dd/MM/yy HH:mm')}</p>
            </div>
            <Separator className="my-2 border-dashed" />
            {sale.items.map((item, index) => (
                <div key={index}>
                    <p className="font-semibold">{item.productName}{item.quantity > 1 ? ` (x${item.quantity})`: ''}</p>
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
                    <span>Rp {paymentAmount.toLocaleString('id-ID')}</span>
                </div>
                 {isTunai && changeAmount > 0 && (
                    <div className="flex justify-between">
                        <span>KEMBALI</span>
                        <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
                    </div>
                )}
            </div>
            <Separator className="my-2 border-dashed" />
            <p className="text-center mt-4">Terima kasih!</p>
        </div>
    );
}

function SendReceiptModal({ isOpen, onOpenChange, sale, settings }: { isOpen: boolean, onOpenChange: (open: boolean) => void, sale: Sale | null, settings: StoreSettings | null }) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = useCallback(() => {
        if (receiptRef.current === null) {
          return;
        }
        setIsDownloading(true);
        toPng(receiptRef.current, { 
          cacheBust: true, 
          pixelRatio: 2,
          skipFonts: true
        })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `struk-${sale?.id?.substring(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            console.error('oops, something went wrong!', err);
          })
          .finally(() => {
            setIsDownloading(false);
          });
      }, [receiptRef, sale]);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Kirim atau Download Struk</DialogTitle>
                </DialogHeader>
                <div className="my-4">
                    <Receipt sale={sale} settings={settings} receiptRef={receiptRef} />
                </div>
                <DialogFooter className='gap-2'>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
                    <Button onClick={handleDownload} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                        Download Struk
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function PaymentModal({
  isOpen,
  onOpenChange,
  cartItems,
  onProcessSale,
}: PaymentModalProps) {
  const { settings } = useAuth();
  const [step, setStep] = useState<'method' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isSendReceiptModalOpen, setIsSendReceiptModalOpen] = useState(false);
  const receiptRefForPrint = useRef<HTMLDivElement>(null);


  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.itemTotal, 0), [cartItems]);
  const change = useMemo(() => {
    const cash = parseFloat(cashAmount);
    if (isNaN(cash) || cash < total) return 0;
    return cash - total;
  }, [cashAmount, total]);
  
  const handlePay = async () => {
    let finalCashAmount: number | undefined = undefined;
    if (selectedMethod === 'Tunai') {
        const cashValue = parseFloat(cashAmount);
        if (isNaN(cashValue) || cashValue < total) {
            alert("Jumlah uang tunai tidak mencukupi.");
            return;
        }
        finalCashAmount = cashValue;
    }

    setIsProcessing(true);
    try {
        const saleResult = await onProcessSale(selectedMethod!, finalCashAmount);
        if (saleResult) {
            setLastSale(saleResult);
            setStep('success');
        }
    } catch(e) {
        console.error("Payment failed", e);
    } finally {
        setIsProcessing(false);
    }
  }

  const handleMethodSelect = (methodName: string) => {
    setSelectedMethod(methodName);
    if (methodName !== 'Tunai') {
        const payButton = document.getElementById('pay-button');
        if (payButton) payButton.click();
    }
  }

  const handlePrint = () => {
    const printContent = receiptRefForPrint.current;
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


  // Reset state when closing
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setStep('method');
        setSelectedMethod(null);
        setCashAmount('');
        setIsProcessing(false);
        setLastSale(null);
      }, 300);
    }
  }
  
  // Reset state if cart becomes empty while modal is open (e.g. background update)
  useEffect(() => {
    if (isOpen && cartItems.length === 0 && step !== 'success') {
      handleOpenChange(false);
    }
  }, [cartItems, isOpen, step, handleOpenChange]);
  
  useEffect(() => {
    if (selectedMethod && selectedMethod !== 'Tunai') {
      handlePay();
    }
  }, [selectedMethod]);


  if (!isOpen) return null;
  
  const renderMethodSelection = () => (
     <>
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>
            Total belanja: <span className="font-bold text-primary">Rp {total.toLocaleString('id-ID')}</span>
          </DialogDescription>
        </DialogHeader>
        
        {selectedMethod === 'Tunai' ? (
             <div className="my-4 space-y-4">
                <div>
                    <label htmlFor="cashAmount" className="text-sm font-medium">Uang Tunai Diterima</label>
                    <Input 
                        id="cashAmount"
                        type="number"
                        placeholder="Masukkan jumlah uang"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="text-lg"
                        autoFocus
                    />
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setCashAmount(total.toString())}>
                    Uang Pas
                </Button>
                <div className="text-center p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Kembalian</p>
                    <p className="text-2xl font-bold text-primary">Rp {change.toLocaleString('id-ID')}</p>
                </div>
            </div>
        ) : (
            <div className="my-4">
                <h3 className="mb-4 text-lg font-medium text-center">Pilih Metode Pembayaran</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {paymentMethods.map(method => (
                        <Button 
                            key={method.name}
                            variant="outline"
                            className={cn("flex flex-col items-center justify-center h-24 gap-2 text-center", selectedMethod === method.name && "border-primary ring-2 ring-primary")}
                            onClick={() => handleMethodSelect(method.name)}
                            disabled={isProcessing}
                        >
                            {isProcessing && selectedMethod === method.name ? <Loader2 className="w-8 h-8 animate-spin" /> : <method.icon className="w-8 h-8 text-primary" />}
                            <span className="text-sm font-semibold">{method.name}</span>
                        </Button>
                    ))}
                </div>
            </div>
        )}

        <DialogFooter>
          {selectedMethod === 'Tunai' ? (
            <>
                <Button type="button" variant="outline" onClick={() => setSelectedMethod(null)} disabled={isProcessing}>
                    Kembali
                </Button>
                <Button 
                    id="pay-button"
                    type="button" 
                    onClick={handlePay}
                    disabled={isProcessing || parseFloat(cashAmount) < total}
                    >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Bayar
                </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Batal
            </Button>
          )}
        </DialogFooter>
     </>
  );

  
  const renderSuccess = () => (
    <>
         <DialogHeader>
            <DialogTitle className="text-center">Pembayaran Berhasil!</DialogTitle>
        </DialogHeader>
        <div className="my-8 flex flex-col items-center justify-center text-center gap-4">
            <PartyPopper className="w-20 h-20 text-green-500"/>
            <p>Transaksi telah berhasil disimpan.</p>
        </div>
        <div className="hidden">
           <div ref={receiptRefForPrint}>
              <Receipt sale={lastSale} settings={settings} />
           </div>
        </div>
         <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Struk
            </Button>
            <Button variant="outline" onClick={() => setIsSendReceiptModalOpen(true)}>
              Kirim Struk
            </Button>
            <Button className="sm:col-span-2" onClick={() => handleOpenChange(false)}>
              Selesai (Transaksi Baru)
            </Button>
        </DialogFooter>
    </>
  );

  return (
    <>
    <Dialog open={isOpen && !isSendReceiptModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'method' && renderMethodSelection()}
        {step === 'success' && renderSuccess()}
      </DialogContent>
    </Dialog>
    <SendReceiptModal 
        isOpen={isSendReceiptModalOpen}
        onOpenChange={setIsSendReceiptModalOpen}
        sale={lastSale}
        settings={settings}
    />
    </>
  );
}

    