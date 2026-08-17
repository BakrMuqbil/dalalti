'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useToast } from '@/hooks/useToast';

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  storeSlug: string;
  variantLabel?: string | null;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isHydrated: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | {
      type: 'REMOVE_ITEM';
      payload: { productId: string; variantId: string | null };
    }
  | {
      type: 'UPDATE_QUANTITY';
      payload: { productId: string; variantId: string | null; quantity: number };
    }
  | { type: 'CLEAR_CART' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'HYDRATE'; payload: CartItem[] };

function getStorageKey(storeSlug: string): string {
  return `dalalti-cart-${storeSlug}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId
      );

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems, isOpen: true };
      }

      return { ...state, items: [...state.items, action.payload], isOpen: true };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.productId === action.payload.productId &&
              item.variantId === action.payload.variantId
            )
        ),
      };
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) =>
              !(
                item.productId === action.payload.productId &&
                item.variantId === action.payload.variantId
              )
          ),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.productId === action.payload.productId &&
          item.variantId === action.payload.variantId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'OPEN_DRAWER':
      return { ...state, isOpen: true };

    case 'CLOSE_DRAWER':
      return { ...state, isOpen: false };

    case 'HYDRATE': {
      if (!Array.isArray(action.payload)) {
        return { ...state, isHydrated: true };
      }
      return { ...state, items: action.payload, isHydrated: true };
    }

    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  isHydrated: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null,
    quantity: number
  ) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart يجب أن يُستخدم داخل CartProvider');
  }
  return ctx;
}

interface CartProviderProps {
  storeSlug: string;
  children: ReactNode;
}

export function CartProvider({ storeSlug, children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
    isHydrated: false,
  });

  const { showToast } = useToast();

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey(storeSlug));
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        dispatch({ type: 'HYDRATE', payload: parsed });
      } else {
        dispatch({ type: 'HYDRATE', payload: [] });
      }
    } catch {
      dispatch({ type: 'HYDRATE', payload: [] });
    }
  }, [storeSlug]);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        getStorageKey(storeSlug),
        JSON.stringify(state.items)
      );
    } catch {
      /* ignore storage errors */
    }
  }, [state.items, storeSlug]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
      dispatch({
        type: 'ADD_ITEM',
        payload: { ...item, quantity: item.quantity ?? 1 },
      });
      showToast(`تمت إضافة ${item.name} إلى السلة`, 'success');
    },
    [showToast]
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string | null) => {
      dispatch({
        type: 'REMOVE_ITEM',
        payload: { productId, variantId: variantId ?? null },
      });
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { productId, variantId, quantity },
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    showToast('تم إفراغ السلة', 'info');
  }, [showToast]);

  const openDrawer = useCallback(() => {
    dispatch({ type: 'OPEN_DRAWER' });
  }, []);

  const closeDrawer = useCallback(() => {
    dispatch({ type: 'CLOSE_DRAWER' });
  }, []);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const value: CartContextValue = {
    items: state.items,
    itemCount,
    total,
    isOpen: state.isOpen,
    isHydrated: state.isHydrated,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openDrawer,
    closeDrawer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
