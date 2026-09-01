import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useStoreSettings } from '../contexts/StoreContext'
import { Brand } from './Brand'

const links = [
  { to: '/', label: 'فروشگاه' },
  { to: '/shop?category=silver-bar', label: 'شمش نقره' },
  { to: '/shop?category=silver-jewelry', label: 'زیورآلات نقره' },
  { to: '/shop?category=gold-bar', label: 'شمش طلا' },
  { to: '/blog', label: 'مجله' },
  { to: '/about', label: 'درباره ما' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { count } = useCart()
  const { settings } = useStoreSettings()
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location.pathname, location.search])
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', close); document.body.classList.add('nav-is-open')
    return () => { document.removeEventListener('keydown', close); document.body.classList.remove('nav-is-open') }
  }, [open])
  const dashboard = user?.role === 'Admin' ? '/admin' : user ? '/dashboard' : '/login'
  const isActive = (target: string) => {
    const [targetPath, targetQuery = ''] = target.split('?')
    if (target === '/') return location.pathname === '/'
    if (targetPath === '/shop' && targetQuery) return location.pathname === targetPath && location.search === `?${targetQuery}`
    return location.pathname === targetPath && !targetQuery
  }
  return (
    <>
      <div className="blessing-bar">{settings.announcement}</div>
      <header className="site-header">
        <div className="container header__inner">
          <Brand />
          <nav className={`main-nav ${open ? 'main-nav--open' : ''}`} aria-label="ناوبری اصلی">
            <button className="icon-button nav-close" onClick={() => setOpen(false)} aria-label="بستن منو"><X /></button>
            {links.map(link => { const active = isActive(link.to); return <Link key={link.to} to={link.to} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}</Link> })}
          </nav>
          {open ? <button className="nav-backdrop" onClick={() => setOpen(false)} aria-label="بستن منو" /> : null}
          <div className="header__actions">
            <Link className="icon-button hide-mobile" to="/shop" aria-label="جستجوی محصولات"><Search /></Link>
            <Link className="icon-button" to={dashboard} aria-label={user ? 'حساب کاربری' : 'ورود'}><UserRound /></Link>
            <Link className="icon-button cart-button" to="/cart" aria-label={`سبد خرید، ${count} کالا`}><ShoppingBag /><span>{new Intl.NumberFormat('fa-IR').format(count)}</span></Link>
            <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="باز کردن منو"><Menu /></button>
          </div>
        </div>
      </header>
    </>
  )
}
