import { create } from 'zustand'
import { login as apiLogin, logout as apiLogout, getStoredUser } from '../lib/api'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SUPERVISOR' | 'DATA_ENTRY' | 'VIEWER'
}

interface AuthStore {
  user: SessionUser | null
  isLoading: boolean
  isChecking: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isChecking: true,

  checkAuth: async () => {
    set({ isChecking: true })
    const user = await getStoredUser()
    set({ user, isChecking: false })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const json = await apiLogin(email, password)
      if (json.success && json.user) {
        set({ user: json.user, isLoading: false })
        return {}
      }
      set({ isLoading: false })
      return { error: json.error || 'Invalid credentials' }
    } catch {
      set({ isLoading: false })
      return { error: 'Network error — check connection' }
    }
  },

  logout: async () => {
    await apiLogout()
    set({ user: null })
  },
}))
