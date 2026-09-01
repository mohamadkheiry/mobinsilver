import type { AuthResponse, BlogPost, BlogPostPayload, CustomerSummary, DashboardStats, Order, Product, StoreSettings, User } from '../types'

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
  storeSettings: () => request<StoreSettings>('/api/store/settings'),
  subscribeNewsletter: (email: string) => request<{ message: string }>('/api/newsletter', {
    method: 'POST', body: JSON.stringify({ email }),
  }),
  products: (params = '') => request<Product[]>(`/api/products${params}`),
  product: (slug: string) => request<Product>(`/api/products/${slug}`),
  blogPosts: (params = '') => request<BlogPost[]>(`/api/blog${params}`),
  blogPost: (slug: string) => request<BlogPost>(`/api/blog/${slug}`),
  login: (username: string, password: string) => request<AuthResponse>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  register: (body: { fullName: string; email: string; password: string; phone?: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  profile: () => request<User>('/api/account/profile'),
  updateProfile: (body: { fullName: string; phone: string; address: string }) =>
    request<{ message: string }>('/api/account/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/api/account/password', { method: 'PUT', body: JSON.stringify(body) }),
  myOrders: () => request<Order[]>('/api/account/orders'),
  cancelOrder: (id: number) => request<Order>(`/api/account/orders/${id}/cancel`, { method: 'PATCH' }),
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
  adminBlog: () => request<BlogPost[]>('/api/admin/blog'),
  createBlogPost: (body: BlogPostPayload) => request<BlogPost>('/api/admin/blog', {
    method: 'POST', body: JSON.stringify(body),
  }),
  updateBlogPost: (id: number, body: BlogPostPayload) => request<BlogPost>(`/api/admin/blog/${id}`, {
    method: 'PUT', body: JSON.stringify(body),
  }),
  deleteBlogPost: (id: number) => request<void>(`/api/admin/blog/${id}`, { method: 'DELETE' }),
  adminSettings: () => request<StoreSettings>('/api/admin/settings'),
  updateSettings: (body: StoreSettings) => request<StoreSettings>('/api/admin/settings', {
    method: 'PUT', body: JSON.stringify(body),
  }),
}
