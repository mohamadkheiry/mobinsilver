import { Instagram, Mail, MapPin, Phone, Send, ShieldCheck, Truck, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from './Brand'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__proofs">
        <div><ShieldCheck /><span><strong>ضمانت اصالت کالا</strong><small>کارشناسی عیار و فاکتور رسمی</small></span></div>
        <div><Truck /><span><strong>ارسال امن و بیمه‌شده</strong><small>به سراسر ایران</small></span></div>
        <div><BadgeCheck /><span><strong>مشاوره تخصصی</strong><small>پیش از خرید فلزات ارزشمند</small></span></div>
      </div>
      <div className="container footer__grid">
        <div className="footer__brand"><Brand light /><p>مقصدی مطمئن برای خرید شمش‌های معتبر و زیورآلات نقره، با تعهد به اصالت و تجربهٔ خرید شفاف.</p><div className="socials"><Instagram /><Send /></div></div>
        <div><h3>دسترسی سریع</h3><Link to="/shop?category=silver-bar">شمش نقره</Link><Link to="/shop?category=gold-bar">شمش طلا</Link><Link to="/shop?category=silver-jewelry">زیورآلات نقره</Link><Link to="/shop">همه محصولات</Link></div>
        <div><h3>راهنما و پشتیبانی</h3><Link to="/guide">راهنمای خرید</Link><Link to="/dashboard">پیگیری سفارش</Link><Link to="/about">درباره ما</Link><Link to="/terms">شرایط و قوانین</Link></div>
        <div><h3>تماس با ما</h3><p><Phone /> ۰۲۱-۹۱۰۰۰۰۰۰</p><p><Mail /> info@mobinsilver.ir</p><p><MapPin /> تهران، خیابان ولیعصر</p></div>
      </div>
      <div className="container footer__bottom"><span>© ۱۴۰۵ مبین سیلور؛ تمامی حقوق محفوظ است.</span><span>پرداخت امن با درگاه بانکی</span></div>
    </footer>
  )
}
