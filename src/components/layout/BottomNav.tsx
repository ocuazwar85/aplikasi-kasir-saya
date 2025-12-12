'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Box, LayoutGrid, Truck, LineChart, DollarSign } from 'lucide-react';

const navItems = [
  { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { href: '/produk', label: 'Produk', icon: Package },
  { href: '/topping', label: 'Toping', icon: Box },
  { href: '/kategori', label: 'Kategori', icon: LayoutGrid },
  { href: '/pembelian', label: 'Beli', icon: Truck },
  { href: '/laporan', label: 'Laporan', icon: LineChart },
  { href: '/keuntungan', label: 'Profit', icon: DollarSign },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    
    if (user?.role !== 'admin') {
      const employeeNavItems = [
        { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
        { href: '/pembelian', label: 'Beli', icon: Truck },
        { href: '/laporan', label: 'Laporan', icon: LineChart },
      ];
      return (
         <nav className="flex w-full items-center justify-center gap-1 bg-secondary p-1 rounded-lg">
            {employeeNavItems.map((item) => {
                 const isActive = pathname.startsWith(item.href);
                 return (
                    <Button key={item.href} asChild variant={isActive ? 'default' : 'ghost'} size="sm" className="flex-1">
                        <Link href={item.href} className="flex flex-col h-auto p-2 gap-1 md:flex-row md:items-center">
                             <item.icon className="h-5 w-5" />
                             <span className="text-[10px] md:text-sm font-semibold">{item.label}</span>
                        </Link>
                    </Button>
                 )
            })}
        </nav>
      )
    }

    return (
        <nav className="flex w-full items-center justify-start gap-1 bg-secondary p-1 rounded-lg overflow-x-auto">
            {navItems.map((item) => {
                 const isActive = pathname.startsWith(item.href);
                 return (
                    <Button key={item.href} asChild variant={isActive ? 'default' : 'ghost'} size="sm" className="flex-shrink-0">
                        <Link href={item.href} className="flex flex-row items-center h-auto p-2 gap-2">
                             <item.icon className="h-5 w-5" />
                             <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
                        </Link>
                    </Button>
                 )
            })}
        </nav>
    )
}
