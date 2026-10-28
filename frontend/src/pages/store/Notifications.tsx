import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { asList, cx, dateFmt, errMsg } from '../../lib/utils'
import type { Notification } from '../../lib/types'
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Spinner, useToast } from '../../components/ui'

export default function Notifications() {
  const qc = useQueryClient()
  const toast = useToast()
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => asList((await api.get<Notification[]>('/customer/notifications/')).data),
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] })
  const read = useMutation({
    mutationFn: (id: number) => api.post(`/customer/notifications/${id}/mark_read/`),
    onSuccess: refresh, onError: (e) => toast(errMsg(e), 'err'),
  })
  const readAll = useMutation({
    mutationFn: () => api.post('/customer/notifications/mark_all_read/'),
    onSuccess: refresh, onError: (e) => toast(errMsg(e), 'err'),
  })

  if (list.isLoading) return <Spinner />
  if (list.isError) return <ErrorState message={errMsg(list.error)} onRetry={() => list.refetch()} />
  const unread = list.data?.filter((n) => !n.is_read).length ?? 0

  return (
    <>
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : 'All caught up'}
        actions={unread > 0 && <Button variant="secondary" size="sm" loading={readAll.isPending} onClick={() => readAll.mutate()}>Mark all read</Button>} />
      {!list.data?.length ? <EmptyState title="No notifications" /> : (
        <div className="space-y-3">
          {list.data.map((n) => (
            <Card key={n.id} className={cx('flex items-start justify-between gap-3 p-4', !n.is_read && 'border-brand-200 bg-brand-50/40')}>
              <div>
                <div className="flex items-center gap-2"><p className="font-medium">{n.title}</p><Badge>{n.notification_type}</Badge></div>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{dateFmt(n.created_at)}</p>
              </div>
              {!n.is_read && <Button size="sm" variant="ghost" onClick={() => read.mutate(n.id)}>Mark read</Button>}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
