import React, { useState } from 'react'
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  TextInput, ScrollView,
} from 'react-native'
import { useOrdersStore, ProductionOrder } from '../store/useOrdersStore'
import { COLORS, REASONS } from '../lib/constants'
import { Btn } from './UI'
import Toast from 'react-native-toast-message'

interface Props {
  order: ProductionOrder | null
  onClose: () => void
}

export default function SplitModal({ order, onClose }: Props) {
  const { orderAction } = useOrdersStore()
  const [doneQty, setDoneQty] = useState(String(order?.doneQty || 0))
  const [reason,  setReason]  = useState('SHORT_STOCK')
  const [saving,  setSaving]  = useState(false)

  if (!order) return null

  const done      = Math.max(0, parseInt(doneQty) || 0)
  const ordered   = order.totalQty
  const remaining = Math.max(0, ordered - done)
  const canSave   = done > 0 && done < ordered && !!reason

  async function save() {
    if (!canSave) return
    setSaving(true)
    try {
      const r = await orderAction(order!.id, {
        action: 'partial_done', doneQty: done, partialReason: reason,
      })
      if (r?.error) { Toast.show({ type: 'error', text1: r.error }); setSaving(false); return }
      Toast.show({ type: 'success', text1: `½ Split done`, text2: `Part 2 (${remaining} units) queued` })
      onClose()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to split' })
      setSaving(false)
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={() => !saving && onClose()}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => !saving && onClose()}/>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.handle}/>

            {/* Title */}
            <View style={styles.titleRow}>
              <View style={styles.halfIcon}><Text style={styles.halfText}>½</Text></View>
              <View>
                <Text style={styles.title}>Split Task</Text>
                <Text style={styles.sub}>{order.ref} · {order.itemName || order.category}</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>What happens:</Text>
              <Text style={styles.infoItem}>• Part 1 closes with units done so far</Text>
              <Text style={styles.infoItem}>• Team is freed immediately</Text>
              <Text style={styles.infoItem}>• Part 2 auto-created with remaining units</Text>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              {[
                { label: 'Ordered',    value: ordered,   color: COLORS.blue },
                { label: 'Done (P1)',  value: done,      color: done > 0 ? COLORS.orange : '#9CA3AF' },
                { label: '→ Part 2',  value: remaining, color: remaining > 0 ? COLORS.red : COLORS.primaryLight },
              ].map(s => (
                <View key={s.label} style={styles.stat}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLbl}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Input */}
            <Text style={styles.label}>Units done in Part 1 (must be less than {ordered})</Text>
            <TextInput
              style={[styles.input, {
                borderColor: done >= ordered ? '#FCA5A5' : done > 0 ? '#86EFAC' : '#E5E7EB'
              }]}
              value={doneQty}
              onChangeText={setDoneQty}
              keyboardType="number-pad"
              editable={!saving}
            />
            {done >= ordered && <Text style={styles.overText}>⚠ Must be less than {ordered}</Text>}

            {/* Reason */}
            <Text style={styles.label}>Reason for split</Text>
            {REASONS.map(r => (
              <TouchableOpacity
                key={r.key}
                onPress={() => !saving && setReason(r.key)}
                style={[styles.reasonRow, reason === r.key && styles.reasonSelected]}
                activeOpacity={0.8}>
                <Text style={styles.reasonIcon}>{r.icon}</Text>
                <Text style={styles.reasonLabel}>{r.label}</Text>
                {reason === r.key && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Btn
                  label={`½ Close Part 1 (${done} units)`}
                  onPress={save}
                  loading={saving}
                  loadingLabel="Splitting…"
                  disabled={!canSave}
                  bg={canSave ? COLORS.orange : '#9CA3AF'}
                  full/>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: 'flex-end' },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '92%' },
  handle:         { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  halfIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  halfText:       { fontSize: 22, fontWeight: '900', color: COLORS.orange },
  title:          { fontSize: 20, fontWeight: '800', color: '#111827' },
  sub:            { fontSize: 12, color: '#6B7280' },
  infoBox:        { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 12, marginBottom: 16 },
  infoTitle:      { fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginBottom: 4 },
  infoItem:       { fontSize: 12, color: '#2563EB', marginTop: 2 },
  stats:          { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat:           { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal:        { fontSize: 22, fontWeight: '900', fontFamily: 'monospace' },
  statLbl:        { fontSize: 9, color: '#6B7280', textTransform: 'uppercase', marginTop: 2 },
  label:          { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:          { borderWidth: 2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 28, fontWeight: '900', fontFamily: 'monospace', textAlign: 'center', marginBottom: 8, backgroundColor: '#F9FAFB' },
  overText:       { color: '#EF4444', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  reasonRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#F3F4F6', backgroundColor: '#fff', marginBottom: 8 },
  reasonSelected: { borderColor: '#FB923C', backgroundColor: '#FFF7ED' },
  reasonIcon:     { fontSize: 18, marginRight: 12 },
  reasonLabel:    { fontSize: 14, fontWeight: '700', color: '#374151', flex: 1 },
  check:          { fontSize: 16, color: COLORS.orange, fontWeight: '800' },
  btnRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  cancelBtn:      { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cancelText:     { fontSize: 14, fontWeight: '700', color: '#374151' },
})
