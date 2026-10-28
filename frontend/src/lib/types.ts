export type Role = 'store_owner' | 'staff' | 'customer'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  is_vendor: boolean
}

export interface Tenant {
  id: number
  name: string
  domain: string
  subdomain: string
  contact_email: string
  contact_phone: string
  address: string
  is_active: boolean
  owner_name?: string
  owner_email?: string
}

export interface Product {
  id: number
  tenant: number
  name: string
  description: string
  sku: string
  price: string
  stock_quantity: number
  is_active: boolean
  category: string
  image_url: string
  created_at: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface OrderItem {
  id: number
  product: number
  product_details: Product
  quantity: number
  unit_price: string
  subtotal: string
}

export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  total_amount: string
  shipping_address: string
  billing_address: string
  notes: string
  customer_email: string
  customer_name: string
  staff_name: string | null
  items: OrderItem[]
  created_at: string
}

export interface TenantStats {
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  total_customers: number
  total_staff: number
  revenue: string
}

export interface Member {
  id: number
  user_email: string
  user_name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Address {
  id: number
  address_type: 'shipping' | 'billing' | 'both'
  full_name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  country: string
  postal_code: string
  is_default: boolean
}

export interface WishlistItem {
  id: number
  product: number
  product_details: Product
}

export interface Review {
  id: number
  product: number
  product_name: string
  customer_name: string
  rating: number
  title: string
  comment: string
  is_approved: boolean
  created_at: string
}

export interface Notification {
  id: number
  notification_type: 'order' | 'product' | 'promotion' | 'system'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface CustomerProfile {
  id: number
  user_email: string
  user_first_name: string
  user_last_name: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  loyalty_points: number
  total_spent: string
}

export interface CustomerDashboard {
  customer: CustomerProfile
  stats: {
    total_orders: number
    total_spent: string
    loyalty_points: number
    wishlist_count: number
    unread_notifications: number
  }
  recent_orders: Order[]
}
