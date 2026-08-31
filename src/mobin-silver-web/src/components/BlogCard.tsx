import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { persianDate } from '../lib/format'
import type { BlogPost } from '../types'

export function BlogCard({ post, variant = 'standard' }: { post: BlogPost; variant?: 'standard' | 'horizontal' }) {
  const date = post.publishedAt ?? post.createdAt
  return <article className={`blog-card blog-card--${variant}`}>
    <Link className="blog-card__media" to={`/blog/${post.slug}`} aria-label={`مطالعه ${post.title}`}><img src={post.coverImageUrl} alt={post.title} /></Link>
    <div className="blog-card__body"><span className="blog-kicker">{post.category}</span><h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><div className="blog-meta"><span><CalendarDays /> {persianDate(date)}</span><span><Clock3 /> {new Intl.NumberFormat('fa-IR').format(post.readingMinutes)} دقیقه مطالعه</span></div><Link className="blog-read-link" to={`/blog/${post.slug}`}>مطالعه مقاله <ArrowLeft /></Link></div>
  </article>
}
