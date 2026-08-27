import { PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function EmptyState({ title, description, action = 'مشاهده محصولات' }: { title: string; description: string; action?: string }) {
  return <div className="empty-state"><PackageOpen /><h2>{title}</h2><p>{description}</p><Link className="button button--primary" to="/shop">{action}</Link></div>
}
