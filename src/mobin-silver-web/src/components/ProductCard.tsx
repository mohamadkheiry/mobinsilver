import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { categoryLabel, toman } from '../lib/format'
import type { Product } from '../types'

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart()
  const favorites = useFavorites()
  const favored = favorites.has(product.id)
  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={`/product/${product.slug}`} aria-label={`مشاهده ${product.name}`}><img src={product.imageUrl} alt={product.name} loading="lazy" /></Link>
        <button className={`favorite ${favored ? 'favorite--active' : ''}`} onClick={() => favorites.toggle(product)} aria-label={favored ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}><Heart fill={favored ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="product-card__body">
        <small>{categoryLabel[product.category]}</small>
        <h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
        <div className="product-card__meta"><span>عیار {product.purity}</span><span>{product.weight}</span></div>
        <div className="product-card__footer"><strong>{toman(product.price)}</strong><button onClick={() => cart.add(product)} disabled={product.stock < 1} aria-label={`افزودن ${product.name} به سبد`}><ShoppingBag /></button></div>
      </div>
    </article>
  )
}
