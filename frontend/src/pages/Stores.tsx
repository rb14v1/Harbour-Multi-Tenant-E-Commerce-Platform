import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Mail, MapPin, Store } from 'lucide-react'
import { api } from '../lib/api'
import { asList, errMsg } from '../lib/utils'
import type { Tenant } from '../lib/types'
import { useAuth } from '../store/auth'
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Spinner, useToast } from '../components/ui'

export default function Stores() {
  const { user, isVendorSide, joinStore, selectTenant, tenantId } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  const stores = useQuery({
    queryKey: ['public-tenants'],
    queryFn: async () => asList((await api.get<Tenant[]>('/tenants/public/')).data),
  })

  const enter = async (t: Tenant) => {
    if (!user) return nav('/login', { state: { from: '/stores' } })
    setBusy(t.id)
    try {
      await joinStore(t)
      nav('/shop')
    } catch (e) {
      toast(errMsg(e), 'err')
    } finally {
      setBusy(null)
    }
  }

  const list = (stores.data ?? []).filter((t) =>
    `${t.name} ${t.subdomain}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Browse stores" subtitle="Pick a store to start shopping." />
      <div className="mb-6 max-w-sm"><Input placeholder="Search stores" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {stores.isLoading ? <Spinner /> : stores.isError ? (
        <ErrorState message={errMsg(stores.error)} onRetry={() => stores.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="No stores found" hint="Try a different search, or open the first store yourself."
          action={<Link to="/register/vendor"><Button>Open a store</Button></Link>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <Card key={t.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600"><Store className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{t.name}</h3>
                  <p className="truncate text-xs text-slate-500">{t.subdomain}</p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" /> <span className="line-clamp-1">{t.address}</span></p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Mail className="h-4 w-4 shrink-0" /> {t.contact_email}</p>
              <div className="mt-5 flex-1" />
              {isVendorSide && tenantId === t.id ? (
                <Link to="/app"><Button variant="secondary" className="w-full">Open console</Button></Link>
              ) : isVendorSide ? (
                <Button variant="secondary" className="w-full" disabled>Vendor account</Button>
              ) : (
                <Button loading={busy === t.id} className="w-full" onClick={() => (tenantId === t.id ? (selectTenant(t.id, 'customer'), nav('/shop')) : enter(t))}>
                  {tenantId === t.id ? 'Continue shopping' : user ? 'Join & shop' : 'Sign in to shop'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
