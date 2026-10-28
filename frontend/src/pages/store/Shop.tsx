import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, ShoppingCart } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, cx, errMsg, money } from '../../lib/utils'
import type { Product, WishlistItem } from '../../lib/types'
import { useCart } from '../../store/cart'
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui'

export function ProductCard({ p, wish, onWish }: { p: Product; wish?: boolean; onWish?: () => void }) {
  const { add } = useCart()
  const toast = useToast()
  const out = p.stock_quantity <= 0
  return (
    <Card className="group flex flex-col overflow-hidden">
      <Link to={`/shop/product/${p.id}`} className="relative block aspect-square bg-slate-100">
        {p.image_url
          ? <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          : <div className="grid h-full place-items-center text-sm text-slate-400">No image</div>}
        {out && <span className="absolute left-2 top-2"><Badge tone="red">Sold out</Badge></span>}
      </Link>
      {onWish && (
        <button onClick={onWish} aria-label="Toggle wishlist"
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
          <Heart className={cx('h-4 w-4', wish ? 'fill-red-500 text-red-500' : 'text-slate-500')} />
        </button>
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-slate-500">{p.category || 'General'}</p>
        <Link to={`/shop/product/${p.id}`} className="mt-0.5 line-clamp-1 font-medium hover:text-brand-600">{p.name}</Link>
        <p className="mt-1 text-lg font-semibold">{money(p.price)}</p>
        <Button size="sm" className="mt-3" disabled={out}
          onClick={() => { add(p); toast('Added to cart') }}>
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </Button>
      </div>
    </Card>
  )
}

export default function Shop() {
  const qc = useQueryClient()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [ordering, setOrdering] = useState('-created_at')

  const products = useQuery({
    queryKey: ['shop-products', q, category, ordering],
    queryFn: async () => asList((await api.get<Product[]>('/products/', {
      params: { search: q || undefined, category: category || undefined, ordering },
    })).data),
  })
  const cats = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get<string[]>('/products/categories/')).data })
  const wishlist = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => asList((await api.get<WishlistItem[]>('/customer/wishlist/')).data),
  })

  const toggle = useMutation({
    mutationFn: async (p: Product) => {
      const existing = wishlist.data?.find((w) => w.product === p.id)
      return existing ? api.delete(`/customer/wishlist/${existing.id}/`) : api.post('/customer/wishlist/', { product: p.id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: (e) => toast(errMsg(e), 'err'),
  })

  return (
    <>
      <PageHeader title="Shop" subtitle="Browse everything this store has to offer." />
      <div className="mb-6 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {cats.data?.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select className="max-w-[200px]" value={ordering} onChange={(e) => setOrdering(e.target.value)} aria-label="Sort">
          <option value="-created_at">Newest</option>
          <option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option>
          <option value="name">Name A-Z</option>
        </Select>
      </div>
      {products.isLoading ? <Spinner /> : products.isError ? <ErrorState message={errMsg(products.error)} onRetry={() => products.refetch()} /> :
        !products.data?.length ? <EmptyState title="No products found" hint="Try a different search or category." /> : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.data.map((p) => (
              <div key={p.id} className="relative">
                <ProductCard p={p} wish={!!wishlist.data?.some((w) => w.product === p.id)} onWish={() => toggle.mutate(p)} />
              </div>
            ))}
          </div>
        )}
    </>
  )
}
