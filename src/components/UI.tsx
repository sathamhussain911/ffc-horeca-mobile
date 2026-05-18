import React from 'react'
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  View,
} from 'react-native'

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ color = '#fff', size = 'small' }: { color?: string; size?: 'small' | 'large' }) {
  return <ActivityIndicator color={color} size={size}/>
}

// ── Button ─────────────────────────────────────────────────
interface BtnProps {
  label: string
  onPress: () => void
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  bg?: string
  color?: string
  border?: string
  full?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: string
}

export function Btn({
  label, onPress, loading, loadingLabel, disabled,
  bg = '#1B5E20', color = '#fff', border, full, size = 'md', icon,
}: BtnProps) {
  const isBusy = loading || disabled
  const pad = size === 'sm' ? 10 : size === 'lg' ? 18 : 13

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!isBusy}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bg, paddingVertical: pad },
        full && styles.full,
        border ? { borderWidth: 1.5, borderColor: border } : {},
        isBusy && styles.busy,
      ]}>
      {loading
        ? <>
            <Spinner color={color} size="small"/>
            <Text style={[styles.label, { color, marginLeft: 8 }]}>{loadingLabel || label}</Text>
          </>
        : <>
            {icon ? <Text style={{ fontSize: 14, marginRight: 6 }}>{icon}</Text> : null}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  )
}

// ── StatusBadge ────────────────────────────────────────────
export function StatusBadge({ bg, text, icon, label }: {
  bg: string; text: string; icon: string; label: string
}) {
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg }]}>
      <Text style={[badgeStyles.text, { color: text }]}>{icon} {label}</Text>
    </View>
  )
}

// ── TeamBadge ──────────────────────────────────────────────
export function TeamBadge({ teamName, colors }: { teamName: string; colors: Record<string, string> }) {
  const bg = colors[teamName] || '#616161'
  return (
    <View style={[teamStyles.wrap, { backgroundColor: bg }]}>
      <Text style={teamStyles.text}>{teamName}</Text>
    </View>
  )
}

// ── Divider ───────────────────────────────────────────────
export function Divider() {
  return <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }}/>
}

// ── Section Header ────────────────────────────────────────
export function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {count !== undefined && (
        <View style={sh.pill}>
          <Text style={sh.pillText}>{count}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, flex: 1 },
  full:  { flex: 0, width: '100%' },
  busy:  { opacity: 0.55 },
  label: { fontSize: 13, fontWeight: '800' },
})

const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 10, fontWeight: '700' },
})

const teamStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  text: { color: '#fff', fontSize: 11, fontWeight: '800' },
})

const sh = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  title:    { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  pill:     { backgroundColor: '#1B5E20', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
})
