import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { DitherOptions } from '../lib/dither';
import { saveCart, loadCart } from '../lib/storage';

export type PosterSize = 'A5' | 'A4' | 'A3';
export type FrameOption = 'none' | 'black' | 'white';

export interface CartItem {
  id: string;
  options: DitherOptions;
  imageFile: File | null;
  processedImage: ImageData | null;
  previewBlob: Blob | null;
  previewBlobUrl: string;   // Object URL — recreated on load, revoke on remove
  size: PosterSize;
  quantity: number;
  frame: FrameOption;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Pick<CartItem, 'size' | 'quantity' | 'frame'>>) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const hydrated = useRef(false);

  // Rehydrate the cart from IndexedDB on first mount (object URLs don't
  // survive a reload, so recreate them from the stored preview blobs).
  useEffect(() => {
    loadCart()
      .then((stored) => {
        const restored = (stored as CartItem[]).map((item) => ({
          ...item,
          previewBlobUrl: item.previewBlob ? URL.createObjectURL(item.previewBlob) : '',
        }));
        setItems((current) => (current.length === 0 ? restored : current));
      })
      .catch((err) => console.error('[cart] failed to restore', err))
      .finally(() => {
        hydrated.current = true;
      });
  }, []);

  // Persist on every change after hydration. Object URLs are session-scoped,
  // so strip them before storing.
  useEffect(() => {
    if (!hydrated.current) return;
    const toStore = items.map(({ previewBlobUrl: _url, ...rest }) => ({ ...rest, previewBlobUrl: '' }));
    saveCart(toStore).catch((err) => console.error('[cart] failed to persist', err));
  }, [items]);

  function addItem(item: Omit<CartItem, 'id'>) {
    const id = crypto.randomUUID();
    setItems(prev => [...prev, { ...item, id }]);
  }

  function removeItem(id: string) {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.previewBlobUrl) URL.revokeObjectURL(item.previewBlobUrl);
      return prev.filter(i => i.id !== id);
    });
  }

  function updateItem(id: string, patch: Partial<Pick<CartItem, 'size' | 'quantity' | 'frame'>>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }

  function clearCart() {
    setItems(prev => {
      prev.forEach(i => { if (i.previewBlobUrl) URL.revokeObjectURL(i.previewBlobUrl); });
      return [];
    });
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
