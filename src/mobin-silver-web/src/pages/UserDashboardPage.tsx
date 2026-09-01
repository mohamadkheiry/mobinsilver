import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowLeft, Check, ChevronLeft, CircleUserRound, Heart, Home, LockKeyhole, LogOut, MapPin, Menu, PackageCheck, Settings2, ShoppingBag, Store, Truck, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { api } from '../lib/api'
import { persianDate, toman } from '../lib/format'
import type { Order } from '../types'

type UserView = 'overview' | 'orders' | 'favorites' | 'addresses' | 'profile' | 'security'
const navItems: Array<{ id: UserView; label: string; icon: typeof Home }> = [
  { id: 'overview', label: 'نمای کلی', icon: Home }, { id: 'orders', label: 'سفارش‌های من', icon: ShoppingBag },
  { id: 'favorites', label: 'علاقه‌مندی‌ها', icon: Heart }, { id: 'addresses', label: 'نشانی تحویل', icon: MapPin },
  { id: 'profile', label: 'اطلاعات حساب', icon: CircleUserRound },
  { id: 'security', label: 'امنیت و رمز عبور', icon: LockKeyhole },
]

export function UserDashboardPage() {
  const [view, setView] = useState<UserView>('overview'); const [orders, setOrders] = useState<Order[]>([]); const [mobileOpen, setMobileOpen] = useState(false)
  const [message, setMessage] = useState(''); const [error, setError] = useState(''); const { user, logout, refreshProfile } = useAuth(); const favorites = useFavorites(); const navigate = useNavigate()
  const [profile, setProfile] = useState({ fullName: user?.fullName ?? '', phone: user?.phone ?? '', address: user?.address ?? '' })
  const loadOrders = useCallback(async () => { setError(''); try { setOrders(await api.myOrders()) } catch (reason) { setError(reason instanceof Error ? reason.message : 'سفارش‌ها دریافت نشد.') } }, [])
  useEffect(() => { void loadOrders() }, [loadOrders])
  useEffect(() => { setProfile({ fullName: user?.fullName ?? '', phone: user?.phone ?? '', address: user?.address ?? '' }) }, [user])
  useEffect(() => { if (!mobileOpen) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false) }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close) }, [mobileOpen])
  const latest = orders[0]
  const logoutNow = () => { logout(); navigate('/') }
  const saveProfile = async (event: FormEvent) => { event.preventDefault(); setError(''); try { const result = await api.updateProfile(profile); await refreshProfile(); setMessage(result.message); setTimeout(() => setMessage(''), 2500) } catch (reason) { setError(reason instanceof Error ? reason.message : 'اطلاعات حساب ذخیره نشد.') } }
  const selectView = (next: UserView) => { setView(next); setMobileOpen(false); setError(''); setMessage('') }
  return <div className="customer-dashboard" dir="rtl"><aside className={`customer-sidebar ${mobileOpen ? 'is-open' : ''}`}><button className="customer-close" onClick={() => setMobileOpen(false)} aria-label="بستن منوی حساب"><X /></button><Brand light /><nav>{navItems.map(item => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => selectView(item.id)}><item.icon /><span>{item.label}</span></button>)}</nav><button className="logout-link" onClick={logoutNow}><LogOut /> خروج</button></aside>{mobileOpen ? <button className="dashboard-backdrop" onClick={() => setMobileOpen(false)} aria-label="بستن منوی حساب" /> : null}<div className="customer-workspace"><header className="dashboard-topbar"><button className="customer-menu" onClick={() => setMobileOpen(true)} aria-label="باز کردن منوی حساب"><Menu /></button><Link to="/"><Store /> بازگشت به فروشگاه</Link><div><span>{user?.fullName}</span><CircleUserRound /></div></header><main className="customer-main">{error ? <div className="dashboard-alert" role="alert"><AlertTriangle /> {error}</div> : null}{view === 'overview' ? <>
    <div className="dashboard-greeting"><div><h1>سلام، {user?.fullName?.split(' ')[0]}</h1><p>از اینجا می‌توانید سفارش‌ها و اطلاعات حساب خود را مدیریت کنید.</p></div><Link className="button button--gold-outline" to="/shop">ادامه خرید <ShoppingBag /></Link></div>
    {latest ? <LatestOrder order={latest} /> : <div className="dashboard-empty">هنوز سفارشی ثبت نکرده‌اید.</div>}
    <div className="customer-overview-grid"><section className="dashboard-panel"><div className="panel-title"><h2>سفارش‌های اخیر</h2><ShoppingBag /></div>{orders.slice(0, 3).map(order => <button className="order-list-row" key={order.id} onClick={() => setView('orders')}><span><b>{order.orderNumber}</b><small>{persianDate(order.createdAt)}</small></span><strong>{toman(order.total)}</strong><em className={`status status--${order.status.includes('ارسال') ? 'success' : 'warning'}`}>{order.status}</em><ChevronLeft /></button>)}<button className="panel-link" onClick={() => setView('orders')}>مشاهده همه سفارش‌ها <ArrowLeft /></button></section>
      <section className="dashboard-panel"><div className="panel-title"><h2>علاقه‌مندی‌ها</h2><Heart /></div><div className="favorite-mini-rail">{favorites.items.slice(0, 3).map(product => <Link to={`/product/${product.slug}`} key={product.id}><img src={product.imageUrl} alt={product.name} /><b>{product.name}</b><small>{toman(product.price)}</small></Link>)}{favorites.items.length === 0 ? <p className="panel-empty">محصولی به علاقه‌مندی‌ها اضافه نشده است.</p> : null}</div><button className="panel-link" onClick={() => setView('favorites')}>مشاهده علاقه‌مندی‌ها <ArrowLeft /></button></section>
      <section className="dashboard-panel address-panel"><div className="panel-title"><h2>نشانی پیش‌فرض</h2><MapPin /></div><b>{user?.fullName}</b><p>{user?.address || 'هنوز نشانی ثبت نشده است.'}</p><span>{user?.phone}</span><button className="button button--gold-outline" onClick={() => setView('addresses')}>ویرایش نشانی</button></section></div>
  </> : null}
  {view === 'orders' ? <DashboardOrders orders={orders} reload={loadOrders} /> : null}
  {view === 'favorites' ? <DashboardFavorites /> : null}
  {view === 'addresses' || view === 'profile' ? <section className="account-editor"><div className="panel-title"><div><h1>{view === 'addresses' ? 'نشانی تحویل' : 'اطلاعات حساب'}</h1><p>اطلاعات تماس و نشانی پیش‌فرض خود را به‌روز کنید.</p></div>{view === 'addresses' ? <MapPin /> : <Settings2 />}</div><form onSubmit={saveProfile}><label><span>نام و نام خانوادگی</span><input autoComplete="name" minLength={3} value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })} required /></label><label><span>شماره موبایل</span><input autoComplete="tel" inputMode="tel" pattern="09[0-9]{9}" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} required /></label><label className="full"><span>نشانی کامل</span><textarea autoComplete="street-address" minLength={10} rows={5} value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} required /></label><button className="button button--emerald">ذخیره تغییرات</button>{message ? <span className="save-message" role="status"><Check /> {message}</span> : null}</form></section> : null}
  {view === 'security' ? <PasswordEditor /> : null}
  </main></div></div>
}

