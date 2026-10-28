export const money = (v: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v))

export const dateFmt = (v: string) =>
  new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export function asList<T>(d: T[] | { results: T[] } | undefined | null): T[] {
  if (!d) return []
  return Array.isArray(d) ? d : d.results ?? []
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function errMsg(e: unknown): string {
  const data = (e as { response?: { data?: unknown } })?.response?.data
  if (!data) return 'Network error. Is the backend running?'
  if (typeof data === 'string') return 'Server error'
  const d = data as Record<string, unknown>
  if (typeof d.error === 'string') return d.error
  if (typeof d.detail === 'string') return d.detail
  const first = Object.entries(d)[0]
  if (!first) return 'Request failed'
  const [k, v] = first
  const msg = Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : String(v)
  return k === 'non_field_errors' ? msg : `${k}: ${msg}`
}
