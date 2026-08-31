import { useEffect, useState } from 'react'
import { ArrowLeft, BadgeCheck, BookOpenText, FileCheck2, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { BlogCard } from '../components/BlogCard'
import { api } from '../lib/api'
import type { BlogPost, Product } from '../types'

const categories = [
  { key: 'silver-bar', title: 'شمش نقره', copy: 'شمش‌های نقره با عیار ۹۹۹ از برندهای معتبر', image: '/assets/silver-bar.png' },
  { key: 'silver-jewelry', title: 'زیورآلات نقره', copy: 'ساخته‌های اصیل با کیفیت و طراحی ماندگار', image: '/assets/silver-ring.png' },
  { key: 'gold-bar', title: 'شمش طلا', copy: 'شمش طلای ۲۴ عیار همراه با گواهی اصالت', image: '/assets/gold-bar.png' },
]

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [active, setActive] = useState('all')
  useEffect(() => { Promise.all([api.products('?featured=true'), api.blogPosts()]).then(([nextProducts, nextPosts]) => { setProducts(nextProducts); setPosts(nextPosts) }).catch(() => { setProducts([]); setPosts([]) }) }, [])
  const shown = active === 'all' ? products.slice(0, 4) : products.filter(x => x.category === active).slice(0, 4)
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy"><span className="eyebrow">مبین سیلور • اصالت در هر انتخاب</span><h1>ارزش ماندگار،<br />درخشش اصیل</h1><p>گزیده‌ای از شمش‌های معتبر و زیورآلات نقره با ضمانت اصالت</p><div className="hero__actions"><Link className="button button--emerald" to="/shop">مشاهده محصولات</Link><Link className="button button--ghost-light" to="/guide">راهنمای خرید</Link></div></div>
          <div className="hero__media"><img src="/assets/hero-products.png" alt="شمش نقره، شمش طلا و زیورآلات نقره مبین سیلور" /></div>
        </div>
      </section>

      <section className="category-rail container" aria-label="دسته‌بندی محصولات">
        {categories.map(category => <Link to={`/shop?category=${category.key}`} className="category-panel" key={category.key}><div><h2>{category.title}</h2><p>{category.copy}</p><span>مشاهده مجموعه <ArrowLeft /></span></div><img src={category.image} alt="" /></Link>)}
      </section>

      <section className="section featured-section">
        <div className="container"><div className="section-heading section-heading--center"><h2>منتخب مبین</h2><p>محصولاتی که با دقت برای شما برگزیده‌ایم</p></div>
          <div className="category-tabs" role="tablist">{[
            ['all', 'همه'], ['silver-bar', 'شمش نقره'], ['silver-jewelry', 'زیورآلات'], ['gold-bar', 'شمش طلا']
          ].map(([key, label]) => <button role="tab" aria-selected={active === key} className={active === key ? 'active' : ''} onClick={() => setActive(key)} key={key}>{label}</button>)}</div>
          <div className="product-rail">{shown.length ? shown.map(product => <ProductCard product={product} key={product.id} />) : <div className="loading-line">در حال دریافت محصولات...</div>}</div>
          <div className="center-action"><Link className="text-link" to="/shop">مشاهده همه محصولات <ArrowLeft /></Link></div>
        </div>
      </section>

      <section className="trust-band"><div className="container trust-band__grid"><div className="trust-band__visual"><img src="/assets/silver-bar.png" alt="شمش نقره اصیل" /></div><div className="trust-band__content"><h2>خرید مطمئن فلزات ارزشمند</h2><div className="trust-points"><div><ShieldCheck /><span><strong>ضمانت اصالت</strong><small>تضمین عیار و سلامت کالا</small></span></div><div><FileCheck2 /><span><strong>فاکتور رسمی</strong><small>شفافیت کامل در خرید</small></span></div><div><Truck /><span><strong>ارسال بیمه‌شده</strong><small>بسته‌بندی امن تا مقصد</small></span></div></div></div></div></section>

      <section className="guide-section section"><div className="container guide-section__grid"><div className="guide-visual"><span className="guide-book"><BadgeCheck /><b>راهنمای خرید</b></span><img src="/assets/gold-bar.png" alt="شمش طلا" /></div><div><h2>انتخاب آگاهانه، خرید آسوده</h2><p>در راهنمای خرید مبین سیلور با تفاوت عیارها، شیوهٔ نگهداری و نکات مهم پیش از خرید شمش و زیورآلات آشنا شوید.</p><Link className="button button--outline" to="/guide">مطالعه راهنمای خرید <ArrowLeft /></Link></div></div></section>

      {posts.length ? <section className="section home-journal"><div className="container"><div className="home-journal__heading"><div><span className="eyebrow"><BookOpenText /> مجله مبین</span><h2>دانش ارزشمند، برای انتخابی ماندگار</h2><p>از تشخیص اصالت تا سرمایه‌گذاری و مراقبت؛ راهنماهایی که پیش و پس از خرید کنار شما هستند.</p></div><Link className="text-link" to="/blog">همه مقاله‌ها <ArrowLeft /></Link></div><div className="related-grid">{posts.slice(0, 3).map(post => <BlogCard post={post} key={post.id} />)}</div></div></section> : null}
    </>
  )
}
