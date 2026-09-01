import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
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
  try {
    const stored = JSON.parse(localStorage.getItem('mobin-silver-cart-v1') ?? '[]') as unknown
    if (!Array.isArray(stored)) return []
    return stored.flatMap(value => {
      if (!value || typeof value !== 'object') return []
      const candidate = value as Partial<CartItem>
      const product = candidate.product
      if (!product || typeof product.id !== 'number' || typeof product.name !== 'string' || typeof product.price !== 'number' || !Number.isFinite(product.price) || typeof product.stock !== 'number') return []
      const quantity = typeof candidate.quantity === 'number' && Number.isFinite(candidate.quantity) ? Math.floor(candidate.quantity) : 1
      if (product.stock < 1) return []
      return [{ product, quantity: Math.max(1, Math.min(product.stock, quantity)) }]
    })
  } catch { return [] }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  const persist = useCallback((next: CartItem[]) => { setItems(next); localStorage.setItem('mobin-silver-cart-v1', JSON.stringify(next)) }, [])
  useEffect(() => {
    let active = true
    api.products().then(products => {
      if (!active) return
      const currentProducts = new Map(products.map(product => [product.id, product]))
      setItems(current => {
        const next = current.flatMap(item => {
          const product = currentProducts.get(item.product.id)
          if (!product || product.stock < 1) return []
          return [{ product, quantity: Math.max(1, Math.min(product.stock, item.quantity)) }]
        })
        localStorage.setItem('mobin-silver-cart-v1', JSON.stringify(next))
        return next
      })
    }).catch(() => undefined)
    return () => { active = false }
  }, [])
  const add = useCallback((product: Product, quantity = 1) => {
    if (product.stock < 1 || !Number.isFinite(quantity) || quantity < 1) return
    setItems(current => {
      const found = current.find(item => item.product.id === product.id)
      const safeQuantity = Math.max(1, Math.floor(quantity))
      const next = found
        ? current.map(item => item.product.id === product.id ? { product, quantity: Math.min(product.stock, item.quantity + safeQuantity) } : item)
        : [...current, { product, quantity: Math.min(product.stock, safeQuantity) }]
      localStorage.setItem('mobin-silver-cart-v1', JSON.stringify(next))
      return next
    })
  }, [])
  const update = useCallback((productId: number, quantity: number) => {
    if (!Number.isFinite(quantity)) return
    persist(items.flatMap(item => item.product.id !== productId ? [item] : item.product.stock < 1 ? [] : [{ ...item, quantity: Math.max(1, Math.min(item.product.stock, Math.floor(quantity))) }]))
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
