import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
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
  const dashboard = user?.role === 'Admin' ? '/admin' : user ? '/dashboard' : '/login'
  return (
    <>
      <div className="blessing-bar">بسم الله الرحمن الرحیم <span>•</span> إِنَّا فَتَحْنَا لَكَ فَتْحًا مُبِينًا</div>
      <header className="site-header">
        <div className="container header__inner">
          <Brand />
          <nav className={`main-nav ${open ? 'main-nav--open' : ''}`} aria-label="ناوبری اصلی">
            <button className="icon-button nav-close" onClick={() => setOpen(false)} aria-label="بستن منو"><X /></button>
            {links.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setOpen(false)}>{link.label}</NavLink>)}
          </nav>
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
