import * as SecureStore from 'expo-secure-store'

export const API_BASE = 'https://ffc-horeca-ocs.vercel.app'

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('ffc_token')
  } catch {
    return null
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-mobile-token': token } : {}),
      ...options.headers,
    },
  })
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────
export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    // API returns { data: user, user: user, token: jwt, success: true }
    if (json.success) {
      const user = json.user || json.data
      const token = json.token
      if (user) await SecureStore.setItemAsync('ffc_user', JSON.stringify(user))
      if (token) await SecureStore.setItemAsync('ffc_token', token)
      return { success: true, user }
    }
    return { success: false, error: json.error || 'Login failed' }
  } catch {
    return { success: false, error: 'Network error — check connection' }
  }
}

export async function logout() {
  try {
    await SecureStore.deleteItemAsync('ffc_token')
    await SecureStore.deleteItemAsync('ffc_user')
  } catch {}
}

export async function getStoredUser() {
  try {
    const u = await SecureStore.getItemAsync('ffc_user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

// ── Orders ────────────────────────────────────────────────
export const fetchOrders = () => apiFetch('/api/orders')

export const orderAction = (id: string, body: Record<string, unknown>) =>
  apiFetch(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

// ── Gate (public — no auth needed) ───────────────────────
export async function fetchGateLogs() {
  const res = await fetch(`${API_BASE}/api/gate`)
  return res.json()
}

export async function gateCheckIn(data: { osSlot: string; staffName: string; eidNumber: string }) {
  const res = await fetch(`${API_BASE}/api/gate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function gateCheckOut(id: string) {
  const res = await fetch(`${API_BASE}/api/gate/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'checkout' }),
  })
  return res.json()
}

// ── OCR — API expects { base64, mimeType }, returns { text, success } ──
export async function scanEID(base64Image: string) {
  const res = await fetch(`${API_BASE}/api/vision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: base64Image, mimeType: 'image/jpeg' }),
  })
  return res.json()
}
