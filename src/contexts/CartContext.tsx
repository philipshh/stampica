import React, { createContext, useContext, useState } from 'react';
import type { DitherOptions } from '../lib/dither';

export type PosterSize = 'A5' | 'A4' | 'A3';
export type FrameOption = 'none' | 'black' | 'white';

export interface CartItem {
  id: string;
  options: DitherOptions;
  imageFile: File | null;
  processedImage: ImageData | null;
  previewBlob: Blob | null;
  previewBlobUrl: string;   // Object URL — revoke on remove
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
