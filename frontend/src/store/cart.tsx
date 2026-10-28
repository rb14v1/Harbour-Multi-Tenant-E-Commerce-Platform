import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { Product } from '../lib/types'
import { useAuth } from './auth'

export interface CartLine { product: Product; quantity: number }

interface CartState {
  lines: CartLine[]
  count: number
  total: number
  add: (p: Product, qty?: number) => void
  setQty: (id: number, qty: number) => void
  remove: (id: number) => void
  clear: () => void
}

const Ctx = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { tenantId } = useAuth()
  const key = `cart:${tenantId ?? 'none'}`
  const [lines, setLines] = useState<CartLine[]>([])

  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(key) ?? '[]')) } catch { setLines([]) }
  }, [key])

  const persist = useCallback((next: CartLine[]) => {
    setLines(next)
    localStorage.setItem(key, JSON.stringify(next))
  }, [key])

  const value = useMemo<CartState>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    total: lines.reduce((s, l) => s + l.quantity * Number(l.product.price), 0),
    add: (p, qty = 1) => {
      const found = lines.find((l) => l.product.id === p.id)
      persist(found
        ? lines.map((l) => l.product.id === p.id
          ? { ...l, quantity: Math.min(p.stock_quantity, l.quantity + qty) } : l)
        : [...lines, { product: p, quantity: Math.min(p.stock_quantity, qty) }])
    },
    setQty: (id, qty) =>
      persist(lines.map((l) => l.product.id === id
        ? { ...l, quantity: Math.max(1, Math.min(l.product.stock_quantity, qty)) } : l)),
    remove: (id) => persist(lines.filter((l) => l.product.id !== id)),
    clear: () => persist([]),
  }), [lines, persist])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart outside provider')
  return c
}
