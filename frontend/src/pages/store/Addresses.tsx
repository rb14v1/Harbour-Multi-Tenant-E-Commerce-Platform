import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, errMsg } from '../../lib/utils'
import type { Address } from '../../lib/types'
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '../../components/ui'

export default function Addresses() {
  const qc = useQueryClient()
  const toast = useToast()
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [err, setErr] = useState('')

  const list = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => asList((await api.get<Address[]>('/customer/addresses/')).data),
  })

  const save = useMutation({
    mutationFn: (b: object) => editing && editing !== 'new'
      ? api.patch(`/customer/addresses/${editing.id}/`, b)
      : api.post('/customer/addresses/', b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); setEditing(null); toast('Address saved') },
    onError: (e) => setErr(errMsg(e)),
  })
  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/customer/addresses/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); toast('Address deleted') },
    onError: (e) => toast(errMsg(e), 'err'),
  })

  const a = editing && editing !== 'new' ? editing : null

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget))
    setErr('')
    save.mutate({ ...f, is_default: f.is_default === 'on' })
  }

  return (
    <>
      <PageHeader title="Addresses" subtitle="Saved addresses for faster checkout."
        actions={<Button onClick={() => { setErr(''); setEditing('new') }}><Plus className="h-4 w-4" /> Add address</Button>} />
      {list.isLoading ? <Spinner /> : list.isError ? <ErrorState message={errMsg(list.error)} onRetry={() => list.refetch()} /> :
        !list.data?.length ? <EmptyState title="No saved addresses" /> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.data.map((x) => (
              <Card key={x.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2"><Badge tone="indigo">{x.address_type}</Badge>{x.is_default && <Badge tone="green">Default</Badge>}</div>
                  <div className="flex">
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => { setErr(''); setEditing(x) }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" aria-label="Delete" className="text-red-600" onClick={() => confirm('Delete address?') && del.mutate(x.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="mt-3 font-medium">{x.full_name}</p>
                <p className="text-sm text-slate-600">{x.address_line1}{x.address_line2 && `, ${x.address_line2}`}</p>
                <p className="text-sm text-slate-600">{x.city}, {x.state} {x.postal_code}</p>
                <p className="text-sm text-slate-600">{x.country} · {x.phone}</p>
              </Card>
            ))}
          </div>
        )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={a ? 'Edit address' : 'New address'}>
        <form onSubmit={submit} className="space-y-4" key={a?.id ?? 'new'}>
          {err && <Alert>{err}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input name="full_name" required defaultValue={a?.full_name} /></Field>
            <Field label="Phone"><Input name="phone" type="tel" required defaultValue={a?.phone} /></Field>
          </div>
          <Field label="Address line 1"><Input name="address_line1" required defaultValue={a?.address_line1} /></Field>
          <Field label="Address line 2"><Input name="address_line2" defaultValue={a?.address_line2} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City"><Input name="city" required defaultValue={a?.city} /></Field>
            <Field label="State"><Input name="state" required defaultValue={a?.state} /></Field>
            <Field label="Country"><Input name="country" required defaultValue={a?.country} /></Field>
            <Field label="Postal code"><Input name="postal_code" required defaultValue={a?.postal_code} /></Field>
          </div>
          <Field label="Type">
            <Select name="address_type" defaultValue={a?.address_type ?? 'shipping'}>
              <option value="shipping">Shipping</option><option value="billing">Billing</option><option value="both">Both</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_default" defaultChecked={a?.is_default} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Set as default
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
