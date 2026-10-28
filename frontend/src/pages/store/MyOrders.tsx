import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { asList, dateFmt, errMsg, money } from '../../lib/utils'
import type { Order } from '../../lib/types'
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner, StatusBadge, useToast } from '../../components/ui'

export default function MyOrders() {
  const qc = useQueryClient()
  const toast = useToast()
  const [openId, setOpenId] = useState<number | null>(null)

  const list = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => asList((await api.get<Order[]>('/orders/', { params: { ordering: '-created_at' } })).data),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/orders/${id}/update_status/`, { status: 'cancelled' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-orders'] }); toast('Order cancelled') },
    onError: (e) => toast(errMsg(e), 'err'),
  })

  if (list.isLoading) return <Spinner />
  if (list.isError) return <ErrorState message={errMsg(list.error)} onRetry={() => list.refetch()} />
  if (!list.data?.length) {
    return <EmptyState title="No orders yet" hint="Your purchases will be listed here."
      action={<Link to="/shop"><Button>Start shopping</Button></Link>} />
  }

  return (
    <>
      <PageHeader title="My orders" />
      <div className="space-y-4">
        {list.data.map((o) => (
          <Card key={o.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{o.order_number}</p>
                <p className="text-xs text-slate-500">{dateFmt(o.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={o.status} />
                <p className="font-semibold">{money(o.total_amount)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
                {openId === o.id ? 'Hide details' : 'View details'}
              </Button>
              {(o.status === 'pending' || o.status === 'processing') && (
                <Button variant="ghost" size="sm" className="text-red-600" loading={cancel.isPending && cancel.variables === o.id}
                  onClick={() => confirm('Cancel this order?') && cancel.mutate(o.id)}>Cancel order</Button>
              )}
            </div>
            {openId === o.id && (
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-sm">
                <ul className="space-y-1.5">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <Link to={`/shop/product/${i.product}`} className="hover:text-brand-600">{i.quantity} × {i.product_details?.name}</Link>
                      <span>{money(i.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div><p className="font-medium">Shipping to</p><p className="whitespace-pre-line text-slate-600">{o.shipping_address}</p></div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}
