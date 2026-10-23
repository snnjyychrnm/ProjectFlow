package com.projectflow.app.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Android Keystore Security Architecture Reference
 * 
 * Requirement:
 * "The login token is stored in secure device storage (Android Keystore),
 * not in plain local storage."
 * 
 * In this implementation:
 * 1. MasterKey is created using AES256_GCM in the AndroidKeyStore provider.
 * 2. EncryptedSharedPreferences encrypts both keys and values using Keystore-backed keys.
 * 3. The raw JWT token is never persisted in plain SharedPreferences or SQLite.
 */
class KeystoreManager(context: Context) {

    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "projectflow_secure_keystore_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token_keystore"
        private const val KEY_USER_DATA = "user_data_keystore"
    }

    fun saveToken(token: String) {
        sharedPreferences.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .apply()
    }

    fun getToken(): String? {
        return sharedPreferences.getString(KEY_AUTH_TOKEN, null)
    }

    fun deleteToken() {
        sharedPreferences.edit()
            .remove(KEY_AUTH_TOKEN)
            .apply()
    }

    fun clearAll() {
        sharedPreferences.edit()
            .clear()
            .apply()
    }
}
