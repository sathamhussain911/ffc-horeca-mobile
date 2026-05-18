import { create } from 'zustand'
import { fetchOrders, orderAction as apiOrderAction } from '../lib/api'

export interface ProductionOrder {
  id: string
  ref: string
  client: string | null
  category: string
  itemName: string | null
  status: string
  priority: string
  totalQty: number
  doneQty: number
  teamName: string | null
  holdReason: string | null
  startedAt: string | null
  completedAt: string | null
  slaCutoff: string | null
  partialReason: string | null
  partNumber: number
  parentRef: string | null
}

interface OrdersStore {
  orders: ProductionOrder[]
  isLoading: boolean
  lastUpdated: Date | null
  loadOrders: () => Promise<void>
  orderAction: (id: string, body: Record<string, unknown>) => Promise<{ error?: string }>
}

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  orders: [],
  isLoading: false,
  lastUpdated: null,

  loadOrders: async () => {
    set({ isLoading: true })
    try {
      const json = await fetchOrders()
      if (json.success) {
        set({ orders: json.data, isLoading: false, lastUpdated: new Date() })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  orderAction: async (id, body) => {
    const prev = get().orders.find(o => o.id === id)
    if (!prev) return { error: 'Order not found' }

    // Optimistic update
    const now = new Date().toISOString()
    let optimistic: Partial<ProductionOrder> = {}
    switch (body.action) {
      case 'assign':
        optimistic = { status: 'ASSIGNED', teamName: body.teamName as string }
        break
      case 'start':
        optimistic = { status: 'ACTIVE', startedAt: now }
        break
      case 'hold':
        optimistic = { status: 'HOLD', holdReason: (body.holdReason as string) || 'On hold' }
        break
      case 'unhold':
        optimistic = { status: 'ACTIVE', holdReason: null }
        break
      case 'complete':
        optimistic = { status: 'DONE', completedAt: now, doneQty: (body.doneQty as number) ?? prev.totalQty }
        break
      case 'partial_done':
        optimistic = { status: 'PARTIAL_DONE', doneQty: (body.doneQty as number) ?? 0, teamName: null }
        break
      case 'updateQty':
        optimistic = { doneQty: body.doneQty as number }
        break
    }

    set(s => ({
      orders: s.orders.map(o => o.id === id ? { ...o, ...optimistic } : o)
    }))

    try {
      const json = await apiOrderAction(id, body)
      if (!json.success) {
        // Rollback
        set(s => ({ orders: s.orders.map(o => o.id === id ? prev : o) }))
        return { error: json.error }
      }
      set(s => ({
        orders: s.orders.map(o => o.id === id ? { ...o, ...json.data } : o)
      }))
      return {}
    } catch {
      set(s => ({ orders: s.orders.map(o => o.id === id ? prev : o) }))
      return { error: 'Network error' }
    }
  },
}))
