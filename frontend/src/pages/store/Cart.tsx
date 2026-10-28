import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { money } from '../../lib/utils'
import { useCart } from '../../store/cart'
import { Button, Card, EmptyState, PageHeader } from '../../components/ui'

export default function Cart() {
  const { lines, total, setQty, remove, count } = useCart()

  if (!lines.length) {
    return <EmptyState title="Your cart is empty" hint="Add a few products and they will show up here."
      action={<Link to="/shop"><Button>Continue shopping</Button></Link>} />
  }

  return (
    <>
      <PageHeader title="Cart" subtitle={`${count} item${count === 1 ? '' : 's'}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="divide-y divide-slate-100 lg:col-span-2">
          {lines.map(({ product: p, quantity }) => (
            <div key={p.id} className="flex gap-4 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/shop/product/${p.id}`} className="line-clamp-1 font-medium hover:text-brand-600">{p.name}</Link>
                <p className="text-sm text-slate-500">{money(p.price)} each</p>
                <div className="mt-2 flex items-center gap-1">
                  <Button variant="secondary" size="sm" aria-label="Decrease" onClick={() => setQty(p.id, quantity - 1)} disabled={quantity <= 1}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <Button variant="secondary" size="sm" aria-label="Increase" onClick={() => setQty(p.id, quantity + 1)} disabled={quantity >= p.stock_quantity}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <p className="font-semibold">{money(quantity * Number(p.price))}</p>
                <button onClick={() => remove(p.id)} aria-label="Remove" className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </Card>
        <Card className="h-fit p-5">
          <h2 className="font-semibold">Summary</h2>
          <div className="mt-4 flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{money(total)}</span></div>
          <div className="mt-2 flex justify-between text-sm text-slate-600"><span>Shipping</span><span>Free</span></div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-semibold"><span>Total</span><span>{money(total)}</span></div>
          <Link to="/shop/checkout"><Button className="mt-5 w-full">Checkout</Button></Link>
        </Card>
      </div>
    </>
  )
}
