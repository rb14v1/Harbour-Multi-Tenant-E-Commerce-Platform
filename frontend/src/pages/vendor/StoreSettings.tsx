import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { asList, errMsg } from '../../lib/utils'
import type { Tenant } from '../../lib/types'
import { useAuth } from '../../store/auth'
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../../components/ui'

export default function StoreSettings() {
  const { tenantId, selectTenant } = useAuth()
  const q = useQuery({
    queryKey: ['my-tenants'],
    queryFn: async () => asList((await api.get<Tenant[]>('/tenants/my/')).data),
  })
  if (q.isLoading) return <Spinner />
  if (q.isError) return <ErrorState message={errMsg(q.error)} onRetry={() => q.refetch()} />
  const t = q.data?.find((x) => x.id === tenantId)
  if (!t) return null

  const rows: [string, string][] = [
    ['Store name', t.name], ['Domain', t.domain], ['Subdomain', t.subdomain],
    ['Contact email', t.contact_email], ['Contact phone', t.contact_phone], ['Address', t.address],
    ['Owner', `${t.owner_name ?? ''} (${t.owner_email ?? ''})`],
  ]

  return (
    <>
      <PageHeader title="Store settings" subtitle="Store profile details. Contact support to change them." />
      <Card>
        <dl className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-5 py-4">
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>{t.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}</dd>
          </div>
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-3">
              <dt className="text-sm text-slate-500">{k}</dt>
              <dd className="text-sm font-medium sm:col-span-2">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {(q.data?.length ?? 0) > 1 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 font-semibold">Switch store</h2>
          <div className="flex flex-wrap gap-2">
            {q.data!.map((x) => (
              <button key={x.id} onClick={() => { selectTenant(x.id, 'store_owner'); location.assign('/app') }}
                className={`rounded-lg border px-3 py-2 text-sm ${x.id === tenantId ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 hover:bg-slate-50'}`}>
                {x.name}
              </button>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
