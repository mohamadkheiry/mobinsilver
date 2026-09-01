import { useState, type FormEvent } from 'react'
import { Instagram, Mail, MapPin, Phone, Send, ShieldCheck, Truck, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStoreSettings } from '../contexts/StoreContext'
import { api } from '../lib/api'
import { Brand } from './Brand'

export function Footer() {
  const { settings } = useStoreSettings()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const subscribe = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { const result = await api.subscribeNewsletter(email); setMessage(result.message); setEmail('') }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : 'ثبت عضویت انجام نشد.') }
    finally { setBusy(false) }
  }
  return (
    <footer className="footer">
      <div className="container footer__proofs">
        <div><ShieldCheck /><span><strong>ضمانت اصالت کالا</strong><small>کارشناسی عیار و فاکتور رسمی</small></span></div>
        <div><Truck /><span><strong>ارسال امن و بیمه‌شده</strong><small>به سراسر ایران</small></span></div>
        <div><BadgeCheck /><span><strong>مشاوره تخصصی</strong><small>پیش از خرید فلزات ارزشمند</small></span></div>
      </div>
      <div className="container newsletter-band"><div><h2>از بازار فلزات ارزشمند جا نمانید</h2><p>راهنماهای تخصصی و خبرهای مهم فروشگاه را با فاصله زمانی مناسب دریافت کنید.</p></div><form onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">ایمیل خبرنامه</label><input id="newsletter-email" type="email" dir="ltr" required value={email} onChange={event => setEmail(event.target.value)} placeholder="email@example.com" /><button className="button button--emerald" disabled={busy}>{busy ? 'در حال ثبت...' : 'عضویت'}</button>{message ? <span role="status">{message}</span> : null}</form></div>
      <div className="container footer__grid">
        <div className="footer__brand"><Brand light /><p>مقصدی مطمئن برای خرید شمش‌های معتبر و زیورآلات نقره، با تعهد به اصالت و تجربهٔ خرید شفاف.</p><div className="socials"><Instagram /><Send /></div></div>
        <div><h3>دسترسی سریع</h3><Link to="/shop?category=silver-bar">شمش نقره</Link><Link to="/shop?category=gold-bar">شمش طلا</Link><Link to="/shop?category=silver-jewelry">زیورآلات نقره</Link><Link to="/shop">همه محصولات</Link></div>
        <div><h3>راهنما و پشتیبانی</h3><Link to="/blog">مجله مبین</Link><Link to="/guide">راهنمای خرید</Link><Link to="/dashboard">پیگیری سفارش</Link><Link to="/about">درباره ما</Link><Link to="/terms">شرایط و قوانین</Link></div>
        <div><h3>تماس با ما</h3><p><Phone /> {settings.supportPhone}</p><p><Mail /> {settings.supportEmail}</p><p><MapPin /> {settings.address}</p></div>
      </div>
      <div className="container footer__bottom"><span>© ۱۴۰۵ {settings.storeName}؛ تمامی حقوق محفوظ است.</span><span>ثبت سفارش شفاف و پرداخت پس از تأیید نهایی</span></div>
    </footer>
  )
}
