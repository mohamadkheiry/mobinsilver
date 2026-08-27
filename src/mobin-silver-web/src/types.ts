export type Category = 'silver-bar' | 'silver-jewelry' | 'gold-bar'

export interface Product {
  id: number
  name: string
  slug: string
  category: Category
  description: string
  price: number
  imageUrl: string
  stock: number
  purity: string
  weight: string
  featured: boolean
  createdAt: string
}

export interface User {
  id: number
  username: string
  fullName: string
  email: string
  phone: string
  address: string
  role: 'Admin' | 'Customer'
}

export interface AuthResponse { token: string; user: User }

export interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: number
  orderNumber: string
  userId: number
  total: number
  status: string
  customerName: string
  phone: string
  address: string
  paymentMethod: string
  createdAt: string
  items: OrderItem[]
}

export interface DashboardStats {
  salesToday: number
  newOrders: number
  lowStock: number
  activeCustomers: number
  silverPrice: number
  goldPrice: number
  chart: Array<{ date: string; total: number }>
}

export interface CustomerSummary {
  id: number
  fullName: string
  email: string
  phone: string
  createdAt: string
  orders: number
}
