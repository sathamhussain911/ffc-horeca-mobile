import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, StatusBar, Modal, TextInput, ScrollView,
  Alert,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useAuthStore } from '../store/useAuthStore'
import { fetchGateLogs, gateCheckIn, gateCheckOut, scanEID } from '../lib/api'
import { COLORS } from '../lib/constants'
import { Btn, Spinner } from '../components/UI'
import Toast from 'react-native-toast-message'

const OS_SLOTS = Array.from({ length: 30 }, (_, i) => `OS-${String(i + 1).padStart(2, '0')}`)

interface GateLog {
  id: string
  osSlot: string
  staffName: string
  eidNumber: string
  checkIn: string
  checkOut: string | null
  durationMins: number | null
}

function timeAgo(dt: string) {
  const mins = Math.floor((Date.now() - new Date(dt).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

// ── EID Scan Modal ─────────────────────────────────────────
function ScanModal({ onClose, onScanned }: {
  onClose: () => void
  onScanned: (name: string, eid: string) => void
}) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning,   setScanning]   = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualEid,  setManualEid]  = useState('')
  const [mode,       setMode]       = useState<'camera' | 'manual'>('camera')
  const cameraRef = useRef<CameraView>(null)

  useEffect(() => {
    if (!permission?.granted) requestPermission()
  }, [])

  async function captureAndScan() {
    if (scanning || !cameraRef.current) return
    setScanning(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 })
      if (!photo?.base64) {
        Toast.show({ type: 'error', text1: 'Could not capture image' })
        setScanning(false)
        return
      }
      const res = await scanEID(photo.base64)
      if (res.success && res.text) {
        // Parse name and EID from OCR text
        // UAE EID format: 784-XXXX-XXXXXXX-X
        const text: string = res.text
        const eidMatch = text.match(/784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d{1}/)
        const eid = eidMatch ? eidMatch[0].replace(/\s/g, '') : ''

        // Extract name — usually appears as "Name:" label or all-caps line
        const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)
        const nameMatch = text.match(/Name[:\s]+([A-Z][A-Za-z\s]+)/i)
        const name = nameMatch
          ? nameMatch[1].trim()
          : lines.find((l: string) => /^[A-Z][A-Z\s]{5,}$/.test(l)) || ''

        if (eid || name) {
          onScanned(name || 'Unknown', eid || 'Unknown')
        } else {
          Toast.show({ type: 'error', text1: 'Could not read EID', text2: 'Try manual entry' })
          setMode('manual')
        }
      } else {
        Toast.show({ type: 'error', text1: res.error || 'Scan failed', text2: 'Try manual entry' })
        setMode('manual')
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Camera error — use manual entry' })
      setMode('manual')
    } finally {
      setScanning(false)
    }
  }

  function submitManual() {
    if (!manualName.trim() || !manualEid.trim()) {
      Toast.show({ type: 'error', text1: 'Enter name and EID number' })
      return
    }
    onScanned(manualName.trim(), manualEid.trim())
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={scan.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000"/>

        {/* Header */}
        <View style={scan.header}>
          <TouchableOpacity onPress={onClose} style={scan.closeBtn}>
            <Text style={scan.closeText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={scan.headerTitle}>Scan EID Card</Text>
          <View style={scan.tabs}>
            <TouchableOpacity onPress={() => setMode('camera')}
              style={[scan.modeBtn, mode === 'camera' && scan.modeBtnActive]}>
              <Text style={[scan.modeText, mode === 'camera' && scan.modeTextActive]}>📷 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('manual')}
              style={[scan.modeBtn, mode === 'manual' && scan.modeBtnActive]}>
              <Text style={[scan.modeText, mode === 'manual' && scan.modeTextActive]}>⌨️ Manual</Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'camera' ? (
          <View style={scan.cameraWrap}>
            {permission?.granted ? (
              <>
                <CameraView
                  ref={cameraRef}
                  style={scan.camera}
                  facing="back"
                />
                {/* Guide overlay */}
                <View style={scan.overlay} pointerEvents="none">
                  <Text style={scan.guideText}>Point at the EID card</Text>
                  <View style={scan.guideBox}/>
                  <Text style={scan.guideHint}>Hold steady, then tap Capture</Text>
                </View>

                {scanning && (
                  <View style={scan.scanningOverlay}>
                    <Spinner color="#fff" size="large"/>
                    <Text style={scan.scanningText}>Reading EID…</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[scan.captureBtn, scanning && { opacity: 0.5 }]}
                  onPress={captureAndScan}
                  disabled={scanning}
                  activeOpacity={0.85}>
                  <Text style={scan.captureText}>
                    {scanning ? '⏳ Scanning…' : '📷 Capture & Scan'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={scan.noPermWrap}>
                <Text style={scan.noPermText}>📷 Camera permission needed</Text>
                <TouchableOpacity onPress={requestPermission} style={scan.permBtn}>
                  <Text style={scan.permBtnText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('manual')} style={{ marginTop: 12 }}>
                  <Text style={{ color: '#60A5FA', fontWeight: '700' }}>Use Manual Entry →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <ScrollView style={scan.manualWrap} contentContainerStyle={{ padding: 24 }}>
            <Text style={scan.manualTitle}>Manual EID Entry</Text>
            <Text style={scan.manualSub}>Enter details exactly as on the EID card</Text>

            <Text style={scan.fieldLabel}>Full Name</Text>
            <TextInput
              style={scan.fieldInput}
              value={manualName}
              onChangeText={setManualName}
              placeholder="e.g. Mohammed Ahmed Al Rashid"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />

            <Text style={scan.fieldLabel}>EID Number</Text>
            <TextInput
              style={scan.fieldInput}
              value={manualEid}
              onChangeText={setManualEid}
              placeholder="784-XXXX-XXXXXXX-X"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
            />

            <TouchableOpacity style={scan.submitBtn} onPress={submitManual} activeOpacity={0.85}>
              <Text style={scan.submitText}>Confirm →</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

// ── Check-In Modal ─────────────────────────────────────────
function CheckInModal({ name, eid, occupiedSlots, onConfirm, onClose }: {
  name: string; eid: string; occupiedSlots: string[]
  onConfirm: (slot: string) => Promise<void>; onClose: () => void
}) {
  const [slot,    setSlot]    = useState('')
  const [loading, setLoading] = useState(false)
  const availableSlots = OS_SLOTS.filter(s => !occupiedSlots.includes(s))

  async function confirm() {
    if (!slot) { Toast.show({ type: 'error', text1: 'Select an OS slot' }); return }
    setLoading(true)
    await onConfirm(slot)
    setLoading(false)
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={() => !loading && onClose()}>
      <View style={ci.overlay}>
        <TouchableOpacity style={ci.backdrop} activeOpacity={1} onPress={() => !loading && onClose()}/>
        <View style={ci.sheet}>
          <View style={ci.handle}/>
          <Text style={ci.title}>Confirm Check-In</Text>

          <View style={ci.infoBox}>
            <Text style={ci.infoLabel}>Name</Text>
            <Text style={ci.infoValue}>{name}</Text>
            <Text style={ci.infoLabel}>EID Number</Text>
            <Text style={ci.infoValue}>{eid}</Text>
          </View>

          <Text style={ci.slotLabel}>Assign OS Slot ({availableSlots.length} available)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ci.slotsScroll}>
            <View style={ci.slotsRow}>
              {availableSlots.map(s => (
                <TouchableOpacity key={s} onPress={() => setSlot(s)}
                  style={[ci.slotBtn, slot === s && ci.slotBtnActive]}>
                  <Text style={[ci.slotText, slot === s && ci.slotTextActive]}>
                    {s.replace('OS-', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={ci.btnRow}>
            <TouchableOpacity style={ci.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={ci.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Btn label="✅ Check In" onPress={confirm}
                loading={loading} loadingLabel="Checking in…"
                disabled={!slot} bg={COLORS.primary} full/>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ── Main Security Screen ───────────────────────────────────
export default function SecurityScreen() {
  const { user, logout }                    = useAuthStore()
  const [logs,        setLogs]        = useState<GateLog[]>([])
  const [isLoading,   setIsLoading]   = useState(false)
  const [showScan,    setShowScan]    = useState(false)
  const [scannedName, setScannedName] = useState('')
  const [scannedEid,  setScannedEid]  = useState('')
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchGateLogs()
      if (res.success) setLogs(res.data || [])
    } catch {}
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { load() }, [])

  const active   = logs.filter(l => !l.checkOut)
  const occupied = active.map(l => l.osSlot)

  function handleScanned(name: string, eid: string) {
    setShowScan(false)
    setScannedName(name)
    setScannedEid(eid)
    setShowCheckIn(true)
  }

  async function confirmCheckIn(slot: string) {
    try {
      const res = await gateCheckIn({ osSlot: slot, staffName: scannedName, eidNumber: scannedEid })
      if (res.success) {
        Toast.show({ type: 'success', text1: `${scannedName} checked in`, text2: slot })
        setShowCheckIn(false)
        load()
      } else {
        Toast.show({ type: 'error', text1: res.error || 'Check-in failed' })
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Network error' })
    }
  }

  async function handleCheckOut(log: GateLog) {
    Alert.alert(
      'Check Out',
      `Check out ${log.staffName} (${log.osSlot})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out', style: 'destructive',
          onPress: async () => {
            setCheckingOut(log.id)
            try {
              const res = await gateCheckOut(log.id)
              if (res.success) {
                Toast.show({ type: 'success', text1: `${log.staffName} checked out` })
                load()
              } else {
                Toast.show({ type: 'error', text1: res.error || 'Failed' })
              }
            } catch {
              Toast.show({ type: 'error', text1: 'Network error' })
            } finally {
              setCheckingOut(null)
            }
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E"/>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>🛡 Security Gate</Text>
            <Text style={styles.userName}>{user?.name} · FFC HORECA</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{active.length}</Text>
            <Text style={styles.statLbl}>On Site</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{30 - occupied.length}</Text>
            <Text style={styles.statLbl}>Slots Free</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{logs.filter(l => l.checkOut).length}</Text>
            <Text style={styles.statLbl}>Left Today</Text>
          </View>
        </View>
      </View>

      <View style={styles.checkInWrap}>
        <TouchableOpacity style={styles.checkInBtn} onPress={() => setShowScan(true)} activeOpacity={0.85}>
          <Text style={styles.checkInIcon}>📷</Text>
          <View>
            <Text style={styles.checkInTitle}>Check In OS Staff</Text>
            <Text style={styles.checkInSub}>Scan EID or enter manually</Text>
          </View>
        </TouchableOpacity>
      </View>

      {active.length > 0 && (
        <Text style={styles.sectionTitle}>Currently On Site ({active.length})</Text>
      )}

      <FlatList
        data={logs}
        keyExtractor={l => l.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#1A237E"/>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚪</Text>
            <Text style={styles.emptyTitle}>No gate logs today</Text>
            <Text style={styles.emptyHint}>Check in OS staff using the button above</Text>
          </View>
        }
        renderItem={({ item: log }) => {
          const isActive = !log.checkOut
          const isBusy   = checkingOut === log.id
          return (
            <View style={[styles.logCard, isActive && styles.logCardActive]}>
              <View style={styles.logRow}>
                <View style={styles.slotBadge}>
                  <Text style={styles.slotText}>{log.osSlot}</Text>
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logName}>{log.staffName}</Text>
                  <Text style={styles.logEid}>{log.eidNumber}</Text>
                  <Text style={styles.logTime}>
                    In: {new Date(log.checkIn).toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai'
                    })}
                    {log.checkOut
                      ? `  ·  Out: ${new Date(log.checkOut).toLocaleTimeString('en-GB', {
                          hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai'
                        })}`
                      : `  ·  ${timeAgo(log.checkIn)}`
                    }
                    {log.durationMins ? `  ·  ${log.durationMins}m` : ''}
                  </Text>
                </View>
                {isActive ? (
                  <TouchableOpacity
                    style={[styles.checkOutBtn, isBusy && { opacity: 0.6 }]}
                    onPress={() => !isBusy && handleCheckOut(log)}
                    disabled={isBusy}
                    activeOpacity={0.8}>
                    {isBusy
                      ? <Spinner color="#fff" size="small"/>
                      : <Text style={styles.checkOutText}>Check Out</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <View style={styles.doneBadge}>
                    <Text style={styles.doneText}>Left</Text>
                  </View>
                )}
              </View>
            </View>
          )
        }}
      />

      {showScan && (
        <ScanModal onClose={() => setShowScan(false)} onScanned={handleScanned}/>
      )}
      {showCheckIn && (
        <CheckInModal
          name={scannedName}
          eid={scannedEid}
          occupiedSlots={occupied}
          onConfirm={confirmCheckIn}
          onClose={() => setShowCheckIn(false)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  header:       { backgroundColor: '#1A237E', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  appName:      { fontSize: 18, fontWeight: '900', color: '#fff' },
  userName:     { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn:    { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  logoutText:   { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsRow:     { flexDirection: 'row', gap: 12 },
  stat:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal:      { fontSize: 24, fontWeight: '900', color: '#fff', fontFamily: 'monospace' },
  statLbl:      { fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 2 },
  checkInWrap:  { padding: 12 },
  checkInBtn:   { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkInIcon:  { fontSize: 28 },
  checkInTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  checkInSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingBottom: 8 },
  list:         { paddingHorizontal: 12, paddingBottom: 32 },
  empty:        { alignItems: 'center', paddingVertical: 64 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyHint:    { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  logCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  logCardActive:{ borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  logRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotBadge:    { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 52 },
  slotText:     { fontSize: 13, fontWeight: '900', color: '#1D4ED8', fontFamily: 'monospace' },
  logInfo:      { flex: 1 },
  logName:      { fontSize: 14, fontWeight: '700', color: '#111827' },
  logEid:       { fontSize: 11, color: '#6B7280', fontFamily: 'monospace', marginTop: 1 },
  logTime:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  checkOutBtn:  { backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  checkOutText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  doneBadge:    { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  doneText:     { color: '#6B7280', fontSize: 12, fontWeight: '600' },
})

const scan = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  header:         { backgroundColor: '#111827', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn:       { marginBottom: 10 },
  closeText:      { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 14 },
  tabs:           { flexDirection: 'row', gap: 8 },
  modeBtn:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modeBtnActive:  { backgroundColor: COLORS.primary },
  modeText:       { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  modeTextActive: { color: '#fff' },
  cameraWrap:     { flex: 1 },
  camera:         { flex: 1 },
  overlay:        { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  guideText:      { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  guideBox:       { width: 300, height: 190, borderWidth: 2, borderColor: '#4ADE80', borderRadius: 12 },
  guideHint:      { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 12 },
  scanningOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', gap: 16 },
  scanningText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  captureBtn:     { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 50 },
  captureText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  noPermWrap:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#111827' },
  noPermText:     { color: '#fff', fontSize: 16 },
  permBtn:        { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText:    { color: '#fff', fontWeight: '700' },
  manualWrap:     { flex: 1, backgroundColor: '#fff' },
  manualTitle:    { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  manualSub:      { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput:     { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, marginBottom: 16, backgroundColor: '#F9FAFB' },
  submitBtn:      { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
})

const ci = StyleSheet.create({
  overlay:       { flex: 1, justifyContent: 'flex-end' },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:        { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:         { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  infoBox:       { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginBottom: 20, gap: 2 },
  infoLabel:     { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  infoValue:     { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  slotLabel:     { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8 },
  slotsScroll:   { marginBottom: 20, maxHeight: 70 },
  slotsRow:      { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  slotBtn:       { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  slotBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  slotText:      { fontSize: 13, fontWeight: '800', color: '#374151', fontFamily: 'monospace' },
  slotTextActive:{ color: '#1D4ED8' },
  btnRow:        { flexDirection: 'row', alignItems: 'center' },
  cancelBtn:     { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cancelText:    { fontSize: 14, fontWeight: '700', color: '#374151' },
})
