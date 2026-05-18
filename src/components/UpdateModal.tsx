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

export default function UpdateModal({ order, onClose }: Props) {
  const { orderAction } = useOrdersStore()
  const [doneQty,    setDoneQty]    = useState(String(order?.doneQty || order?.totalQty || 0))
  const [reason,     setReason]     = useState('')
  const [reasonNote, setReasonNote] = useState('')
  const [saving,     setSaving]     = useState<'save' | 'complete' | null>(null)

  if (!order) return null

  const done    = Math.max(0, parseInt(doneQty) || 0)
  const ordered = order.totalQty
  const pending = Math.max(0, ordered - done)
  const isShort = done < ordered && done > 0
  const isOver  = done > ordered
  const pct     = ordered > 0 ? Math.min(100, Math.round((done / ordered) * 100)) : 0
  const canClose = done > 0 && !isOver && (!isShort || !!reason)
  const isBusy  = saving !== null

  async function save(complete: boolean) {
    if (complete && isShort && !reason) {
      Toast.show({ type: 'error', text1: 'Select a reason for short quantity' })
      return
    }
    setSaving(complete ? 'complete' : 'save')
    const notes = reason
      ? `[${REASONS.find(r => r.key === reason)?.label}] ${reasonNote} — Done: ${done}/${ordered}`
      : undefined
    try {
      const r = await orderAction(order!.id, {
        action: complete ? 'complete' : 'updateQty',
        doneQty: done,
        ...(notes ? { notes } : {}),
      })
      if (r?.error) { Toast.show({ type: 'error', text1: r.error }); setSaving(null); return }
      Toast.show({
        type: 'success',
        text1: complete
          ? isShort ? `Closed with ${pending} pending` : `${order!.ref} completed ✅`
          : 'Progress saved',
      })
      onClose()
    } catch {
      Toast.show({ type: 'error', text1: 'Failed' })
      setSaving(null)
    }
  }

  const borderColor = isOver ? '#FCA5A5' : isShort ? '#FCD34D' : '#E5E7EB'

  return (
    <Modal visible animationType="slide" transparent onRequestClose={() => !isBusy && onClose()}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => !isBusy && onClose()}/>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.handle}/>
            <Text style={styles.title}>Update Order</Text>
            <Text style={styles.sub}>{order.ref} · {order.itemName || order.category}</Text>

            {/* Stats */}
            <View style={styles.stats}>
              {[
                { label: 'Ordered', value: ordered, color: COLORS.blue },
                { label: 'Done',    value: done,    color: done >= ordered ? COLORS.primaryLight : done > 0 ? COLORS.orange : '#9CA3AF' },
                { label: 'Pending', value: pending, color: pending > 0 ? COLORS.red : COLORS.primaryLight },
              ].map(s => (
                <View key={s.label} style={styles.stat}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLbl}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Input */}
            <Text style={styles.label}>Done Qty (max {ordered})</Text>
            <TextInput
              style={[styles.input, { borderColor }]}
              value={doneQty}
              onChangeText={t => { setDoneQty(t); if (parseInt(t) >= ordered) setReason('') }}
              keyboardType="number-pad"
              editable={!isBusy}
            />
            {isOver && <Text style={styles.overText}>⚠ Cannot exceed {ordered}</Text>}

            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${pct}%` as any,
                backgroundColor: pct >= 100 ? '#22C55E' : pct >= 60 ? '#F97316' : '#EF4444',
              }]}/>
            </View>

            {/* Shortfall reason */}
            {isShort && (
              <View style={styles.shortBox}>
                <Text style={styles.shortTitle}>⚠ {pending} units short — why?</Text>
                {REASONS.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => !isBusy && setReason(r.key)}
                    style={[styles.reasonRow, reason === r.key && styles.reasonSelected]}
                    activeOpacity={0.8}>
                    <Text style={styles.reasonIcon}>{r.icon}</Text>
                    <Text style={styles.reasonLabel}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
                {reason && (
                  <TextInput
                    style={styles.noteInput}
                    value={reasonNote}
                    onChangeText={setReasonNote}
                    placeholder="Additional notes (optional)…"
                    placeholderTextColor="#9CA3AF"
                    editable={!isBusy}
                  />
                )}
              </View>
            )}

            {isShort && !reason && !isBusy && (
              <Text style={styles.hint}>Select a reason to close the order</Text>
            )}

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isBusy}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Btn label="💾 Save" onPress={() => save(false)}
                  loading={saving === 'save'} loadingLabel="Saving…"
                  bg="#2563EB" disabled={isBusy} full/>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Btn
                  label={isShort && done > 0 ? '⚠ Close' : '✅ Done'}
                  onPress={() => save(true)}
                  loading={saving === 'complete'}
                  loadingLabel={isShort ? 'Closing…' : 'Completing…'}
                  disabled={!canClose || isOver || isBusy}
                  bg={canClose && !isOver ? COLORS.primary : '#9CA3AF'}
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
  title:          { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  sub:            { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  stats:          { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat:           { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal:        { fontSize: 24, fontWeight: '900', fontFamily: 'monospace' },
  statLbl:        { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', marginTop: 2 },
  label:          { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:          { borderWidth: 2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 28, fontWeight: '900', fontFamily: 'monospace', textAlign: 'center', marginBottom: 8, backgroundColor: '#F9FAFB' },
  overText:       { color: '#EF4444', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  progressBg:     { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill:   { height: '100%', borderRadius: 4 },
  shortBox:       { borderWidth: 2, borderColor: '#FCD34D', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  shortTitle:     { backgroundColor: '#FFFBEB', paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, fontWeight: '800', color: '#92400E' },
  reasonRow:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#fff' },
  reasonSelected: { backgroundColor: '#FFFBEB' },
  reasonIcon:     { fontSize: 18, marginRight: 12 },
  reasonLabel:    { fontSize: 14, fontWeight: '700', color: '#374151' },
  noteInput:      { margin: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#F9FAFB' },
  hint:           { textAlign: 'center', fontSize: 12, color: '#D97706', fontWeight: '600', marginBottom: 12 },
  btnRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  cancelBtn:      { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cancelText:     { fontSize: 13, fontWeight: '700', color: '#374151' },
})
