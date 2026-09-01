import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Footer } from './Footer'
import { Header } from './Header'

export function StoreLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const titles: Record<string, string> = { '/': 'مبین سیلور | فلزات ارزشمند، انتخابی ماندگار', '/shop': 'فروشگاه نقره و طلا | مبین سیلور', '/blog': 'مجله تخصصی نقره و طلا | مبین سیلور', '/cart': 'سبد خرید | مبین سیلور', '/checkout': 'ثبت سفارش | مبین سیلور', '/about': 'درباره مبین سیلور', '/guide': 'راهنمای خرید نقره و طلا | مبین سیلور', '/terms': 'شرایط و قوانین | مبین سیلور' }
    document.title = titles[pathname] ?? (pathname.startsWith('/product/') ? 'مشخصات محصول | مبین سیلور' : pathname.startsWith('/blog/') ? 'مقاله تخصصی | مبین سیلور' : 'مبین سیلور')
  }, [pathname])
  return <><Header /><main><Outlet /></main><Footer /></>
}
