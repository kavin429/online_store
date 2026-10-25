"use client";

import React, {
  createContext,
  useContext,
  useState,
} from "react";

interface WishlistItem {
  id: number;
  name: string;
  sellingPrice: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];

  addToWishlist: (product: WishlistItem) => void;

  removeFromWishlist: (id: number) => void;

  isInWishlist: (id: number) => boolean;
}

const WishlistContext =
  createContext<WishlistContextType | null>(null);

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  const addToWishlist = (product: WishlistItem) => {
    setWishlist((prev) => [...prev, product]);
  };

  const removeFromWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const isInWishlist = (id: number) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}