/**
 * Secure Storage Service
 * 
 * REQUIREMENT: "The login token is stored in secure device storage (Android Keystore),
 * not in plain local storage."
 * 
 * Implementation Details:
 * On Android, Expo SecureStore stores data in SharedPreferences encrypted using the
 * hardware-backed or software-backed Android Keystore system (KeyStore provider: 'AndroidKeyStore').
 * Cryptographic keys are managed within the Android Keystore and never exposed in plaintext.
 */

const TOKEN_KEY = 'projectflow_auth_token_secure';
const USER_KEY = 'projectflow_auth_user_secure';
const SERVER_URL_KEY = 'projectflow_server_url';

// In-memory fallback for environments without native Keystore (e.g. Node tests / web browser)
const memoryFallback = {};

let secureStoreModule = null;

async function getSecureStore() {
  if (secureStoreModule !== null) {
    return secureStoreModule || null;
  }
  try {
    const mod = await import('expo-secure-store');
    secureStoreModule = mod;
    return mod;
  } catch {
    secureStoreModule = false;
    return null;
  }
}

/**
 * Check if Android Keystore SecureStore is available on the current device
 */
async function isSecureStoreAvailable() {
  try {
    const store = await getSecureStore();
    if (store && typeof store.isAvailableAsync === 'function') {
      return await store.isAvailableAsync();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Save auth token to Android Keystore via SecureStore
 * @param {string} token 
 */
export async function saveToken(token) {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      await store.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: store.WHEN_UNLOCKED,
      });
    } else {
      memoryFallback[TOKEN_KEY] = token;
    }
    return true;
  } catch (error) {
    console.error('[SecureStorage] Error saving token to Android Keystore:', error);
    memoryFallback[TOKEN_KEY] = token;
    return false;
  }
}

/**
 * Retrieve auth token from Android Keystore via SecureStore
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      return await store.getItemAsync(TOKEN_KEY);
    }
    return memoryFallback[TOKEN_KEY] || null;
  } catch (error) {
    console.error('[SecureStorage] Error reading token from Android Keystore:', error);
    return memoryFallback[TOKEN_KEY] || null;
  }
}

/**
 * Delete auth token from Android Keystore via SecureStore
 */
export async function deleteToken() {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      await store.deleteItemAsync(TOKEN_KEY);
    }
    delete memoryFallback[TOKEN_KEY];
    return true;
  } catch (error) {
    console.error('[SecureStorage] Error deleting token from Android Keystore:', error);
    delete memoryFallback[TOKEN_KEY];
    return false;
  }
}

/**
 * Save user profile data
 */
export async function saveUser(user) {
  try {
    const serialized = JSON.stringify(user);
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      await store.setItemAsync(USER_KEY, serialized);
    } else {
      memoryFallback[USER_KEY] = serialized;
    }
  } catch (error) {
    console.error('[SecureStorage] Error saving user profile:', error);
  }
}

/**
 * Get user profile data
 */
export async function getUser() {
  try {
    const available = await isSecureStoreAvailable();
    const store = await getSecureStore();
    const data = available
      ? await store.getItemAsync(USER_KEY)
      : memoryFallback[USER_KEY];
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Delete stored user profile
 */
export async function deleteUser() {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      await store.deleteItemAsync(USER_KEY);
    }
    delete memoryFallback[USER_KEY];
  } catch (error) {
    console.error('[SecureStorage] Error deleting user profile:', error);
  }
}

/**
 * Custom Server URL configuration (allows switching between 10.0.2.2 for emulator, 
 * 192.168.1.9 for Wi-Fi device, and localhost for web)
 */
export async function saveServerUrl(url) {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      await store.setItemAsync(SERVER_URL_KEY, url);
    } else {
      memoryFallback[SERVER_URL_KEY] = url;
    }
  } catch {
    memoryFallback[SERVER_URL_KEY] = url;
  }
}

export async function getServerUrl() {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      const store = await getSecureStore();
      const stored = await store.getItemAsync(SERVER_URL_KEY);
      if (stored) return stored;
    }
    return memoryFallback[SERVER_URL_KEY] || null;
  } catch {
    return memoryFallback[SERVER_URL_KEY] || null;
  }
}
