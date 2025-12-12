import type { Timestamp } from 'firebase/firestore';

export interface User {
  id?: string;
  name: string;
  username: string;
  password?: string; // Should be handled securely
  role: 'admin' | 'employee';
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  address: string;
  phone: string;
  owner: string;
  logoUrl: string;
  profitPercentage: number;
  firebaseConfig?: string;
  firebaseRules?: string;
}

export interface Category {
  id?: string;
  name: string;
  description: string;
}

export interface Product {
  id?: string;
  name: string;
  categoryId: string;
  stock: number;
  price: number;
  imageUrl: string;
  description: string;
}

export interface Topping {
  id?: string;
  name:string;
  stock: number;
  price: number;
  imageUrl: string;
  description: string;
}

export interface CartItem extends Product {
  cartItemId?: string; // Unique identifier for the item in the cart
  quantity: number;
  selectedToppings: Topping[];
  notes?: string;
  itemTotal: number;
}

export interface Sale {
  id?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number; // price of the product at the time of sale
    toppings: {
      toppingId: string;
      toppingName: string;
      price: number;
    }[];
    notes?: string;
  }[];
  total: number;
  paymentMethod: string;
  cashAmount?: number;
  cashierId: string;
  cashierName: string;
  createdAt: Timestamp | Date;
}


export interface Purchase {
  id?: string;
  itemName: string;
  supplier: string;
  quantity: number;
  price: number;
  description: string;
  userId: string;
  userName: string;
  createdAt: Timestamp | Date;
}
