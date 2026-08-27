import { Link } from 'react-router-dom'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`brand ${light ? 'brand--light' : ''}`} aria-label="مبین سیلور، صفحه اصلی">
      <span className="brand__mark" aria-hidden="true"><i /><b /></span>
      <span><strong>مبین سیلور</strong><small>فلزات ارزشمند، انتخابی ماندگار</small></span>
    </Link>
  )
}
