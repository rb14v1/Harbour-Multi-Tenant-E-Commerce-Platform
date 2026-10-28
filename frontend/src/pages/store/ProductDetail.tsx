import { FormEvent, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, dateFmt, errMsg, money } from '../../lib/utils'
import type { Product, Review } from '../../lib/types'
import { useCart } from '../../store/cart'
import { Alert, Badge, Button, Card, ErrorState, Field, Input, Spinner, Stars, Textarea, useToast } from '../../components/ui'

export default function ProductDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const { add } = useCart()
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(5)
  const [err, setErr] = useState('')

  const product = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get<Product>(`/products/${id}/`)).data,
  })
  const reviews = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => asList((await api.get<Review[]>('/customer/reviews/')).data),
  })

  const post = useMutation({
    mutationFn: (b: object) => api.post('/customer/reviews/', b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); toast('Review submitted. It appears once approved.') },
    onError: (e) => setErr(errMsg(e)),
  })

  if (product.isLoading) return <Spinner />
  if (product.isError) return <ErrorState message={errMsg(product.error)} onRetry={() => product.refetch()} />
  const p = product.data!
  const out = p.stock_quantity <= 0
  const mine = (reviews.data ?? []).filter((r) => r.product === p.id)
  const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErr('')
    post.mutate({ product: p.id, rating, title: f.get('title'), comment: f.get('comment') })
  }

  return (
    <>
      <Link to="/shop" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to shop</Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
          {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            : <div className="grid h-full place-items-center text-slate-400">No image</div>}
        </div>
        <div>
          <p className="text-sm text-slate-500">{p.category || 'General'} · SKU {p.sku}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.name}</h1>
          {mine.length > 0 && <div className="mt-2 flex items-center gap-2"><Stars value={Math.round(avg)} /><span className="text-sm text-slate-500">{avg.toFixed(1)} ({mine.length})</span></div>}
          <p className="mt-4 text-3xl font-bold">{money(p.price)}</p>
          <p className="mt-4 whitespace-pre-line text-slate-600">{p.description || 'No description provided.'}</p>
          <div className="mt-4">{out ? <Badge tone="red">Sold out</Badge> : p.stock_quantity <= 5 ? <Badge tone="amber">Only {p.stock_quantity} left</Badge> : <Badge tone="green">In stock</Badge>}</div>
          <div className="mt-6 flex items-center gap-3">
            <Input type="number" min={1} max={p.stock_quantity} value={qty} className="w-24" aria-label="Quantity"
              onChange={(e) => setQty(Math.max(1, Math.min(p.stock_quantity, Number(e.target.value) || 1)))} />
            <Button disabled={out} onClick={() => { add(p, qty); toast('Added to cart') }}><ShoppingCart className="h-4 w-4" /> Add to cart</Button>
            <Button variant="secondary" disabled={out} onClick={() => { add(p, qty); nav('/shop/cart') }}>Buy now</Button>
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
          {!mine.length ? <p className="text-sm text-slate-500">No reviews yet.</p> : (
            <div className="space-y-3">
              {mine.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-slate-500">{dateFmt(r.created_at)}</span></div>
                  <p className="mt-2 font-medium">{r.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                  <p className="mt-2 text-xs text-slate-400">{r.customer_name}{!r.is_approved && ' · pending approval'}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
        <Card className="h-fit p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold">Write a review</h3>
          <form onSubmit={submit} className="space-y-3">
            {err && <Alert>{err}</Alert>}
            <Stars value={rating} onChange={setRating} />
            <Field label="Title"><Input name="title" required maxLength={200} /></Field>
            <Field label="Comment"><Textarea name="comment" required /></Field>
            <Button type="submit" loading={post.isPending} className="w-full">Submit review</Button>
          </form>
        </Card>
      </section>
    </>
  )
}
