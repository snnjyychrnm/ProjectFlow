import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { checkServerHealth, DEFAULT_SERVER_URLS } from '../services/api';

export default function ProfileScreen() {
  const { user, logout, serverUrl, changeServerUrl } = useAuth();
  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  function handleLogout() {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  async function handleSaveServerUrl(url) {
    await changeServerUrl(url);
    setCustomUrl(url);
    setHealthStatus(null);
    Alert.alert('Server Updated', `Active API URL set to:\n${url}`);
  }

  async function testConnection() {
    setIsCheckingHealth(true);
    setHealthStatus(null);
    try {
      const res = await checkServerHealth();
      if (res.ok) {
        setHealthStatus({
          ok: true,
          message: `Connected to PostgreSQL database: "${res.data.database}"`,
        });
      } else {
        setHealthStatus({
          ok: false,
          message: res.error || 'Server responded with error status',
        });
      }
    } catch (e) {
      setHealthStatus({ ok: false, message: e.message || 'Cannot reach server' });
    } finally {
      setIsCheckingHealth(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.full_name || 'Project User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.userIdBadge}>
          <Text style={styles.userIdText}>User ID: #{user?.id}</Text>
        </View>
      </View>

      {/* Security Architecture Badge */}
      <View style={styles.sectionCard}>
        <View style={styles.securityHeader}>
          <View style={styles.shieldCircle}>
            <Text style={styles.shieldIcon}>🛡️</Text>
          </View>
          <View style={styles.securityTitleGroup}>
            <Text style={styles.securityTitle}>Android Keystore Security</Text>
            <Text style={styles.securitySubtitle}>Hardware-backed protection enabled</Text>
          </View>
        </View>
        <Text style={styles.securityDescription}>
          Your authentication token is protected using Android Keystore cryptographic keys.
          Tokens are encrypted with AES-GCM and stored inside secure device storage, never in plain local storage.
        </Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>✓ Secure Device Storage Active</Text>
        </View>
      </View>

      {/* Backend & Database Connection */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shared Backend & Database</Text>
        <Text style={styles.sectionSubtitleText}>
          Connected to the same Express API and PostgreSQL database as the web application.
        </Text>

        <Text style={styles.fieldLabel}>Current API Base URL:</Text>
        <TextInput
          style={styles.urlInput}
          value={customUrl}
          onChangeText={setCustomUrl}
          autoCapitalize="none"
          placeholder="http://10.0.2.2:5000/api"
          placeholderTextColor={colors.textDim}
        />

        <View style={styles.presetButtonsRow}>
          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => handleSaveServerUrl(DEFAULT_SERVER_URLS.androidEmulator)}
          >
            <Text style={styles.presetBtnText}>Emulator (10.0.2.2)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetBtn}
            onPress={() => handleSaveServerUrl(DEFAULT_SERVER_URLS.androidDevice)}
          >
            <Text style={styles.presetBtnText}>Wi-Fi Device (192.168.1.9)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.saveUrlBtn}
            onPress={() => handleSaveServerUrl(customUrl)}
          >
            <Text style={styles.saveUrlBtnText}>Save URL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={testConnection}
            disabled={isCheckingHealth}
          >
            {isCheckingHealth ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.testBtnText}>Test Server</Text>
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
              {healthStatus.ok ? '✓ Connected: ' : '✕ Connection error: '}
              {healthStatus.message}
            </Text>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out from Mobile App</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 18,
    paddingBottom: 50,
  },
  profileCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
  },
  userName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  userIdBadge: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  userIdText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shieldCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shieldIcon: {
    fontSize: 18,
  },
  securityTitleGroup: {
    flex: 1,
  },
  securityTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  securitySubtitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  securityDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitleText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  urlInput: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetBtnText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  saveUrlBtn: {
    flex: 1,
    backgroundColor: colors.bgSurfaceLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveUrlBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  testBtn: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  testBtnText: {
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
  logoutButton: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
