import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserX } from 'lucide-react'
import { api } from '../../lib/api'
import { asList, dateFmt, errMsg } from '../../lib/utils'
import type { Member, Role } from '../../lib/types'
import { useAuth } from '../../store/auth'
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from '../../components/ui'

const roles: Role[] = ['store_owner', 'staff', 'customer']
const label = (r: string) => r.replace('_', ' ')

export default function Team() {
  const { tenantId, user } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState('')
  const key = ['members', tenantId]

  const members = useQuery({
    queryKey: key,
    queryFn: async () => asList((await api.get<Member[]>(`/tenants/${tenantId}/members`)).data),
  })

  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ['stats'] }) }

  const add = useMutation({
    mutationFn: (b: { email: string; role: string }) => api.post(`/tenants/${tenantId}/add_member`, b),
    onSuccess: () => { refresh(); setOpen(false); toast('Member added') },
    onError: (e) => setErr(errMsg(e)),
  })
  const remove = useMutation({
    mutationFn: (member_id: number) => api.post(`/tenants/${tenantId}/remove_member`, { member_id }),
    onSuccess: () => { refresh(); toast('Member removed') },
    onError: (e) => toast(errMsg(e), 'err'),
  })
  const setRole = useMutation({
    mutationFn: (v: { member_id: number; role: string }) => api.post(`/tenants/${tenantId}/update_member_role`, v),
    onSuccess: () => { refresh(); toast('Role updated') },
    onError: (e) => toast(errMsg(e), 'err'),
  })

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setErr('')
    add.mutate({ email: String(f.get('email')), role: String(f.get('role')) })
  }

  return (
    <>
      <PageHeader title="Team" subtitle="People with access to this store. The person must already have an account."
        actions={<Button onClick={() => { setErr(''); setOpen(true) }}><UserPlus className="h-4 w-4" /> Add member</Button>} />
      <Card className="overflow-hidden">
        {members.isLoading ? <Spinner /> : members.isError ? <ErrorState message={errMsg(members.error)} onRetry={() => members.refetch()} /> :
          !members.data?.length ? <EmptyState title="No members" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.data.map((m) => {
                    const self = m.user_email === user?.email
                    return (
                      <tr key={m.id}>
                        <td className="px-5 py-3"><p className="font-medium">{m.user_name} {self && <Badge tone="indigo">You</Badge>}</p><p className="text-xs text-slate-500">{m.user_email}</p></td>
                        <td className="px-5 py-3">
                          <Select className="max-w-[160px] capitalize" value={m.role} disabled={self || setRole.isPending}
                            onChange={(e) => setRole.mutate({ member_id: m.id, role: e.target.value })} aria-label="Role">
                            {roles.map((r) => <option key={r} value={r}>{label(r)}</option>)}
                          </Select>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{dateFmt(m.created_at)}</td>
                        <td className="px-5 py-3 text-right">
                          {!self && <Button variant="ghost" size="sm" className="text-red-600" aria-label="Remove"
                            onClick={() => confirm(`Remove ${m.user_email}?`) && remove.mutate(m.id)}><UserX className="h-4 w-4" /></Button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add member">
        <form onSubmit={submit} className="space-y-4">
          {err && <Alert>{err}</Alert>}
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Role">
            <Select name="role" defaultValue="staff">{roles.map((r) => <option key={r} value={r}>{label(r)}</option>)}</Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={add.isPending}>Add</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
