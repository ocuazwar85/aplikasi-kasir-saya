import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import type { User, StoreSettings, Product, Category, Topping, Sale, Purchase, CartItem } from './types';

// --- User Management ---

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  // In a real app, hash the password before saving
  const docRef = await addDoc(collection(firestore, 'users'), user);
  return { id: docRef.id, ...user };
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, userData);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  await deleteDoc(userRef);
};


export const findUserByUsername = async (username: string): Promise<User | null> => {
  const q = query(collection(firestore, 'users'), where('username', '==', username), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
};

// --- Store Settings ---

const DEFAULT_SETTINGS: Omit<StoreSettings, 'id'> = {
    storeName: 'Toko Anda',
    address: 'Jalan Kenangan No. 1',
    phone: '081234567890',
    owner: 'Pemilik Toko',
    logoUrl: '',
    profitPercentage: 30,
};

export const getStoreSettings = async (): Promise<StoreSettings | null> => {
    const settingsRef = doc(firestore, 'settings', 'store');
    const docSnap = await getDoc(settingsRef);

    if (docSnap.exists()) {
        return { id: 'store', ...docSnap.data() } as StoreSettings;
    } else {
        // If settings don't exist, it implies a fresh state, don't create defaults here.
        // The first time setup dialog will handle creating it.
        return null;
    }
};

export const updateStoreSettings = async (settings: Partial<Omit<StoreSettings, 'id'>>): Promise<void> => {
  const settingsRef = doc(firestore, 'settings', 'store');
  // Use setDoc with merge:true to create or update the document.
  await setDoc(settingsRef, settings, { merge: true });
};


// --- Sales ---
export const addSale = async (user: User, cartItems: CartItem[], paymentMethod: string, total: number, cashAmount?: number): Promise<Sale> => {
  const saleData: Omit<Sale, 'id' | 'createdAt'> = {
    cashierId: user.id!,
    cashierName: user.name,
    paymentMethod: paymentMethod,
    total: total,
    items: cartItems.map(item => ({
      productId: item.id!,
      productName: item.name,
      quantity: item.quantity,
      price: item.price, // Price of the product at time of sale
      toppings: item.selectedToppings.map(t => ({
        toppingId: t.id!,
        toppingName: t.name,
        price: t.price,
      })),
      notes: item.notes || '',
    })),
  };
  
  // Only include cashAmount if it's a cash payment and has a value
  if (paymentMethod === 'Tunai' && typeof cashAmount === 'number') {
    saleData.cashAmount = cashAmount;
  }

  const batch = writeBatch(firestore);

  // 1. Add the sale document
  const saleRef = doc(collection(firestore, 'sales'));
  const finalSaleData = { ...saleData, createdAt: serverTimestamp() };
  batch.set(saleRef, finalSaleData);

  // 2. Update stock for each item in the cart
  for (const item of cartItems) {
      // Update product stock
      if(item.categoryId) { // Check if it's a product, not just a topping
         const productRef = doc(firestore, 'products', item.id!);
         const newProductStock = item.stock - item.quantity;
         batch.update(productRef, { stock: newProductStock < 0 ? 0 : newProductStock });
      } else { // It's a topping sold individually
         const toppingRef = doc(firestore, 'toppings', item.id!);
         const newToppingStock = item.stock - item.quantity;
         batch.update(toppingRef, { stock: newToppingStock < 0 ? 0 : newToppingStock });
      }

      // Update selected toppings stock
      for (const topping of item.selectedToppings) {
          const toppingRef = doc(firestore, 'toppings', topping.id!);
          const newToppingStock = topping.stock - item.quantity; // Each topping is reduced by the quantity of the parent product
          batch.update(toppingRef, { stock: newToppingStock < 0 ? 0 : newToppingStock });
      }
  }

  // 3. Commit the batch
  await batch.commit();

  // 4. Return the full sale object with ID and server-generated timestamp
  // We can't get the server timestamp client-side directly, so we use a client-side one for the return object
  return { id: saleRef.id, ...saleData, createdAt: new Date() } as Sale;
}


// --- Factory Reset ---
export const factoryReset = async (): Promise<void> => {
  const collectionsToDelete = ['sales', 'purchases', 'products', 'toppings', 'categories', 'users'];
  const batch = writeBatch(firestore);

  for (const collectionName of collectionsToDelete) {
    const q = query(collection(firestore, collectionName));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }

  // Also delete the settings document
  const settingsRef = doc(firestore, 'settings', 'store');
  batch.delete(settingsRef);

  await batch.commit();
};
