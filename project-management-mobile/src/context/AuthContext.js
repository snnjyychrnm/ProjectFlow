/**
 * Auth Context
 * 
 * Manages user authentication state, session restoration from Android Keystore,
 * token expiration redirects, and network connectivity state.
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser as apiGetCurrentUser,
  logoutUser as apiLogout,
  onTokenExpired,
  onNetworkStatusChanged,
  initApiBaseUrl,
  setBaseUrl,
  getBaseUrl,
} from '../services/api';
import {
  getToken,
  saveToken,
  deleteToken,
  getUser,
  saveUser,
  deleteUser,
} from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [serverUrl, setServerUrlState] = useState(getBaseUrl());

  // Restore authenticated session from Android Keystore on startup
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        await initApiBaseUrl();
        if (isMounted) setServerUrlState(getBaseUrl());

        // Read token from Android Keystore
        const storedToken = await getToken();
        if (!storedToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Verify token with backend /api/auth/me
        const data = await apiGetCurrentUser();
        if (isMounted && data?.user) {
          setUser(data.user);
          setToken(storedToken);
          await saveUser(data.user);
        }
      } catch (err) {
        console.log('[AuthContext] Session restore note:', err.message);
        // If token was invalid or expired, clear it
        if (err.isAuthExpired || err.status === 401) {
          await deleteToken();
          await deleteUser();
          if (isMounted) {
            setSessionExpiredMessage('Your previous session has expired. Please log in.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // Listen for 401 session expiry from any API request
    const unsubscribeTokenExpiry = onTokenExpired((message) => {
      if (isMounted) {
        setUser(null);
        setToken(null);
        setSessionExpiredMessage(message || 'Your session has expired. Please log in again.');
      }
    });

    // Listen for network connectivity issues
    const unsubscribeNetwork = onNetworkStatusChanged(({ isOnline, message }) => {
      if (isMounted) {
        setNetworkError(isOnline ? '' : message);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeTokenExpiry();
      unsubscribeNetwork();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError('');
    setSessionExpiredMessage('');
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      setToken(data.token);
      await saveUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.isNetworkError
        ? 'Cannot connect to server. Check your internet connection.'
        : err.message || 'Login failed. Please check your credentials.';
      setAuthError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    setAuthError('');
    setSessionExpiredMessage('');
    try {
      const data = await apiRegister(fullName, email, password);
      setUser(data.user);
      setToken(data.token);
      await saveUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.isNetworkError
        ? 'Cannot connect to server. Check your internet connection.'
        : err.message || 'Registration failed. Please try again.';
      setAuthError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignored
    } finally {
      await deleteToken();
      await deleteUser();
      setUser(null);
      setToken(null);
      setAuthError('');
      setSessionExpiredMessage('');
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  const clearSessionExpiredMessage = useCallback(() => {
    setSessionExpiredMessage('');
  }, []);

  const clearNetworkError = useCallback(() => {
    setNetworkError('');
  }, []);

  const changeServerUrl = useCallback(async (newUrl) => {
    const updated = await setBaseUrl(newUrl);
    setServerUrlState(updated);
    setNetworkError('');
    return updated;
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    authError,
    sessionExpiredMessage,
    networkError,
    serverUrl,
    login,
    register,
    logout,
    clearAuthError,
    clearSessionExpiredMessage,
    clearNetworkError,
    changeServerUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
