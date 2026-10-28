import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { asList, errMsg, money } from '../../lib/utils'
import type { Address, Order } from '../../lib/types'
import { useCart } from '../../store/cart'
import { Alert, Button, Card, Field, PageHeader, Select, Textarea, useToast } from '../../components/ui'

const fmt = (a: Address) =>
  `${a.full_name}\n${a.address_line1}${a.address_line2 ? ', ' + a.address_line2 : ''}\n${a.city}, ${a.state} ${a.postal_code}\n${a.country}\nPhone: ${a.phone}`

export default function Checkout() {
  const { lines, total, clear } = useCart()
  const nav = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const [err, setErr] = useState('')
  const [shipId, setShipId] = useState('')
  const [shipText, setShipText] = useState('')
  const [sameBilling, setSameBilling] = useState(true)
  const [billText, setBillText] = useState('')

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => asList((await api.get<Address[]>('/customer/addresses/')).data),
  })

  const place = useMutation({
    mutationFn: (body: object) => api.post<Order>('/orders/', body),
    onSuccess: (r) => {
      clear()
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      qc.invalidateQueries({ queryKey: ['shop-products'] })
      toast(`Order ${r.data.order_number} placed`)
      nav('/shop/orders')
    },
    onError: (e) => setErr(errMsg(e)),
  })

  if (!lines.length) return <Navigate to="/shop/cart" replace />

  const pick = (id: string) => {
    setShipId(id)
    const a = addresses.data?.find((x) => String(x.id) === id)
    if (a) setShipText(fmt(a))
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErr('')
    place.mutate({
      shipping_address: shipText,
      billing_address: sameBilling ? shipText : billText,
      notes: String(f.get('notes') ?? ''),
      items: lines.map((l) => ({ product: l.product.id, quantity: l.quantity })),
    })
  }

  return (
    <>
      <PageHeader title="Checkout" />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {err && <Alert>{err}</Alert>}
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Shipping address</h2>
            {!!addresses.data?.length && (
              <Field label="Use a saved address">
                <Select value={shipId} onChange={(e) => pick(e.target.value)}>
                  <option value="">Select...</option>
                  {addresses.data.map((a) => <option key={a.id} value={a.id}>{a.full_name}, {a.city}</option>)}
                </Select>
              </Field>
            )}
            <Field label="Address" hint={!addresses.data?.length ? 'Tip: save addresses under Addresses for faster checkout.' : undefined}>
              <Textarea required rows={4} value={shipText} onChange={(e) => setShipText(e.target.value)} placeholder="Name, street, city, postcode, country, phone" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sameBilling} onChange={(e) => setSameBilling(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              Billing address is the same
            </label>
            {!sameBilling && <Field label="Billing address"><Textarea required rows={4} value={billText} onChange={(e) => setBillText(e.target.value)} /></Field>}
          </Card>
          <Card className="p-5">
            <Field label="Order notes (optional)"><Textarea name="notes" /></Field>
          </Card>
        </div>
        <Card className="h-fit p-5">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.product.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">{l.quantity} × {l.product.name}</span>
                <span>{money(l.quantity * Number(l.product.price))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-semibold"><span>Total</span><span>{money(total)}</span></div>
          <p className="mt-2 text-xs text-slate-500">Payment is arranged with the store after the order is placed.</p>
          <Button type="submit" loading={place.isPending} className="mt-5 w-full">Place order</Button>
          <Link to="/shop/cart" className="mt-3 block text-center text-sm text-slate-600 hover:underline">Back to cart</Link>
        </Card>
      </form>
    </>
  )
}
