import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '../src/store/useAuthStore'
import LoginScreen from '../src/screens/LoginScreen'
import SupervisorScreen from '../src/screens/SupervisorScreen'
import SecurityScreen from '../src/screens/SecurityScreen'

const COLORS = { primary: '#1B5E20' }

function AppContent() {
  const { user, isChecking, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [])

  // Still loading stored session
  if (isChecking) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingIcon}>
          <Text style={{ fontSize: 36 }}>🌿</Text>
        </View>
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 24 }}/>
        <Text style={styles.loadingText}>FFC HORECA</Text>
      </View>
    )
  }

  // Not logged in
  if (!user) return <LoginScreen/>

  // Route by role
  const role = user.role

  if (role === 'VIEWER' && user.email === 'security@ffc-horeca.com') {
    return <SecurityScreen/>
  }

  if (role === 'ADMIN' || role === 'SUPERVISOR' || role === 'DATA_ENTRY') {
    return <SupervisorScreen/>
  }

  // Fallback — viewer with no specific role
  return <SupervisorScreen/>
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent/>
        <Toast/>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  loading:      { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  loadingIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  loadingText:  { color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginTop: 16, fontWeight: '700' },
})
