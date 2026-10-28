import { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, ClipboardList, DollarSign, Heart } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, errMsg, money } from '../../lib/utils'
import type { CustomerDashboard, CustomerProfile } from '../../lib/types'
import { Button, Card, ErrorState, Field, Input, PageHeader, Spinner, Textarea, useToast } from '../../components/ui'

export default function Profile() {
  const qc = useQueryClient()
  const toast = useToast()

  const dash = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => (await api.get<CustomerDashboard>('/customer/dashboard/')).data,
  })
  const profile = useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => asList((await api.get<CustomerProfile[]>('/customer/profiles/')).data)[0] ?? null,
  })

  const save = useMutation({
    mutationFn: (b: object) => api.patch(`/customer/profiles/${profile.data!.id}/`, b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-profile'] }); toast('Profile saved') },
    onError: (e) => toast(errMsg(e), 'err'),
  })

  if (profile.isLoading || dash.isLoading) return <Spinner />
  if (profile.isError) return <ErrorState message={errMsg(profile.error)} onRetry={() => profile.refetch()} />
  const p = profile.data
  if (!p) return <ErrorState message="No profile found for this store. Rejoin the store from the Stores page." />

  const s = dash.data?.stats
  const tiles = [
    { label: 'Orders', value: s?.total_orders ?? 0, icon: ClipboardList },
    { label: 'Total spent', value: money(s?.total_spent ?? p.total_spent), icon: DollarSign },
    { label: 'Loyalty points', value: s?.loyalty_points ?? p.loyalty_points, icon: Award },
    { label: 'Wishlist', value: s?.wishlist_count ?? 0, icon: Heart },
  ]

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    save.mutate(Object.fromEntries(new FormData(e.currentTarget)))
  }

  return (
    <>
      <PageHeader title="Profile" subtitle={`${p.user_first_name} ${p.user_last_name} · ${p.user_email}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <div className="flex items-center justify-between text-slate-500"><span className="text-sm">{t.label}</span><t.icon className="h-4 w-4" /></div>
            <p className="mt-2 text-xl font-semibold">{t.value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Contact details</h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><Input name="phone" defaultValue={p.phone} /></Field>
          <Field label="City"><Input name="city" defaultValue={p.city} /></Field>
          <Field label="State"><Input name="state" defaultValue={p.state} /></Field>
          <Field label="Country"><Input name="country" defaultValue={p.country} /></Field>
          <Field label="Postal code"><Input name="postal_code" defaultValue={p.postal_code} /></Field>
          <div className="sm:col-span-2"><Field label="Address"><Textarea name="address" defaultValue={p.address} /></Field></div>
          <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>Save changes</Button></div>
        </form>
      </Card>
    </>
  )
}
