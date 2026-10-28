import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react'
import { api, storage } from '../lib/api'
import type { Role, Tenant, User } from '../lib/types'

interface AuthState {
  user: User | null
  role: Role | null
  tenantId: number | null
  isVendorSide: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  selectTenant: (tenantId: number, role: Role) => void
  registerCustomer: (data: Record<string, string>) => Promise<void>
  registerVendor: (data: Record<string, unknown>) => Promise<void>
  joinStore: (tenant: Tenant) => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

function read<T>(k: string): T | null {
  try { return JSON.parse(localStorage.getItem(k) ?? 'null') } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (storage.access ? read<User>('user') : null))
  const [role, setRole] = useState<Role | null>(() => read<Role>('role'))
  const [tenantId, setTenantId] = useState<number | null>(() =>
    storage.tenantId ? Number(storage.tenantId) : null)

  const selectTenant = useCallback((id: number, r: Role) => {
    storage.setTenantId(id)
    localStorage.setItem('role', JSON.stringify(r))
    setTenantId(id)
    setRole(r)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    storage.clear()
    const { data } = await api.post('/auth/login/', { email, password })
    storage.setTokens(data.access, data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    if (data.tenant) selectTenant(data.tenant.id, data.tenant.role)
    else { setTenantId(null); setRole(null) }
    return data.user as User
  }, [selectTenant])

  const logout = useCallback(() => {
    storage.clear()
    setUser(null); setRole(null); setTenantId(null)
  }, [])

  const registerCustomer = useCallback(async (d: Record<string, string>) => {
    await api.post('/auth/register/', d)
  }, [])

  const registerVendor = useCallback(async (d: Record<string, unknown>) => {
    await api.post('/auth/register/vendor/', d)
  }, [])

  const joinStore = useCallback(async (t: Tenant) => {
    await api.post('/auth/register/join-store/', { tenant_id: t.id })
    selectTenant(t.id, 'customer')
  }, [selectTenant])

  const value = useMemo<AuthState>(() => ({
    user, role, tenantId,
    isVendorSide: role === 'store_owner' || role === 'staff',
    login, logout, selectTenant, registerCustomer, registerVendor, joinStore,
  }), [user, role, tenantId, login, logout, selectTenant, registerCustomer, registerVendor, joinStore])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
