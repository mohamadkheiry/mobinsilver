import { useState, type FormEvent } from 'react'
import { CheckCircle2, LockKeyhole } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { api } from '../lib/api'
import { toman } from '../lib/format'

export function CheckoutPage() {
  const { user } = useAuth(); const cart = useCart()
  const [form, setForm] = useState({ customerName: user?.fullName ?? '', phone: user?.phone ?? '', address: user?.address ?? '', paymentMethod: 'پرداخت آنلاین' })
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(''); const [orderNumber, setOrderNumber] = useState('')
  if (!user) return <Navigate to="/login" replace state={{ from: '/checkout' }} />
  if (!cart.items.length && !orderNumber) return <Navigate to="/cart" replace />
  const submit = async (event: FormEvent) => { event.preventDefault(); setSubmitting(true); setError(''); try { const result = await api.createOrder({ ...form, items: cart.items.map(x => ({ productId: x.product.id, quantity: x.quantity })) }); setOrderNumber(result.orderNumber); cart.clear() } catch (e) { setError(e instanceof Error ? e.message : 'ثبت سفارش انجام نشد.') } finally { setSubmitting(false) } }
  if (orderNumber) return <section className="section"><div className="container"><div className="success-state"><CheckCircle2 /><h1>سفارش شما ثبت شد</h1><p>شماره سفارش <b>{orderNumber}</b> است. نتیجهٔ بررسی از داشبورد کاربری در دسترس شماست.</p><Link className="button button--emerald" to="/dashboard">مشاهده داشبورد</Link></div></div></section>
  return <section className="checkout-page section"><div className="container"><div className="page-title-row"><div><span>تسویه‌حساب</span><h1>اطلاعات ارسال و پرداخت</h1></div><LockKeyhole /></div><form className="checkout-layout" onSubmit={submit}><div className="checkout-form"><section><h2>مشخصات تحویل‌گیرنده</h2><div className="form-grid"><label><span>نام و نام خانوادگی</span><input required value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></label><label><span>شماره موبایل</span><input required inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label><label className="full"><span>نشانی کامل</span><textarea required rows={4} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label></div></section><section><h2>روش پرداخت</h2><label className="payment-method"><input type="radio" checked readOnly /><span><b>پرداخت آنلاین امن</b><small>درگاه بانکی شاپرک؛ مناسب کارت‌های عضو شبکه شتاب</small></span></label></section>{error ? <div className="form-error">{error}</div> : null}</div><aside className="order-summary"><h2>سفارش شما</h2>{cart.items.map(item => <div className="mini-order" key={item.product.id}><img src={item.product.imageUrl} alt="" /><span>{item.product.name}<small>{new Intl.NumberFormat('fa-IR').format(item.quantity)} عدد</small></span><b>{toman(item.product.price * item.quantity)}</b></div>)}<div className="order-summary__total"><span>مبلغ نهایی</span><strong>{toman(cart.total)}</strong></div><button className="button button--emerald button--full" disabled={submitting}>{submitting ? 'در حال ثبت...' : 'پرداخت و ثبت سفارش'}</button><p><LockKeyhole /> اطلاعات شما با اتصال امن منتقل می‌شود.</p></aside></form></div></section>
}
