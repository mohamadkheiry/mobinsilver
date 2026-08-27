import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../types'

interface FavoritesValue { items: Product[]; toggle: (product: Product) => void; has: (id: number) => boolean }
const FavoritesContext = createContext<FavoritesValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem('mobin-silver-favorites-v1') ?? '[]') as Product[] } catch { return [] }
  })
  const toggle = useCallback((product: Product) => setItems(current => {
    const next = current.some(x => x.id === product.id) ? current.filter(x => x.id !== product.id) : [...current, product]
    localStorage.setItem('mobin-silver-favorites-v1', JSON.stringify(next)); return next
  }), [])
  const value = useMemo(() => ({ items, toggle, has: (id: number) => items.some(x => x.id === id) }), [items, toggle])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider')
  return context
}
