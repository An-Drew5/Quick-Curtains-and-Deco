"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

const CART_STORAGE_KEY = "qcd_cart_items";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "HYDRATE_CART": {
      return Array.isArray(action.payload) ? action.payload : [];
    }

    case "ADD_ITEM": {
      const { item, quantity = 1 } = action.payload || {};
      if (!item || !item.productId || quantity < 1) {
        return state;
      }

      const existingIndex = state.findIndex(
        (cartItem) => cartItem.productId === item.productId,
      );

      if (existingIndex >= 0) {
        return state.map((cartItem, index) =>
          index === existingIndex
            ? {
                ...cartItem,
                quantity: cartItem.quantity + quantity,
              }
            : cartItem,
        );
      }

      return [
        ...state,
        {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          price: Number(item.price || 0),
          quantity,
          image: item.image || "",
        },
      ];
    }

    case "REMOVE_ITEM": {
      const productId = action.payload;
      return state.filter((cartItem) => cartItem.productId !== productId);
    }

    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload || {};
      if (!productId) {
        return state;
      }

      if (quantity <= 0) {
        return state.filter((cartItem) => cartItem.productId !== productId);
      }

      return state.map((cartItem) =>
        cartItem.productId === productId
          ? {
              ...cartItem,
              quantity,
            }
          : cartItem,
      );
    }

    case "CLEAR_CART": {
      return [];
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: "HYDRATE_CART", payload: parsed });
      }
    } catch (_error) {
      // Ignore malformed cart payloads and continue with an empty cart.
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const totalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      totalItemCount,
      subtotal,
      isHydrated,
      addItem: (item, quantity = 1) =>
        dispatch({ type: "ADD_ITEM", payload: { item, quantity } }),
      removeItem: (productId) =>
        dispatch({ type: "REMOVE_ITEM", payload: productId }),
      updateQuantity: (productId, quantity) =>
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      dispatch,
    }),
    [items, totalItemCount, subtotal, isHydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
