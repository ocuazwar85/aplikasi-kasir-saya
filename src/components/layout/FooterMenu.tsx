'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ShoppingCart,
  Package,
  Truck,
  LineChart,
  Settings,
} from 'lucide-react';

const adminNavItems = [
  { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { href: '/produk', label: 'Produk', icon: Package },
  { href: '/laporan', label: 'Laporan', icon: LineChart },
  { href: '/pengaturan', label: 'Atur', icon: Settings },
];

const employeeNavItems = [
  { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
  { href: '/pembelian', label: 'Pembelian', icon: Truck },
  { href: '/laporan', label: 'Penjualan', icon: LineChart },
];

export default function FooterMenu() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const controlFooter = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > lastScrollY && window.scrollY > 50) { // if scroll down hide the footer
        setIsVisible(false);
      } else { // if scroll up show the footer
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlFooter);
      return () => {
        window.removeEventListener('scroll', controlFooter);
      };
    }
  }, [lastScrollY, controlFooter]);

  // Prevent rendering on the server and on non-mobile clients to avoid hydration mismatch
  if (!isMobile) {
      return null;
  }

  const navItems = user?.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <footer
      className={cn(
        'fixed bottom-0 left-1/2 z-50 w-full max-w-screen-md -translate-x-1/2 transform transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <nav className="m-2 rounded-xl border bg-card/95 p-2 shadow-lg backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent-foreground',
                  isActive && 'bg-primary/10 text-primary'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </footer>
  );
}
