import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StoreLayout } from './components/StoreLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { InfoPage } from './pages/InfoPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductPage } from './pages/ProductPage'
import { ShopPage } from './pages/ShopPage'
import { UserDashboardPage } from './pages/UserDashboardPage'

export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><FavoritesProvider><Routes>
    <Route element={<StoreLayout />}><Route index element={<HomePage />} /><Route path="shop" element={<ShopPage />} /><Route path="product/:slug" element={<ProductPage />} /><Route path="cart" element={<CartPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="about" element={<InfoPage />} /><Route path="guide" element={<InfoPage />} /><Route path="terms" element={<InfoPage />} /></Route>
    <Route path="login" element={<LoginPage />} />
    <Route path="dashboard" element={<ProtectedRoute role="Customer"><UserDashboardPage /></ProtectedRoute>} />
    <Route path="admin" element={<ProtectedRoute role="Admin"><AdminDashboardPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></FavoritesProvider></CartProvider></AuthProvider></BrowserRouter>
}