function LatestOrder({ order }: { order: Order }) {
  const steps = ['ثبت سفارش', 'تأیید پرداخت', 'آماده‌سازی', 'ارسال', 'تحویل']
  const active = order.status.includes('تحویل') ? 4 : order.status.includes('ارسال') ? 3 : order.status.includes('آماده') ? 2 : order.status.includes('پرداخت') ? 1 : 0
  const cancelled = order.status.includes('لغو')
  return <section className={`latest-order ${cancelled ? 'is-cancelled' : ''}`}><div className="latest-order__side"><ShoppingBag /><span>شماره سفارش</span><b>{order.orderNumber}</b><span>تاریخ ثبت سفارش</span><strong>{persianDate(order.createdAt)}</strong><span>مبلغ</span><strong className="gold-text">{toman(order.total)}</strong></div><div className="latest-order__main"><h2>آخرین سفارش</h2><div className="order-progress">{steps.map((step, index) => <div className={!cancelled && index <= active ? 'done' : ''} key={step}><span>{!cancelled && index < active ? <Check /> : index === 3 ? <Truck /> : index + 1}</span><b>{step}</b></div>)}</div><p>{cancelled ? 'این سفارش لغو شده و موجودی کالاها به فروشگاه بازگشته است.' : `سفارش شما اکنون در وضعیت «${order.status}» قرار دارد.`}</p></div></section>
}

