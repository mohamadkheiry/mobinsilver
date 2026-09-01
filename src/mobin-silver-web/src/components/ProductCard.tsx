import { Check, Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { categoryLabel, toman } from '../lib/format'
import type { Product } from '../types'

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart()
  const favorites = useFavorites()
  const favored = favorites.has(product.id)
  const inCart = cart.items.some(item => item.product.id === product.id)
  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={`/product/${product.slug}`} aria-label={`مشاهده ${product.name}`}><img src={product.imageUrl} alt={product.name} loading="lazy" /></Link>
        <button className={`favorite ${favored ? 'favorite--active' : ''}`} onClick={() => favorites.toggle(product)} aria-label={favored ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}><Heart fill={favored ? 'currentColor' : 'none'} /></button>
        <span className={`stock-flag ${product.stock < 1 ? 'is-out' : product.stock <= 5 ? 'is-low' : ''}`}>{product.stock < 1 ? 'ناموجود' : product.stock <= 5 ? `تنها ${new Intl.NumberFormat('fa-IR').format(product.stock)} عدد` : 'موجود'}</span>
      </div>
      <div className="product-card__body">
        <small>{categoryLabel[product.category]}</small>
        <h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
        <div className="product-card__meta"><span>عیار {product.purity}</span><span>{product.weight}</span></div>
        <div className="product-card__footer"><strong>{toman(product.price)}</strong><button className={inCart ? 'is-added' : ''} onClick={() => cart.add(product)} disabled={product.stock < 1} aria-label={inCart ? `${product.name} در سبد خرید است` : `افزودن ${product.name} به سبد`}>{inCart ? <Check /> : <ShoppingBag />}</button></div>
      </div>
    </article>
  )
}
