import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, DollarSign, Package, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, dateFmt, errMsg, money } from '../../lib/utils'
import type { Order, TenantStats } from '../../lib/types'
import { useAuth } from '../../store/auth'
import { Card, EmptyState, ErrorState, PageHeader, Spinner, StatusBadge } from '../../components/ui'

export default function Dashboard() {
  const { tenantId, user } = useAuth()
  const stats = useQuery({
    queryKey: ['stats', tenantId],
    queryFn: async () => (await api.get<TenantStats>(`/tenants/${tenantId}/stats`)).data,
  })
  const orders = useQuery({
    queryKey: ['orders', tenantId, 'recent'],
    queryFn: async () => asList((await api.get<Order[]>('/orders/', { params: { ordering: '-created_at' } })).data).slice(0, 6),
  })

  if (stats.isLoading) return <Spinner />
  if (stats.isError) return <ErrorState message={errMsg(stats.error)} onRetry={() => stats.refetch()} />
  const s = stats.data!

  const cards = [
    { label: 'Revenue', value: money(s.revenue), sub: 'Delivered orders', icon: DollarSign, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Orders', value: s.total_orders, sub: `${s.pending_orders} open`, icon: ClipboardList, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Products', value: s.total_products, sub: `${s.active_products} active`, icon: Package, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Customers', value: s.total_customers, sub: `${s.total_staff} staff`, icon: Users, tone: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <>
      <PageHeader title={`Hello, ${user?.first_name || 'there'}`} subtitle="Here is how your store is doing." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{c.label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${c.tone}`}><c.icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{c.value}</p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold">Recent orders</h2>
          <Link to="/app/orders" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
        </div>
        {orders.isLoading ? <Spinner /> : !orders.data?.length ? (
          <EmptyState title="No orders yet" hint="Orders appear here as customers check out." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.data.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium">{o.order_number}</p>
                  <p className="truncate text-xs text-slate-500">{o.customer_name} · {dateFmt(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} />
                <p className="w-24 text-right font-medium">{money(o.total_amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
