import React, { useState } from 'react'
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ScrollView, TextInput,
} from 'react-native'
import { useOrdersStore, ProductionOrder } from '../store/useOrdersStore'
import { COLORS, TEAMS, TEAM_COLORS } from '../lib/constants'
import { Btn } from './UI'
import Toast from 'react-native-toast-message'

interface Props {
  order: ProductionOrder | null
  busyTeams: string[]
  onClose: () => void
}

export default function AssignModal({ order, busyTeams, onClose }: Props) {
  const { orderAction } = useOrdersStore()
  const [team,    setTeam]    = useState(order?.teamName || '')
  const [qty,     setQty]     = useState(String(order?.totalQty || ''))
  const [loading, setLoading] = useState(false)

  if (!order) return null

  async function save() {
    if (!team) { Toast.show({ type: 'error', text1: 'Select a team first' }); return }
    setLoading(true)
    try {
      const r = await orderAction(order!.id, {
        action: 'assign', teamName: team,
        totalQty: parseInt(qty) || order!.totalQty,
      })
      if (r?.error) { Toast.show({ type: 'error', text1: r.error }); return }
      Toast.show({ type: 'success', text1: `${order!.ref} → ${team}` })
      onClose()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to assign' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={() => !loading && onClose()}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => !loading && onClose()}/>
        <View style={styles.sheet}>
          <View style={styles.handle}/>
          <Text style={styles.title}>Assign Team</Text>
          <Text style={styles.sub}>{order.ref} · {order.itemName || order.category}</Text>

          {/* Team grid */}
          <Text style={styles.label}>Select Team</Text>
          <View style={styles.teamGrid}>
            {TEAMS.map(t => {
              const isBusy = busyTeams.includes(t) && t !== order.teamName
              const isSelected = team === t
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => !isBusy && !loading && setTeam(t)}
                  disabled={isBusy || loading}
                  style={[
                    styles.teamBtn,
                    isSelected && { backgroundColor: TEAM_COLORS[t] },
                    isBusy && styles.teamBusy,
                  ]}
                  activeOpacity={0.8}>
                  <Text style={[styles.teamLabel, isSelected && { color: '#fff' }]}>
                    {t.replace('Team ', '')}
                  </Text>
                  {isBusy && <View style={styles.busyDot}/>}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Qty */}
          <Text style={styles.label}>Total Qty</Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="number-pad"
            editable={!loading}
          />

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Btn
                label="Assign →"
                onPress={save}
                loading={loading}
                loadingLabel="Assigning…"
                disabled={!team}
                bg={COLORS.primary}
                full
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end' },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:     { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  sub:        { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  label:      { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  teamGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  teamBtn:    { width: '18%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  teamBusy:   { opacity: 0.35 },
  teamLabel:  { fontSize: 12, fontWeight: '800', color: '#374151' },
  busyDot:    { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  input:      { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'monospace', marginBottom: 24, backgroundColor: '#F9FAFB' },
  btnRow:     { flexDirection: 'row', alignItems: 'center' },
  cancelBtn:  { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#374151' },
})
