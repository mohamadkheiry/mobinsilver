import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../types'

export interface CartItem { product: Product; quantity: number }
interface CartValue {
  items: CartItem[]
  count: number
  total: number
  add: (product: Product, quantity?: number) => void
  update: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
}
const CartContext = createContext<CartValue | null>(null)

function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem('mobin-silver-cart-v1') ?? '[]') as CartItem[] } catch { return [] }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const persist = useCallback((next: CartItem[]) => { setItems(next); localStorage.setItem('mobin-silver-cart-v1', JSON.stringify(next)) }, [])
  const add = useCallback((product: Product, quantity = 1) => {
    setItems(current => {
      const found = current.find(item => item.product.id === product.id)
      const next = found
        ? current.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item)
        : [...current, { product, quantity: Math.min(product.stock, quantity) }]
      localStorage.setItem('mobin-silver-cart-v1', JSON.stringify(next))
      return next
    })
  }, [])
  const update = useCallback((productId: number, quantity: number) => {
    persist(items.map(item => item.product.id === productId ? { ...item, quantity: Math.max(1, Math.min(item.product.stock, quantity)) } : item))
  }, [items, persist])
  const remove = useCallback((productId: number) => persist(items.filter(item => item.product.id !== productId)), [items, persist])
  const clear = useCallback(() => persist([]), [persist])
  const value = useMemo(() => ({ items, count: items.reduce((sum, x) => sum + x.quantity, 0), total: items.reduce((sum, x) => sum + x.product.price * x.quantity, 0), add, update, remove, clear }), [items, add, update, remove, clear])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
