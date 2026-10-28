import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell, Heart, LayoutDashboard, LogOut, MapPin, Menu, Package, Settings, ShoppingBag,
  ShoppingCart, Store, User as UserIcon, Users, X, ClipboardList,
} from 'lucide-react'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { api } from '../lib/api'
import { cx, asList } from '../lib/utils'
import type { Notification, Tenant } from '../lib/types'

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className={cx('flex items-center gap-2 text-lg font-semibold', light ? 'text-white' : 'text-slate-900')}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><Store className="h-4 w-4" /></span>
      TenantCart
    </span>
  )
}

export function RequireVendor() {
  const { user, isVendorSide, tenantId } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isVendorSide || !tenantId) return <Navigate to="/stores" replace />
  return <VendorLayout />
}

export function RequireCustomer() {
  const { user, tenantId, isVendorSide } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (isVendorSide) return <Navigate to="/app" replace />
  if (!tenantId) return <Navigate to="/stores" replace />
  return <ShopLayout />
}

export function PublicLayout() {
  const { user, isVendorSide, logout } = useAuth()
  const nav = useNavigate()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink to="/stores" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Stores</NavLink>
            {user ? (
              <>
                <Link to={isVendorSide ? '/app' : '/shop'} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
                  {isVendorSide ? 'Console' : 'My store'}
                </Link>
                <button onClick={() => { logout(); nav('/') }} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Sign in</Link>
                <Link to="/register/vendor" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Open a store</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

const vendorNav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/products', label: 'Products', icon: Package },
  { to: '/app/orders', label: 'Orders', icon: ClipboardList },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/settings', label: 'Store settings', icon: Settings },
]

function VendorLayout() {
  const { user, role, tenantId, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const { data: tenants } = useQuery({
    queryKey: ['my-tenants'],
    queryFn: async () => asList((await api.get<Tenant[]>('/tenants/my/')).data),
  })
  const tenant = tenants?.find((t) => t.id === tenantId)

  const side = (
    <div className="flex h-full flex-col bg-slate-900 p-4">
      <div className="mb-8 px-2"><Logo light /></div>
      <div className="mb-6 rounded-lg bg-slate-800 px-3 py-2.5">
        <p className="text-xs uppercase tracking-wide text-slate-400">Store</p>
        <p className="truncate text-sm font-medium text-white">{tenant?.name ?? '...'}</p>
        <p className="text-xs capitalize text-slate-400">{role?.replace('_', ' ')}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {vendorNav.filter((n) => role === 'store_owner' || !['/app/team', '/app/settings'].includes(n.to)).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
              isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800')}>
            <n.icon className="h-4 w-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 pt-4">
        <p className="truncate px-2 text-sm text-slate-300">{user?.email}</p>
        <button onClick={() => { logout(); nav('/') }}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{side}</aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        <Logo />
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8"><Outlet /></main>
    </div>
  )
}

function ShopLayout() {
  const { user, tenantId, logout } = useAuth()
  const { count } = useCart()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const { data: tenants } = useQuery({
    queryKey: ['my-tenants'],
    queryFn: async () => asList((await api.get<Tenant[]>('/tenants/my/')).data),
  })
  const { data: notes } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => asList((await api.get<Notification[]>('/customer/notifications/')).data),
  })
  const unread = notes?.filter((n) => !n.is_read).length ?? 0
  const tenant = tenants?.find((t) => t.id === tenantId)

  const links = [
    { to: '/shop', label: 'Shop', icon: ShoppingBag, end: true },
    { to: '/shop/orders', label: 'Orders', icon: ClipboardList },
    { to: '/shop/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/shop/addresses', label: 'Addresses', icon: MapPin },
    { to: '/shop/profile', label: 'Profile', icon: UserIcon },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <Link to="/shop" className="truncate text-lg font-semibold">{tenant?.name ?? 'Store'}</Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/stores" className="hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:block">Switch store</Link>
            <Link to="/shop/notifications" aria-label="Notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] text-white">{unread}</span>}
            </Link>
            <Link to="/shop/cart" aria-label="Cart" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] text-white">{count}</span>}
            </Link>
            <button onClick={() => { logout(); nav('/') }} aria-label="Sign out" title={user?.email} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-slate-200 bg-white p-2 lg:hidden">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
                <l.icon className="h-4 w-4" /> {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8"><Outlet /></main>
    </div>
  )
}
