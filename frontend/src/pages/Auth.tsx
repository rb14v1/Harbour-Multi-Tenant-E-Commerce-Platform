import { FormEvent, ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { asList, errMsg } from '../lib/utils'
import type { Tenant } from '../lib/types'
import { useAuth } from '../store/auth'
import { Alert, Button, Card, Field, Input, Textarea, useToast } from '../components/ui'

function Shell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
      <p className="mt-5 text-center text-sm text-slate-600">{footer}</p>
    </div>
  )
}

const link = 'font-medium text-brand-600 hover:underline'

export function Login() {
  const { login, selectTenant } = useAuth()
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true); setErr('')
    try {
      const user = await login(String(f.get('email')), String(f.get('password')))
      if (user.is_vendor) return nav('/app')
      const mine = asList((await api.get<Tenant[]>('/tenants/my/')).data)
      if (mine.length) { selectTenant(mine[0].id, 'customer'); nav('/shop') } else nav('/stores')
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Welcome back" subtitle="Sign in to your account."
      footer={<>New here? <Link to="/register" className={link}>Create an account</Link> or <Link to="/register/vendor" className={link}>open a store</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <Alert>{err}</Alert>}
        <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
        <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </Shell>
  )
}

export function Register() {
  const { registerCustomer, login } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setBusy(true); setErr('')
    try {
      await registerCustomer(f)
      await login(f.email, f.password)
      toast('Account created. Pick a store to start shopping.')
      nav('/stores')
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Create your account" subtitle="Shop across any store on the platform."
      footer={<>Already registered? <Link to="/login" className={link}>Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <Alert>{err}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input name="first_name" required /></Field>
          <Field label="Last name"><Input name="last_name" required /></Field>
        </div>
        <Field label="Email"><Input name="email" type="email" required /></Field>
        <Field label="Phone"><Input name="phone" type="tel" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" hint="8+ characters, not common or all numeric"><Input name="password" type="password" required minLength={8} /></Field>
          <Field label="Confirm password"><Input name="password2" type="password" required minLength={8} /></Field>
        </div>
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
    </Shell>
  )
}

export function VendorRegister() {
  const { registerVendor, login } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setBusy(true); setErr('')
    try {
      await registerVendor({
        user: { email: f.email, password: f.password, password2: f.password2, first_name: f.first_name, last_name: f.last_name, phone: f.phone },
        store_name: f.store_name, domain: f.domain, subdomain: f.subdomain,
        contact_email: f.contact_email || f.email, contact_phone: f.contact_phone || f.phone, address: f.address,
      })
      await login(f.email, f.password)
      toast('Store created.')
      nav('/app')
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Open your store" subtitle="Create an owner account and your store in one step."
      footer={<>Already have a store? <Link to="/login" className={link}>Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <Alert>{err}</Alert>}
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Owner</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input name="first_name" required /></Field>
          <Field label="Last name"><Input name="last_name" required /></Field>
        </div>
        <Field label="Email"><Input name="email" type="email" required /></Field>
        <Field label="Phone"><Input name="phone" type="tel" required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password"><Input name="password" type="password" required minLength={8} /></Field>
          <Field label="Confirm password"><Input name="password2" type="password" required minLength={8} /></Field>
        </div>
        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Store</p>
        <Field label="Store name"><Input name="store_name" required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Domain" hint="e.g. mystore.com"><Input name="domain" required /></Field>
          <Field label="Subdomain" hint="e.g. mystore"><Input name="subdomain" required pattern="[a-zA-Z0-9-]+" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store email" hint="Defaults to owner email"><Input name="contact_email" type="email" /></Field>
          <Field label="Store phone" hint="Defaults to owner phone"><Input name="contact_phone" type="tel" /></Field>
        </div>
        <Field label="Address"><Textarea name="address" required /></Field>
        <Button type="submit" loading={busy} className="w-full">Create store</Button>
      </form>
    </Shell>
  )
}