function DashboardOrders({ orders, reload }: { orders: Order[]; reload: () => Promise<void> }) {
  const [expanded, setExpanded] = useState<number | null>(orders[0]?.id ?? null); const [busy, setBusy] = useState<number | null>(null); const [error, setError] = useState('')
  const cancel = async (order: Order) => { if (!window.confirm(`سفارش «${order.orderNumber}» لغو شود؟`)) return; setBusy(order.id); setError(''); try { await api.cancelOrder(order.id); await reload() } catch (reason) { setError(reason instanceof Error ? reason.message : 'لغو سفارش انجام نشد.') } finally { setBusy(null) } }
  return <section className="dashboard-list-page"><div className="panel-title"><div><h1>سفارش‌های من</h1><p>تاریخچه، جزئیات و وضعیت همه سفارش‌ها</p></div><PackageCheck /></div>{error ? <div className="dashboard-alert" role="alert"><AlertTriangle /> {error}</div> : null}{orders.map(order => <article className="order-history" key={order.id}><button onClick={() => setExpanded(expanded === order.id ? null : order.id)} aria-expanded={expanded === order.id}><span><b>{order.orderNumber}</b><small>{persianDate(order.createdAt)}</small></span><strong>{toman(order.total)}</strong><em className={`status status--${order.status.includes('لغو') ? 'danger' : order.status.includes('ارسال') || order.status.includes('تحویل') ? 'success' : 'warning'}`}>{order.status}</em><ChevronLeft /></button>{expanded === order.id ? <div className="order-history__details">{order.items.map(item => <div key={item.id}><span>{item.productName}</span><span>{new Intl.NumberFormat('fa-IR').format(item.quantity)} عدد</span><strong>{toman(item.unitPrice * item.quantity)}</strong></div>)}<p><MapPin /> {order.address}</p>{order.status === 'در انتظار بررسی' ? <button className="button button--danger-outline" disabled={busy === order.id} onClick={() => void cancel(order)}>{busy === order.id ? 'در حال لغو...' : 'لغو سفارش'}</button> : null}</div> : null}</article>)}{!orders.length ? <p className="panel-empty">هنوز سفارشی ثبت نکرده‌اید.</p> : null}</section>
}

function DashboardFavorites() {
  const favorites = useFavorites(); const cartItems = useMemo(() => favorites.items, [favorites.items])
  return <section className="dashboard-list-page"><div className="panel-title"><div><h1>علاقه‌مندی‌ها</h1><p>محصولاتی که برای بعد ذخیره کرده‌اید</p></div><Heart /></div><div className="dashboard-favorites">{cartItems.map(product => <Link to={`/product/${product.slug}`} key={product.id}><img src={product.imageUrl} alt={product.name} /><div><b>{product.name}</b><span>{toman(product.price)}</span></div><ChevronLeft /></Link>)}{!cartItems.length ? <p className="panel-empty">هنوز محصولی به این فهرست اضافه نشده است.</p> : null}</div></section>
}

function PasswordEditor() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setMessage(''); setError(''); if (form.newPassword !== form.confirmPassword) { setError('تکرار رمز عبور با رمز جدید یکسان نیست.'); return } setBusy(true); try { const result = await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }); setMessage(result.message); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) } catch (reason) { setError(reason instanceof Error ? reason.message : 'رمز عبور تغییر نکرد.') } finally { setBusy(false) } }
  return <section className="account-editor password-editor"><div className="panel-title"><div><h1>امنیت و رمز عبور</h1><p>برای امنیت حساب، از یک رمز منحصربه‌فرد با حداقل ۸ نویسه استفاده کنید.</p></div><LockKeyhole /></div><form onSubmit={submit}><label className="full"><span>رمز عبور فعلی</span><input autoComplete="current-password" type="password" required minLength={8} value={form.currentPassword} onChange={event => setForm({ ...form, currentPassword: event.target.value })} /></label><label><span>رمز عبور جدید</span><input autoComplete="new-password" type="password" required minLength={8} value={form.newPassword} onChange={event => setForm({ ...form, newPassword: event.target.value })} /></label><label><span>تکرار رمز جدید</span><input autoComplete="new-password" type="password" required minLength={8} value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} /></label>{error ? <div className="form-error full" role="alert">{error}</div> : null}<button className="button button--emerald" disabled={busy}>{busy ? 'در حال ذخیره...' : 'تغییر رمز عبور'}</button>{message ? <span className="save-message" role="status"><Check /> {message}</span> : null}</form></section>
}
