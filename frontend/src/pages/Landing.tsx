import { Link } from 'react-router-dom'
import { BarChart3, ShieldCheck, Store, Users } from 'lucide-react'

const features = [
  { icon: Store, title: 'Isolated storefronts', text: 'Every store keeps its own catalogue, orders and customers, separated by tenant.' },
  { icon: Users, title: 'Roles built in', text: 'Store owners, staff and customers each see only what their role allows.' },
  { icon: BarChart3, title: 'Live store metrics', text: 'Revenue, pending orders, customers and stock at a glance on one dashboard.' },
  { icon: ShieldCheck, title: 'Secure sessions', text: 'JWT authentication with silent token refresh and tenant-scoped requests.' },
]

export default function Landing() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            One platform. <span className="text-brand-600">Many stores.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            Launch your own store with products, orders and a team in minutes, or browse and shop from independent vendors.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register/vendor" className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700">Open your store</Link>
            <Link to="/stores" className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium hover:bg-slate-50">Browse stores</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><f.icon className="h-5 w-5" /></div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>
    </>
  )
}
