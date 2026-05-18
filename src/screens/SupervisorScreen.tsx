import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ScrollView, StatusBar,
} from 'react-native'
import { useAuthStore } from '../store/useAuthStore'
import { useOrdersStore, ProductionOrder } from '../store/useOrdersStore'
import { COLORS } from '../lib/constants'
import OrderCard from '../components/OrderCard'
import AssignModal from '../components/AssignModal'
import UpdateModal from '../components/UpdateModal'
import SplitModal from '../components/SplitModal'
import Toast from 'react-native-toast-message'

const TABS = [
  { key: 'UNASSIGNED', label: 'Unassigned', icon: '⏳' },
  { key: 'ASSIGNED',   label: 'Assigned',   icon: '👥' },
  { key: 'ACTIVE',     label: 'Active',     icon: '⚡' },
  { key: 'HOLD',       label: 'On Hold',    icon: '⏸' },
  { key: 'DONE',       label: 'Done',       icon: '✅' },
]

function useClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Dubai'
    }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

export default function SupervisorScreen() {
  const { user, logout }                         = useAuthStore()
  const { orders, isLoading, loadOrders, orderAction } = useOrdersStore()
  const [tab,          setTab]          = useState('UNASSIGNED')
  const [assignOrder,  setAssignOrder]  = useState<ProductionOrder | null>(null)
  const [updateOrder,  setUpdateOrder]  = useState<ProductionOrder | null>(null)
  const [splitOrder,   setSplitOrder]   = useState<ProductionOrder | null>(null)
  const [busyMap,      setBusyMap]      = useState<Record<string, string>>({})
  const clock = useClock()
  const load = useCallback(() => loadOrders(), [loadOrders])

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (!Object.keys(busyMap).length) loadOrders()
    }, 30000)
    return () => clearInterval(id)
  }, [busyMap, loadOrders])

  function setBusy(id: string, action: string) { setBusyMap(m => ({ ...m, [id]: action })) }
  function clearBusy(id: string) { setBusyMap(m => { const n = { ...m }; delete n[id]; return n }) }

  const tabOrders = orders.filter(o => {
    if (tab === 'DONE') return o.status === 'DONE' || o.status === 'PARTIAL_DONE'
    return o.status === tab
  })

  const counts: Record<string, number> = {
    UNASSIGNED: orders.filter(o => o.status === 'UNASSIGNED').length,
    ASSIGNED:   orders.filter(o => o.status === 'ASSIGNED').length,
    ACTIVE:     orders.filter(o => o.status === 'ACTIVE').length,
    HOLD:       orders.filter(o => o.status === 'HOLD').length,
    DONE:       orders.filter(o => o.status === 'DONE' || o.status === 'PARTIAL_DONE').length,
  }

  async function handleAction(order: ProductionOrder, action: string) {
    if (action === 'assign')  { setAssignOrder(order);  return }
    if (action === 'update')  { setUpdateOrder(order);  return }
    if (action === 'partial') { setSplitOrder(order);   return }
    if (busyMap[order.id]) return

    setBusy(order.id, action)

    if (action === 'hold') {
      try {
        const r = await orderAction(order.id, { action: 'hold', holdReason: 'On hold' })
        if (r?.error) Toast.show({ type: 'error', text1: r.error })
        else Toast.show({ type: 'success', text1: `⏸ ${order.ref} on hold` })
      } catch { Toast.show({ type: 'error', text1: 'Failed' }) }
      finally { clearBusy(order.id) }
      return
    }

    if (action === 'unhold') {
      try {
        const r = await orderAction(order.id, { action: 'unhold' })
        if (r?.error) Toast.show({ type: 'error', text1: r.error })
        else Toast.show({ type: 'success', text1: `▶ ${order.ref} resumed` })
      } catch { Toast.show({ type: 'error', text1: 'Failed' }) }
      finally { clearBusy(order.id) }
      return
    }

    if (action === 'start') {
      try {
        const r = await orderAction(order.id, { action: 'start' })
        if (r?.error) Toast.show({ type: 'error', text1: r.error })
        else Toast.show({ type: 'success', text1: `⚡ ${order.ref} started` })
      } catch { Toast.show({ type: 'error', text1: 'Failed' }) }
      finally { clearBusy(order.id) }
      return
    }

    clearBusy(order.id)
  }

  const busyTeams = orders
    .filter(o => ['ASSIGNED', 'ACTIVE'].includes(o.status) && o.id !== assignOrder?.id)
    .map(o => o.teamName)
    .filter(Boolean) as string[]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary}/>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>FFC HORECA</Text>
            <Text style={styles.userName}>Supervisor · {user?.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.clock}>{clock}</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
          {TABS.map(t => (
            <View key={t.key} style={styles.pill}>
              <Text style={styles.pillCount}>{counts[t.key] || 0}</Text>
              <Text style={styles.pillLabel}>{t.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, tab === t.key && styles.tabActive]}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.icon} {t.label}
                {counts[t.key] > 0 ? ` (${counts[t.key]})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Order list */}
      <FlatList
        data={tabOrders}
        keyExtractor={o => o.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={COLORS.primary}/>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{tab === 'DONE' ? '🎉' : '📭'}</Text>
            <Text style={styles.emptyTitle}>
              {tab === 'DONE' ? 'All done!' : `No ${TABS.find(t => t.key === tab)?.label.toLowerCase()} orders`}
            </Text>
            {tab === 'UNASSIGNED' && (
              <Text style={styles.emptyHint}>Send orders from Intake on desktop first</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAction={handleAction}
            busyAction={busyMap[item.id] || null}
          />
        )}
      />

      {/* Modals */}
      <AssignModal
        order={assignOrder}
        busyTeams={busyTeams}
        onClose={() => { setAssignOrder(null); load() }}
      />
      <UpdateModal
        order={updateOrder}
        onClose={() => { setUpdateOrder(null); load() }}
      />
      <SplitModal
        order={splitOrder}
        onClose={() => { setSplitOrder(null); load() }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  header:         { backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  appName:        { fontSize: 18, fontWeight: '900', color: '#fff' },
  userName:       { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  headerRight:    { alignItems: 'flex-end', gap: 6 },
  clock:          { fontSize: 18, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  logoutBtn:      { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  logoutText:     { color: '#fff', fontSize: 12, fontWeight: '700' },
  pillsScroll:    { marginBottom: 4 },
  pill:           { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, alignItems: 'center', minWidth: 70 },
  pillCount:      { fontSize: 20, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  pillLabel:      { fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 1 },
  tabsScroll:     { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', maxHeight: 48 },
  tabs:           { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tabBtn:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  tabActive:      { backgroundColor: COLORS.primary },
  tabText:        { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tabTextActive:  { color: '#fff' },
  list:           { padding: 12, paddingBottom: 32 },
  empty:          { alignItems: 'center', paddingVertical: 64 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyHint:      { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
})
