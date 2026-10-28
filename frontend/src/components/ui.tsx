import {
  ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes,
  TextareaHTMLAttributes, createContext, forwardRef, useCallback, useContext, useEffect, useState,
} from 'react'
import { AlertCircle, CheckCircle2, Inbox, Loader2, X } from 'lucide-react'
import { cx } from '../lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-brand-500',
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', loading, size = 'md', className, children, disabled, ...p }: BtnProps) {
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        variants[variant], className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

const fieldCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-100'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} {...p} className={cx(fieldCls, className)} />,
)
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, ref) => <select ref={ref} {...p} className={cx(fieldCls, className)} />,
)
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} rows={3} {...p} className={cx(fieldCls, className)} />,
)

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-xl border border-slate-200 bg-white shadow-card', className)}>{children}</div>
}

const badgeTones: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-600/20',
}

export function Badge({ tone = 'slate', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', badgeTones[tone])}>
      {children}
    </span>
  )
}

const statusTone: Record<string, keyof typeof badgeTones> = {
  pending: 'amber', processing: 'blue', shipped: 'indigo', delivered: 'green', cancelled: 'red', refunded: 'slate',
}
export const StatusBadge = ({ status }: { status: string }) => (
  <Badge tone={statusTone[status] ?? 'slate'}>{status[0].toUpperCase() + status.slice(1)}</Badge>
)

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">{label}...</span>
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400"><Inbox className="h-6 w-6" /></div>
      <p className="font-medium text-slate-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="text-sm text-slate-700">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{children}</span>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface Toast { id: number; msg: string; kind: 'ok' | 'err' }
const ToastCtx = createContext<(msg: string, kind?: 'ok' | 'err') => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, msg, kind }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx('flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg', t.kind === 'ok' ? 'bg-slate-900' : 'bg-red-600')}>
            {t.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
          className={cx('text-lg leading-none', n <= value ? 'text-amber-400' : 'text-slate-300', onChange && 'hover:scale-110')}>★</button>
      ))}
    </div>
  )
}
