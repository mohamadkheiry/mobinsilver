import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, Home, Share2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BlogCard } from '../components/BlogCard'
import { api } from '../lib/api'
import { persianDate } from '../lib/format'
import type { BlogPost } from '../types'

const headingId = (index: number) => `section-${index + 1}`

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [related, setRelated] = useState<BlogPost[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    setPost(null); setError(false)
    Promise.all([api.blogPost(slug), api.blogPosts()]).then(([nextPost, allPosts]) => {
      setPost(nextPost)
      setRelated(allPosts.filter(item => item.id !== nextPost.id && item.category === nextPost.category).slice(0, 3))
      document.title = `${nextPost.title} | مبین سیلور`
    }).catch(() => setError(true))
    return () => { document.title = 'مبین سیلور' }
  }, [slug])

  const lines = useMemo(() => post?.content.split('\n').map(line => line.trim()).filter(Boolean) ?? [], [post])
  const headings = useMemo(() => lines.filter(line => line.startsWith('## ')).map((line, index) => ({ title: line.slice(3), id: headingId(index) })), [lines])

  if (error) return <main className="article-state"><h1>مقاله پیدا نشد</h1><p>ممکن است آدرس تغییر کرده باشد یا مقاله هنوز منتشر نشده باشد.</p><Link className="button button--emerald" to="/blog">بازگشت به مجله</Link></main>
  if (!post) return <main className="article-state">در حال آماده‌سازی مقاله...</main>

  let sectionIndex = 0
  return <main className="article-page"><div className="container article-breadcrumb"><Link to="/"><Home /> خانه</Link><span>/</span><Link to="/blog">مجله</Link><span>/</span><b>{post.category}</b></div>
    <header className="container article-header"><span className="blog-kicker">{post.category}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div className="blog-meta"><span><CalendarDays /> {persianDate(post.publishedAt ?? post.createdAt)}</span><span><Clock3 /> {new Intl.NumberFormat('fa-IR').format(post.readingMinutes)} دقیقه مطالعه</span><span>به قلم {post.author}</span></div></header>
    <figure className="container article-cover"><img src={post.coverImageUrl} alt={post.title} /></figure>
    <div className="container article-layout"><aside className="article-toc"><span>در این مقاله</span>{headings.map(heading => <a key={heading.id} href={`#${heading.id}`}>{heading.title}</a>)}<button onClick={() => navigator.clipboard?.writeText(window.location.href)}><Share2 /> اشتراک‌گذاری</button></aside><article className="article-body">{lines.map((line, index) => {
      if (line.startsWith('## ')) { const id = headingId(sectionIndex++); return <h2 id={id} key={`${id}-${index}`}><span>{new Intl.NumberFormat('fa-IR').format(sectionIndex)}</span>{line.slice(3)}</h2> }
      if (line.startsWith('> ')) return <blockquote key={index}>{line.slice(2)}</blockquote>
      return <p key={index}>{line}</p>
    })}<div className="article-author"><span>م</span><div><b>{post.author}</b><p>محتوای آموزشی برای خرید شفاف‌تر و نگهداری بهتر فلزات ارزشمند.</p></div></div></article></div>
    {related.length ? <section className="section related-reading"><div className="container"><div className="blog-list-heading"><div><span>مطالعه بیشتر</span><h2>مقاله‌های مرتبط</h2></div><Link className="text-link" to="/blog">همه مقاله‌ها <ArrowLeft /></Link></div><div className="related-grid">{related.map(item => <BlogCard key={item.id} post={item} />)}</div></div></section> : null}
  </main>
}
