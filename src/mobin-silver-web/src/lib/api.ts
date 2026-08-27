import type { AuthResponse, CustomerSummary, DashboardStats, Order, Product, User } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mobin-silver-token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'خطایی رخ داده است.' }))
    throw new Error(payload.message ?? 'خطایی رخ داده است.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  products: (params = '') => request<Product[]>(`/api/products${params}`),
  product: (slug: string) => request<Product>(`/api/products/${slug}`),
  login: (username: string, password: string) => request<AuthResponse>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  register: (body: { fullName: string; email: string; password: string; phone?: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  profile: () => request<User>('/api/account/profile'),
  updateProfile: (body: { fullName: string; phone: string; address: string }) =>
    request<{ message: string }>('/api/account/profile', { method: 'PUT', body: JSON.stringify(body) }),
  myOrders: () => request<Order[]>('/api/account/orders'),
  createOrder: (body: { customerName: string; phone: string; address: string; paymentMethod: string; items: Array<{ productId: number; quantity: number }> }) =>
    request<{ id: number; orderNumber: string; total: number; status: string }>('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  adminStats: () => request<DashboardStats>('/api/admin/dashboard'),
  adminOrders: () => request<Order[]>('/api/admin/orders'),
  customers: () => request<CustomerSummary[]>('/api/admin/customers'),
  updateOrderStatus: (id: number, status: string) => request<Order>(`/api/admin/orders/${id}/status`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  }),
  createProduct: (body: Omit<Product, 'id' | 'createdAt'>) => request<Product>('/api/admin/products', {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateProduct: (id: number, body: Omit<Product, 'id' | 'createdAt'>) => request<Product>(`/api/admin/products/${id}`, {
    method: 'PUT', body: JSON.stringify(body),
  }),
  deleteProduct: (id: number) => request<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),
}
