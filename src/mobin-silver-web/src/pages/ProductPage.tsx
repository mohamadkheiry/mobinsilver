import { useEffect, useState } from 'react'
import { BadgeCheck, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { api } from '../lib/api'
import { ProductCard } from '../components/ProductCard'
import { categoryLabel, toman } from '../lib/format'
import type { Product } from '../types'

export function ProductPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([]); const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const cart = useCart(); const favorites = useFavorites()
  useEffect(() => { setProduct(null); setError(''); Promise.all([api.product(slug), api.products()]).then(([nextProduct, all]) => { setProduct(nextProduct); setRelated(all.filter(item => item.id !== nextProduct.id && item.category === nextProduct.category).slice(0, 4)) }).catch(reason => setError(reason instanceof Error ? reason.message : 'محصول پیدا نشد.')) }, [slug])
  if (error) return <section className="section"><div className="container empty-results" role="alert"><h1>محصول در دسترس نیست</h1><p>{error}</p><Link className="button button--emerald" to="/shop">بازگشت به فروشگاه</Link></div></section>
  if (!product) return <div className="page-loading" role="status">در حال دریافت محصول...</div>
  const favored = favorites.has(product.id)
  return <section className="product-page section"><div className="container"><nav className="breadcrumbs"><Link to="/">خانه</Link><span>/</span><Link to={`/shop?category=${product.category}`}>{categoryLabel[product.category]}</Link><span>/</span><span>{product.name}</span></nav>
    <div className="product-detail"><div className="product-detail__media"><img src={product.imageUrl} alt={product.name} /><span>تصویر محصول با نورپردازی واقعی</span></div><div className="product-detail__info"><small>{categoryLabel[product.category]}</small><h1>{product.name}</h1><div className="product-code">کد محصول: MS-{new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 4, useGrouping: false }).format(product.id)}</div><p>{product.description}</p><div className="specs"><div><small>عیار</small><strong>{product.purity}</strong></div><div><small>وزن</small><strong>{product.weight}</strong></div><div><small>موجودی</small><strong>{product.stock > 0 ? `${new Intl.NumberFormat('fa-IR').format(product.stock)} عدد` : 'ناموجود'}</strong></div></div><div className="product-price"><span>قیمت امروز</span><strong>{toman(product.price)}</strong><small>قیمت و موجودی هنگام ثبت سفارش دوباره کنترل می‌شود.</small></div><div className="purchase-row"><div className="quantity"><button aria-label="افزایش تعداد" onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}><Plus /></button><span>{new Intl.NumberFormat('fa-IR').format(quantity)}</span><button aria-label="کاهش تعداد" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus /></button></div><button className="button button--emerald grow" disabled={product.stock < 1} onClick={() => cart.add(product, quantity)}>{cart.items.some(item => item.product.id === product.id) ? <><Check /> در سبد خرید</> : <><ShoppingBag /> افزودن به سبد خرید</>}</button><button className={`button square-button ${favored ? 'is-active' : ''}`} onClick={() => favorites.toggle(product)} aria-label={favored ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}><Heart fill={favored ? 'currentColor' : 'none'} /></button></div><div className="detail-assurances"><div><ShieldCheck /> ضمانت اصالت</div><div><BadgeCheck /> فاکتور رسمی</div><div><Truck /> ارسال بیمه‌شده</div></div></div></div>
    {related.length ? <section className="related-products"><div className="section-heading"><h2>محصولات مشابه</h2><p>انتخاب‌های دیگر از همین مجموعه</p></div><div className="product-grid">{related.map(item => <ProductCard product={item} key={item.id} />)}</div></section> : null}
  </div></section>
}
