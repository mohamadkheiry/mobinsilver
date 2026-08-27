import { useEffect, useState } from 'react'
import { BadgeCheck, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { api } from '../lib/api'
import { categoryLabel, toman } from '../lib/format'
import type { Product } from '../types'

export function ProductPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const cart = useCart(); const favorites = useFavorites()
  useEffect(() => { api.product(slug).then(setProduct) }, [slug])
  if (!product) return <div className="page-loading">در حال دریافت محصول...</div>
  const favored = favorites.has(product.id)
  return <section className="product-page section"><div className="container"><nav className="breadcrumbs"><Link to="/">خانه</Link><span>/</span><Link to={`/shop?category=${product.category}`}>{categoryLabel[product.category]}</Link><span>/</span><span>{product.name}</span></nav>
    <div className="product-detail"><div className="product-detail__media"><img src={product.imageUrl} alt={product.name} /></div><div className="product-detail__info"><small>{categoryLabel[product.category]}</small><h1>{product.name}</h1><div className="product-code">کد محصول: MS-{new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 4, useGrouping: false }).format(product.id)}</div><p>{product.description}</p><div className="specs"><div><small>عیار</small><strong>{product.purity}</strong></div><div><small>وزن</small><strong>{product.weight}</strong></div><div><small>موجودی</small><strong>{new Intl.NumberFormat('fa-IR').format(product.stock)} عدد</strong></div></div><div className="product-price"><span>قیمت امروز</span><strong>{toman(product.price)}</strong></div><div className="purchase-row"><div className="quantity"><button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}><Plus /></button><span>{new Intl.NumberFormat('fa-IR').format(quantity)}</span><button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus /></button></div><button className="button button--emerald grow" onClick={() => cart.add(product, quantity)}><ShoppingBag /> افزودن به سبد خرید</button><button className={`button square-button ${favored ? 'is-active' : ''}`} onClick={() => favorites.toggle(product)}><Heart fill={favored ? 'currentColor' : 'none'} /></button></div><div className="detail-assurances"><div><ShieldCheck /> ضمانت اصالت</div><div><BadgeCheck /> فاکتور رسمی</div><div><Truck /> ارسال بیمه‌شده</div></div></div></div>
  </div></section>
}
