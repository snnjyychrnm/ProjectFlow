import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { checkServerHealth, DEFAULT_SERVER_URLS } from '../services/api';
import NetworkBanner from '../components/NetworkBanner';

export default function AuthScreen() {
  const {
    login,
    register,
    authError,
    sessionExpiredMessage,
    clearAuthError,
    clearSessionExpiredMessage,
    serverUrl,
    changeServerUrl,
    networkError,
    clearNetworkError,
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Server settings collapsible
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  async function handleSubmit() {
    clearAuthError();
    clearSessionExpiredMessage();

    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter your email and password.');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        Alert.alert('Validation Error', 'Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Validation Error', 'Password must be at least 8 characters long.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await register(fullName.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch {
      // Error handled in AuthContext and rendered in UI
    } finally {
      setIsSubmitting(false);
    }
  }

  async function testServerConnection() {
    setIsCheckingHealth(true);
    setHealthStatus(null);
    try {
      const res = await checkServerHealth();
      if (res.ok) {
        setHealthStatus({ ok: true, message: `Connected to PostgreSQL database: "${res.data.database}"` });
      } else {
        setHealthStatus({ ok: false, message: res.error || 'Server responded with error status' });
      }
    } catch (e) {
      setHealthStatus({ ok: false, message: e.message || 'Cannot reach server' });
    } finally {
      setIsCheckingHealth(false);
    }
  }

  async function handleApplyServerUrl(url) {
    await changeServerUrl(url);
    setCustomUrl(url);
    setHealthStatus(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Network Error Alert */}
        {networkError ? (
          <NetworkBanner
            message={networkError}
            onRetry={testServerConnection}
            onDismiss={clearNetworkError}
          />
        ) : null}

        {/* REQUIREMENT: When token expires, user is sent back to login with a clear message */}
        {sessionExpiredMessage ? (
          <View style={styles.sessionExpiredCard}>
            <View style={styles.sessionExpiredHeader}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.sessionExpiredTitle}>Session Expired</Text>
            </View>
            <Text style={styles.sessionExpiredText}>{sessionExpiredMessage}</Text>
            <TouchableOpacity
              style={styles.dismissExpiredBtn}
              onPress={clearSessionExpiredMessage}
            >
              <Text style={styles.dismissExpiredText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Brand / Logo */}
        <View style={styles.brandHeader}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.appName}>ProjectFlow</Text>
          <Text style={styles.appTagline}>
            Unified Mobile & Web Task Management
          </Text>
          <View style={styles.keystoreBadge}>
            <Text style={styles.keystoreBadgeText}>🔒 Android Keystore Secured</Text>
          </View>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Mode Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => {
                setMode('login');
                clearAuthError();
              }}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Log In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => {
                setMode('register');
                clearAuthError();
              }}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {mode === 'login'
              ? 'Use your ProjectFlow web credentials to log in.'
              : 'Register your account to access tasks on mobile & web.'}
          </Text>

          {/* Auth Error Banner */}
          {authError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{authError}</Text>
            </View>
          ) : null}

          {/* Registration Full Name */}
          {mode === 'register' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textDim}
                autoCapitalize="words"
                maxLength={100}
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={255}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'}
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'login' ? 'Log In to Dashboard' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Connection Settings (Helpful for Android Emulator vs Device) */}
        <View style={styles.serverSection}>
          <TouchableOpacity
            style={styles.serverToggle}
            onPress={() => setShowServerSettings(!showServerSettings)}
          >
            <Text style={styles.serverToggleText}>
              ⚙️ Server Endpoint: {serverUrl} {showServerSettings ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showServerSettings && (
            <View style={styles.serverSettingsBox}>
              <Text style={styles.serverHelpText}>
                Select or enter the backend URL:
              </Text>

              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleApplyServerUrl(DEFAULT_SERVER_URLS.androidEmulator)}
                >
                  <Text style={styles.presetButtonText}>Android Emulator (10.0.2.2)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleApplyServerUrl(DEFAULT_SERVER_URLS.androidDevice)}
                >
                  <Text style={styles.presetButtonText}>Wi-Fi Device (192.168.1.9)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleApplyServerUrl(DEFAULT_SERVER_URLS.localhost)}
                >
                  <Text style={styles.presetButtonText}>Localhost (5000)</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, styles.serverInput]}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://10.0.2.2:5000/api"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
              />

              <View style={styles.serverActionRow}>
                <TouchableOpacity
                  style={styles.applyServerBtn}
                  onPress={() => handleApplyServerUrl(customUrl)}
                >
                  <Text style={styles.applyServerBtnText}>Save URL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testHealthBtn}
                  onPress={testServerConnection}
                  disabled={isCheckingHealth}
                >
                  {isCheckingHealth ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.testHealthBtnText}>Test Connection</Text>
                  )}
                </TouchableOpacity>
              </View>

              {healthStatus && (
                <View
                  style={[
                    styles.healthResult,
                    {
                      backgroundColor: healthStatus.ok ? colors.successBg : colors.dangerBg,
                      borderColor: healthStatus.ok ? colors.successBorder : colors.dangerBorder,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: healthStatus.ok ? colors.success : colors.danger,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {healthStatus.ok ? '✓ Backend Online! ' : '✕ Connection Failed: '}
                    {healthStatus.message}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  sessionExpiredCard: {
    backgroundColor: '#451a03',
    borderColor: '#f59e0b',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionExpiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sessionExpiredTitle: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '700',
  },
  sessionExpiredText: {
    color: '#fef3c7',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  dismissExpiredBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 6,
  },
  dismissExpiredText: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '600',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  appName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appTagline: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  keystoreBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  keystoreBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: {
    color: '#f87171',
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  serverSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  serverToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  serverToggleText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  serverSettingsBox: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  serverHelpText: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  presetRow: {
    gap: 6,
    marginBottom: 10,
  },
  presetButton: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  presetButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  serverInput: {
    marginTop: 6,
    marginBottom: 10,
  },
  serverActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyServerBtn: {
    flex: 1,
    backgroundColor: colors.bgSurfaceLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyServerBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  testHealthBtn: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  testHealthBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  healthResult: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
