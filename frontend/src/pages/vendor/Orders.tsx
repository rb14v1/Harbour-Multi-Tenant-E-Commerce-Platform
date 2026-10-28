import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { asList, dateFmt, errMsg, money } from '../../lib/utils'
import type { Order, OrderStatus } from '../../lib/types'
import { useAuth } from '../../store/auth'
import { Card, EmptyState, ErrorState, Input, Modal, PageHeader, Select, Spinner, StatusBadge, useToast } from '../../components/ui'

const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function Orders() {
  const qc = useQueryClient()
  const toast = useToast()
  const { role } = useAuth()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Order | null>(null)

  const list = useQuery({
    queryKey: ['orders', status, q],
    queryFn: async () => asList((await api.get<Order[]>('/orders/', {
      params: { status: status || undefined, search: q || undefined, ordering: '-created_at' },
    })).data),
  })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.post<Order>(`/orders/${id}/update_status/`, { status }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setOpen((o) => (o ? { ...o, status: r.data.status } : o))
      toast('Order updated')
    },
    onError: (e) => toast(errMsg(e), 'err'),
  })

  return (
    <>
      <PageHeader title="Orders" subtitle="Track and fulfil customer orders." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search order number or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {list.isLoading ? <Spinner /> : list.isError ? <ErrorState message={errMsg(list.error)} onRetry={() => list.refetch()} /> :
          !list.data?.length ? <EmptyState title="No orders found" hint="Try clearing the filters." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.data.map((o) => (
                    <tr key={o.id} onClick={() => setOpen(o)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium">{o.order_number}</td>
                      <td className="px-5 py-3"><p>{o.customer_name}</p><p className="text-xs text-slate-500">{o.customer_email}</p></td>
                      <td className="px-5 py-3 text-slate-600">{dateFmt(o.created_at)}</td>
                      <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3 text-right font-medium">{money(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `Order ${open.order_number}` : ''}>
        {open && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <div><p className="font-medium">{open.customer_name}</p><p className="text-slate-500">{open.customer_email}</p></div>
              <StatusBadge status={open.status} />
            </div>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {open.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 px-3 py-2.5">
                  <span>{i.quantity} × {i.product_details?.name}</span><span className="font-medium">{money(i.subtotal)}</span>
                </li>
              ))}
              <li className="flex justify-between bg-slate-50 px-3 py-2.5 font-semibold"><span>Total</span><span>{money(open.total_amount)}</span></li>
            </ul>
            <div><p className="mb-1 font-medium">Shipping address</p><p className="whitespace-pre-line text-slate-600">{open.shipping_address}</p></div>
            {open.notes && <div><p className="mb-1 font-medium">Notes</p><p className="text-slate-600">{open.notes}</p></div>}
            <div>
              <p className="mb-1.5 font-medium">Update status</p>
              <Select value={open.status} disabled={update.isPending}
                onChange={(e) => update.mutate({ id: open.id, status: e.target.value })}>
                {statuses.filter((s) => s !== 'refunded' || role === 'store_owner').map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
