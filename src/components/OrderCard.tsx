import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ProductionOrder } from '../store/useOrdersStore'
import { COLORS, STATUS_CONFIG, TEAM_COLORS } from '../lib/constants'
import { Btn, StatusBadge, TeamBadge, Spinner } from './UI'

interface Props {
  order: ProductionOrder
  onAction: (order: ProductionOrder, action: string) => void
  busyAction?: string | null
}

function elapsed(start: string | null): string {
  if (!start) return ''
  const secs = Math.floor((Date.now() - new Date(start).getTime()) / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${secs}s`
}

export default function OrderCard({ order, onAction, busyAction }: Props) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.UNASSIGNED
  const pct = order.totalQty > 0
    ? Math.min(100, Math.round((order.doneQty / order.totalQty) * 100))
    : 0
  const isBusy = !!busyAction

  return (
    <View style={[styles.card, isBusy && styles.cardBusy]}>

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* Item name — green primary */}
          <Text style={styles.itemName} numberOfLines={1}>
            {order.itemName || order.category}
          </Text>
          {/* Ref — grey secondary */}
          <View style={styles.refRow}>
            <Text style={styles.ref}>{order.ref}</Text>
            {isBusy && (
              <View style={styles.updatingRow}>
                <Spinner color="#9CA3AF" size="small"/>
                <Text style={styles.updatingText}> updating…</Text>
              </View>
            )}
          </View>
          {order.client ? <Text style={styles.client}>{order.client}</Text> : null}
        </View>

        <View style={styles.headerRight}>
          <StatusBadge {...cfg}/>
          {order.teamName
            ? <TeamBadge teamName={order.teamName} colors={TEAM_COLORS}/>
            : null
          }
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricVal}>{order.totalQty.toLocaleString()}</Text>
          <Text style={styles.metricLbl}>Ordered</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricVal, { color: COLORS.primaryLight }]}>{order.doneQty}</Text>
          <Text style={styles.metricLbl}>Done</Text>
        </View>
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[
              styles.progressFill,
              { width: `${pct}%` as any, backgroundColor: pct >= 100 ? COLORS.primaryLight : COLORS.primary }
            ]}/>
          </View>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
        {order.status === 'ACTIVE' && order.startedAt ? (
          <View style={styles.metric}>
            <Text style={[styles.metricVal, { color: '#D97706', fontSize: 13 }]}>{elapsed(order.startedAt)}</Text>
            <Text style={styles.metricLbl}>Elapsed</Text>
          </View>
        ) : null}
        {order.slaCutoff ? (
          <View style={styles.metric}>
            <Text style={[styles.metricVal, { fontSize: 13 }]}>{order.slaCutoff}</Text>
            <Text style={styles.metricLbl}>SLA</Text>
          </View>
        ) : null}
      </View>

      {/* Hold reason */}
      {order.status === 'HOLD' && order.holdReason ? (
        <View style={styles.holdBadge}>
          <Text style={styles.holdText}>⏸ Held: {order.holdReason}</Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actions}>
        {order.status === 'UNASSIGNED' && (
          <Btn label="👥 Assign Team" onPress={() => onAction(order, 'assign')}
            bg={COLORS.blue} loading={busyAction === 'assign'} loadingLabel="Opening…"
            disabled={isBusy} full/>
        )}

        {order.status === 'ASSIGNED' && (
          <View style={styles.row}>
            <Btn label="✏️ Reassign" onPress={() => onAction(order, 'assign')}
              bg="transparent" color="#374151" border="#E5E7EB"
              loading={busyAction === 'assign'} loadingLabel="Opening…" disabled={isBusy}/>
            <View style={styles.gap}/>
            <Btn label="▶ Start" onPress={() => onAction(order, 'start')}
              bg={COLORS.orange} loading={busyAction === 'start'} loadingLabel="Starting…" disabled={isBusy}/>
          </View>
        )}

        {order.status === 'ACTIVE' && (
          <>
            <View style={styles.row}>
              <Btn label="⏸ Hold" onPress={() => onAction(order, 'hold')}
                bg="#FFF3E0" color={COLORS.amber} border="#FCD34D"
                loading={busyAction === 'hold'} loadingLabel="Holding…" disabled={isBusy}/>
              <View style={styles.gap}/>
              <Btn label="½ Split" onPress={() => onAction(order, 'partial')}
                bg="#FFF3E0" color={COLORS.orange} border="#FFB74D"
                loading={busyAction === 'partial'} loadingLabel="Opening…" disabled={isBusy}/>
            </View>
            <View style={styles.rowTop}>
              <Btn label="✅ Update / Complete" onPress={() => onAction(order, 'update')}
                bg={COLORS.primary} loading={busyAction === 'update'} loadingLabel="Opening…"
                disabled={isBusy} full/>
            </View>
          </>
        )}

        {order.status === 'HOLD' && (
          <Btn label="▶ Resume Work" onPress={() => onAction(order, 'unhold')}
            bg={COLORS.blue} loading={busyAction === 'unhold'} loadingLabel="Resuming…"
            disabled={isBusy} full/>
        )}

        {(order.status === 'DONE' || order.status === 'PARTIAL_DONE') && (
          <View style={[styles.donePill, {
            backgroundColor: order.status === 'PARTIAL_DONE' ? '#FFF3E0' : '#E8F5E9'
          }]}>
            <Text style={[styles.doneText, {
              color: order.status === 'PARTIAL_DONE' ? COLORS.orange : COLORS.primaryLight
            }]}>
              {order.status === 'PARTIAL_DONE' ? '½ Partial Done' : '✅ Completed'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardBusy:    { opacity: 0.85 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLeft:  { flex: 1, marginRight: 10 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  itemName:    { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  refRow:      { flexDirection: 'row', alignItems: 'center' },
  ref:         { fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF' },
  updatingRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  updatingText:{ fontSize: 10, color: '#9CA3AF' },
  client:      { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  metrics:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  metric:      { alignItems: 'center' },
  metricVal:   { fontSize: 18, fontWeight: '900', fontFamily: 'monospace', color: '#1F2937' },
  metricLbl:   { fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 1 },
  progressWrap:{ flex: 1, gap: 3 },
  progressBg:  { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 3 },
  pctText:     { fontSize: 10, color: '#6B7280', textAlign: 'right' },
  holdBadge:   { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA' },
  holdText:    { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  actions:     { gap: 6 },
  row:         { flexDirection: 'row', gap: 6 },
  rowTop:      { marginTop: 6 },
  gap:         { width: 6 },
  donePill:    { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  doneText:    { fontSize: 13, fontWeight: '700' },
})
