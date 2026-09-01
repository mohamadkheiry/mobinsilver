import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpenText, CalendarDays, Clock3, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BlogCard } from '../components/BlogCard'
import { api } from '../lib/api'
import { persianDate } from '../lib/format'
import type { BlogPost } from '../types'

const categories = ['همه مطالب', 'راهنمای خرید', 'دانش نقره', 'سرمایه‌گذاری', 'نگهداری و مراقبت']

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [category, setCategory] = useState('همه مطالب')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredSearch = useDeferredValue(search.trim())

  const load = () => { setLoading(true); setError(''); api.blogPosts().then(setPosts).catch(reason => { setPosts([]); setError(reason instanceof Error ? reason.message : 'مقاله‌ها دریافت نشدند.') }).finally(() => setLoading(false)) }
  useEffect(load, [])
  const featured = posts.find(post => post.featured) ?? posts[0]
  const shown = useMemo(() => posts.filter(post => {
    const categoryMatch = category === 'همه مطالب' || post.category === category
    const searchMatch = !deferredSearch || `${post.title} ${post.excerpt} ${post.tags}`.includes(deferredSearch)
    const isDefaultView = category === 'همه مطالب' && !deferredSearch
    return categoryMatch && searchMatch && (!isDefaultView || post.id !== featured?.id)
  }), [posts, category, deferredSearch, featured?.id])

  return <main className="blog-index">
    <section className="blog-hero"><div className="container blog-hero__heading"><span className="eyebrow"><BookOpenText /> دانش، انتخاب، ماندگاری</span><h1>مجله مبین</h1><p>راهنماهای تخصصی و خواندنی برای شناخت نقره و طلا، انتخاب آگاهانه و نگهداری اصولی.</p><label className="blog-search" aria-label="جستجو در مجله"><Search /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جستجو در مقاله‌ها..." /></label></div>
      {featured && !search && category === 'همه مطالب' ? <div className="container blog-featured"><div className="blog-featured__copy"><span className="blog-kicker">مقاله ویژه • {featured.category}</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><div className="blog-meta"><span><CalendarDays /> {persianDate(featured.publishedAt ?? featured.createdAt)}</span><span><Clock3 /> {new Intl.NumberFormat('fa-IR').format(featured.readingMinutes)} دقیقه مطالعه</span></div><Link className="button button--gold-outline" to={`/blog/${featured.slug}`}>مطالعه مقاله <ArrowLeft /></Link></div><Link className="blog-featured__media" to={`/blog/${featured.slug}`}><img src={featured.coverImageUrl} alt={featured.title} /></Link></div> : null}
    </section>

    <section className="section blog-list-section"><div className="container"><div className="blog-filter" role="tablist" aria-label="دسته‌بندی مقاله‌ها">{categories.map(item => <button role="tab" aria-selected={item === category} className={item === category ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      <div className="blog-list-heading"><div><span>تازه‌های مجله</span><h2>{category === 'همه مطالب' ? 'آخرین مقاله‌ها' : category}</h2></div><small>{new Intl.NumberFormat('fa-IR').format(shown.length)} مطلب</small></div>
      {loading ? <div className="blog-empty" role="status">در حال دریافت مقاله‌ها...</div> : error ? <div className="blog-empty" role="alert"><BookOpenText /><h2>دریافت مقاله‌ها ممکن نشد</h2><p>{error}</p><button className="button button--emerald" onClick={load}>تلاش دوباره</button></div> : shown.length ? <div className="blog-magazine-grid">{shown.map((post, index) => <BlogCard key={post.id} post={post} variant={index % 3 === 0 ? 'horizontal' : 'standard'} />)}</div> : <div className="blog-empty"><BookOpenText /><h2>مطلبی پیدا نشد</h2><p>عبارت جستجو یا دسته‌بندی را تغییر دهید.</p></div>}
    </div></section>
  </main>
}
