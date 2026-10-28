import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, errMsg, money } from '../../lib/utils'
import type { WishlistItem } from '../../lib/types'
import { useCart } from '../../store/cart'
import { Button, Card, EmptyState, ErrorState, PageHeader, Spinner, useToast } from '../../components/ui'

export default function Wishlist() {
  const qc = useQueryClient()
  const toast = useToast()
  const { add } = useCart()

  const list = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => asList((await api.get<WishlistItem[]>('/customer/wishlist/')).data),
  })
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/customer/wishlist/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: (e) => toast(errMsg(e), 'err'),
  })

  if (list.isLoading) return <Spinner />
  if (list.isError) return <ErrorState message={errMsg(list.error)} onRetry={() => list.refetch()} />
  if (!list.data?.length) {
    return <EmptyState title="Your wishlist is empty" hint="Tap the heart on any product to save it."
      action={<Link to="/shop"><Button>Browse products</Button></Link>} />
  }

  return (
    <>
      <PageHeader title="Wishlist" subtitle={`${list.data.length} saved`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.data.map((w) => {
          const p = w.product_details
          return (
            <Card key={w.id} className="flex gap-4 p-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/shop/product/${p.id}`} className="line-clamp-1 font-medium hover:text-brand-600">{p.name}</Link>
                <p className="font-semibold">{money(p.price)}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button size="sm" disabled={p.stock_quantity <= 0} onClick={() => { add(p); toast('Added to cart') }}>Add to cart</Button>
                  <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => del.mutate(w.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
