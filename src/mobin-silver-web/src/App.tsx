import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StoreLayout } from './components/StoreLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { StoreProvider } from './contexts/StoreContext'
import { HomePage } from './pages/HomePage'

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })))
const CartPage = lazy(() => import('./pages/CartPage').then(module => ({ default: module.CartPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then(module => ({ default: module.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(module => ({ default: module.BlogPostPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(module => ({ default: module.CheckoutPage })))
const InfoPage = lazy(() => import('./pages/InfoPage').then(module => ({ default: module.InfoPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })))
const ProductPage = lazy(() => import('./pages/ProductPage').then(module => ({ default: module.ProductPage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then(module => ({ default: module.ShopPage })))
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage').then(module => ({ default: module.UserDashboardPage })))

export default function App() {
  return <BrowserRouter><StoreProvider><AuthProvider><CartProvider><FavoritesProvider><Suspense fallback={<div className="route-loading" role="status"><span /> در حال آماده‌سازی صفحه...</div>}><Routes>
    <Route element={<StoreLayout />}><Route index element={<HomePage />} /><Route path="shop" element={<ShopPage />} /><Route path="product/:slug" element={<ProductPage />} /><Route path="blog" element={<BlogPage />} /><Route path="blog/:slug" element={<BlogPostPage />} /><Route path="cart" element={<CartPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="about" element={<InfoPage />} /><Route path="guide" element={<InfoPage />} /><Route path="terms" element={<InfoPage />} /></Route>
    <Route path="login" element={<LoginPage />} />
    <Route path="dashboard" element={<ProtectedRoute role="Customer"><UserDashboardPage /></ProtectedRoute>} />
    <Route path="admin" element={<ProtectedRoute role="Admin"><AdminDashboardPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></FavoritesProvider></CartProvider></AuthProvider></StoreProvider></BrowserRouter>
}
