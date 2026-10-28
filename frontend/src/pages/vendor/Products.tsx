import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, errMsg, money } from '../../lib/utils'
import type { Product } from '../../lib/types'
import {
  Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Spinner, Textarea, useToast,
} from '../../components/ui'

export default function Products() {
  const qc = useQueryClient()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [err, setErr] = useState('')

  const list = useQuery({
    queryKey: ['products', q, category],
    queryFn: async () => asList((await api.get<Product[]>('/products/', {
      params: { search: q || undefined, category: category || undefined, ordering: '-created_at' },
    })).data),
  })
  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<string[]>('/products/categories/')).data,
  })

  const save = useMutation({
    mutationFn: async (body: Partial<Product>) =>
      editing && editing !== 'new'
        ? api.patch(`/products/${editing.id}/`, body)
        : api.post('/products/', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      toast(editing === 'new' ? 'Product created' : 'Product updated')
      setEditing(null)
    },
    onError: (e) => setErr(errMsg(e)),
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast('Product deleted') },
    onError: (e) => toast(errMsg(e), 'err'),
  })

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErr('')
    save.mutate({
      name: String(f.get('name')),
      sku: String(f.get('sku')),
      description: String(f.get('description')),
      category: String(f.get('category')),
      image_url: String(f.get('image_url')),
      price: String(f.get('price')),
      stock_quantity: Number(f.get('stock_quantity')),
      is_active: f.get('is_active') === 'on',
    })
  }

  const p = editing && editing !== 'new' ? editing : null

  return (
    <>
      <PageHeader title="Products" subtitle="Manage your catalogue and stock."
        actions={<Button onClick={() => { setErr(''); setEditing('new') }}><Plus className="h-4 w-4" /> Add product</Button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search name, SKU, description" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="max-w-[200px]" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {cats.data?.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {list.isLoading ? <Spinner /> : list.isError ? <ErrorState message={errMsg(list.error)} onRetry={() => list.refetch()} /> :
          !list.data?.length ? (
            <EmptyState title="No products" hint="Add your first product to start selling." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Product</th><th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Price</th><th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Status</th><th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.data.map((x) => (
                    <tr key={x.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {x.image_url ? <img src={x.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            : <div className="h-10 w-10 rounded-lg bg-slate-100" />}
                          <div><p className="font-medium">{x.name}</p><p className="text-xs text-slate-500">{x.category || 'Uncategorised'}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{x.sku}</td>
                      <td className="px-5 py-3 font-medium">{money(x.price)}</td>
                      <td className="px-5 py-3">{x.stock_quantity <= 5 ? <Badge tone="amber">{x.stock_quantity} low</Badge> : x.stock_quantity}</td>
                      <td className="px-5 py-3">{x.is_active ? <Badge tone="green">Active</Badge> : <Badge>Hidden</Badge>}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => { setErr(''); setEditing(x) }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" aria-label="Delete" className="text-red-600"
                            onClick={() => confirm(`Delete "${x.name}"?`) && del.mutate(x.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={p ? 'Edit product' : 'New product'}>
        <form onSubmit={submit} className="space-y-4" key={p?.id ?? 'new'}>
          {err && <Alert>{err}</Alert>}
          <Field label="Name"><Input name="name" required defaultValue={p?.name} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU"><Input name="sku" required defaultValue={p?.sku} /></Field>
            <Field label="Category"><Input name="category" defaultValue={p?.category} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price"><Input name="price" type="number" step="0.01" min="0.01" required defaultValue={p?.price} /></Field>
            <Field label="Stock"><Input name="stock_quantity" type="number" min="0" required defaultValue={p?.stock_quantity ?? 0} /></Field>
          </div>
          <Field label="Image URL"><Input name="image_url" type="url" defaultValue={p?.image_url} /></Field>
          <Field label="Description"><Textarea name="description" defaultValue={p?.description} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Visible to customers
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
