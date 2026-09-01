import { useEffect, useMemo, useState, useDeferredValue } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { api } from '../lib/api'
import { categoryLabel } from '../lib/format'
import type { Product } from '../types'

export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [error, setError] = useState('')
  const requestedCategory = params.get('category') ?? 'all'
  const category = Object.prototype.hasOwnProperty.call(categoryLabel, requestedCategory) ? requestedCategory : 'all'
  const deferredSearch = useDeferredValue(search)
  useEffect(() => { setLoading(true); setError(''); api.products().then(setProducts).catch(reason => { setProducts([]); setError(reason instanceof Error ? reason.message : 'محصولات دریافت نشد.') }).finally(() => setLoading(false)) }, [])
  useEffect(() => { if (requestedCategory !== category) setParams({}, { replace: true }) }, [category, requestedCategory, setParams])
  const shown = useMemo(() => {
    const normalized = deferredSearch.trim()
    const categoryProducts = category === 'all' ? products : products.filter(product => product.category === category)
    const filtered = normalized ? categoryProducts.filter(x => x.name.includes(normalized) || x.description.includes(normalized)) : categoryProducts
    return [...filtered].sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [products, deferredSearch, sort, category])
  return <section className="shop-page section"><div className="container"><div className="page-heading"><div><span>فروشگاه مبین سیلور</span><h1>{categoryLabel[category]}</h1><p>انتخاب از میان شمش‌ها و زیورآلات کارشناسی‌شده با تضمین اصالت.</p></div><div className="page-heading__ornament" /></div>
    <div className="shop-toolbar"><div className="search-field"><Search /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جستجو در محصولات..." aria-label="جستجوی محصولات" /></div><div className="filter-group"><SlidersHorizontal /><select value={sort} onChange={event => setSort(event.target.value)} aria-label="مرتب‌سازی"><option value="newest">جدیدترین</option><option value="low">کمترین قیمت</option><option value="high">بیشترین قیمت</option></select></div></div>
    <div className="shop-content"><aside className="shop-categories"><h2>دسته‌بندی</h2>{Object.entries(categoryLabel).map(([key, label]) => { const count = key === 'all' ? products.length : products.filter(x => x.category === key).length; return <button className={category === key ? 'active' : ''} key={key} onClick={() => key === 'all' ? setParams({}) : setParams({ category: key })}><span>{label}</span><small>{new Intl.NumberFormat('fa-IR').format(count)}</small></button> })}<div className="auth-note"><b>ضمانت اصالت</b><p>تمام محصولات با فاکتور رسمی و امکان کارشناسی عرضه می‌شوند.</p></div></aside>
      <div className="shop-results"><div className="results-count" aria-live="polite">{new Intl.NumberFormat('fa-IR').format(shown.length)} محصول</div>{loading ? <div className="loading-grid" role="status">در حال دریافت محصولات...</div> : error ? <div className="empty-results" role="alert">{error}</div> : shown.length ? <div className="product-grid">{shown.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-results"><Search /><h2>محصولی پیدا نشد</h2><p>عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p></div>}</div></div>
  </div></section>
}
