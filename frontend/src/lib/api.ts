import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE: string = import.meta.env.VITE_API_URL
if (!BASE) {
  throw new Error('Missing required environment variable: VITE_API_URL. See frontend/.env.example.')
}

export const storage = {
  get access() { return localStorage.getItem('access') },
  get refresh() { return localStorage.getItem('refresh') },
  get tenantId() { return localStorage.getItem('tenantId') },
  setTokens(access: string, refresh?: string) {
    localStorage.setItem('access', access)
    if (refresh) localStorage.setItem('refresh', refresh)
  },
  setTenantId(id: number | null) {
    if (id) localStorage.setItem('tenantId', String(id))
    else localStorage.removeItem('tenantId')
  },
  clear() {
    for (const k of ['access', 'refresh', 'tenantId', 'user', 'role']) localStorage.removeItem(k)
  },
}

export const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const isAuth = cfg.url?.startsWith('/auth/')
  if (storage.access && !isAuth) cfg.headers.Authorization = `Bearer ${storage.access}`
  if (storage.access && cfg.url?.startsWith('/auth/register/join-store')) {
    cfg.headers.Authorization = `Bearer ${storage.access}`
  }
  if (storage.tenantId && !isAuth) cfg.headers['X-Tenant-ID'] = storage.tenantId
  return cfg
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const isAuthCall = original?.url?.startsWith('/auth/login') || original?.url?.startsWith('/auth/refresh')
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall && storage.refresh) {
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${BASE}/auth/refresh/`, { refresh: storage.refresh })
            .then((r) => {
              storage.setTokens(r.data.access, r.data.refresh)
              return r.data.access as string
            })
            .finally(() => { refreshing = null })
        }
        const token = await refreshing
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        storage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
