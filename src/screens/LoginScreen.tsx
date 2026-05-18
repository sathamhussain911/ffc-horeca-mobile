import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { useAuthStore } from '../store/useAuthStore'
import { COLORS } from '../lib/constants'

export default function LoginScreen() {
  const { login, isLoading } = useAuthStore()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password')
      return
    }
    const result = await login(email.trim().toLowerCase(), password.trim())
    if (result.error) setError(result.error)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>🌿</Text>
          </View>
          <Text style={styles.appName}>FFC HORECA</Text>
          <Text style={styles.appSub}>Operations Center</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Use your FFC account credentials</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@freshfruitscompany.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              editable={!isLoading}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}>
            {isLoading
              ? <ActivityIndicator color="#fff" size="small"/>
              : <Text style={styles.btnText}>Sign In →</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Fresh Fruits Company · Dubai</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.primary },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:     { alignItems: 'center', marginBottom: 32 },
  logoWrap:   {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText:   { fontSize: 32 },
  appName:    { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  appSub:     { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' },
  card:       {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  title:      { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle:   { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  errorBox:   { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText:  { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  field:      { marginBottom: 16 },
  label:      { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB',
  },
  btn:        {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer:     { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 32 },
})
