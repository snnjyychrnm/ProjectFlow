/**
 * API Client Service
 * 
 * Talks to the exact same backend and PostgreSQL database as the web application.
 * Backend endpoints:
 *  - /api/auth/*
 *  - /api/projects/*
 *  - /api/tasks/*
 *  - /api/dashboard
 *  - /api/health
 * 
 * Features:
 *  - Secure Token Injection (reads from Android Keystore via storage.js)
 *  - Session Expiry Detection (HTTP 401 -> clears Keystore, redirects to Login with message)
 *  - Offline / Network Error Handling (no crash, clear message)
 *  - Configurable server URL for Android Emulator (10.0.2.2), Wi-Fi (192.168.1.9), or Localhost
 */

import { Platform } from 'react-native';
import { getToken, saveToken, deleteToken, getServerUrl, saveServerUrl } from './storage.js';

const platformOS = Platform.OS;

// Default endpoint resolution
// Android Emulator uses 10.0.2.2 to access host machine's localhost
// Physical devices can use the machine's local network IP or custom server URL
export const DEFAULT_SERVER_URLS = {
  androidEmulator: 'http://10.0.2.2:5000/api',
  androidDevice: 'http://192.168.1.9:5000/api',
  localhost: 'http://localhost:5000/api',
};

// Start with standard Android default
let currentBaseUrl = platformOS === 'android'
  ? DEFAULT_SERVER_URLS.androidDevice
  : DEFAULT_SERVER_URLS.localhost;

// Callbacks for auth expiry and network errors
let tokenExpiredListeners = [];
let networkStatusListeners = [];

export function onTokenExpired(callback) {
  tokenExpiredListeners.push(callback);
  return () => {
    tokenExpiredListeners = tokenExpiredListeners.filter((cb) => cb !== callback);
  };
}

export function onNetworkStatusChanged(callback) {
  networkStatusListeners.push(callback);
  return () => {
    networkStatusListeners = networkStatusListeners.filter((cb) => cb !== callback);
  };
}

function notifyTokenExpired(message = 'Your session has expired. Please log in again.') {
  tokenExpiredListeners.forEach((cb) => {
    try {
      cb(message);
    } catch (e) {
      console.error('Error in tokenExpiredListener:', e);
    }
  });
}

function notifyNetworkStatus(isOnline, message = '') {
  networkStatusListeners.forEach((cb) => {
    try {
      cb({ isOnline, message });
    } catch (e) {
      console.error('Error in networkStatusListener:', e);
    }
  });
}

/**
 * Initialize base URL from storage if previously saved
 */
export async function initApiBaseUrl() {
  const saved = await getServerUrl();
  if (saved) {
    currentBaseUrl = saved;
  }
  return currentBaseUrl;
}

export function getBaseUrl() {
  return currentBaseUrl;
}

export async function setBaseUrl(newUrl) {
  let cleaned = newUrl.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  currentBaseUrl = cleaned;
  await saveServerUrl(cleaned);
  return currentBaseUrl;
}

/**
 * Generic API request wrapper with secure token injection,
 * session expiration handling, and network error resilience.
 */
export async function apiRequest(path, options = {}) {
  const token = await getToken();
  const url = `${currentBaseUrl}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    notifyNetworkStatus(true);

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    // REQUIREMENT: When token expires (HTTP 401), user is sent back to login with a clear message
    if (response.status === 401) {
      await deleteToken();
      const expiryMsg = data.message || 'Your session has expired. Please log in again.';
      notifyTokenExpired(expiryMsg);
      const err = new Error(expiryMsg);
      err.isAuthExpired = true;
      err.status = 401;
      throw err;
    }

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // If it's already an auth expiration error, rethrow it directly
    if (error.isAuthExpired) {
      throw error;
    }

    // Network / Offline error handling
    // Catch fetch network errors (offline, connection refused, DNS failure, timeout)
    const isNetwork =
      error.name === 'AbortError' ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('fetch failed') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('ECONNREFUSED');

    if (isNetwork) {
      const networkMessage = error.name === 'AbortError'
        ? 'Connection timed out. Server did not respond in time.'
        : 'Cannot connect to server. Please check your internet connection.';
      
      notifyNetworkStatus(false, networkMessage);

      const netErr = new Error(networkMessage);
      netErr.isNetworkError = true;
      netErr.originalError = error;
      throw netErr;
    }

    throw error;
  }
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------

export async function loginUser(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    await saveToken(data.token);
  }
  return data;
}

export async function registerUser(fullName, email, password) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  });

  if (data.token) {
    await saveToken(data.token);
  }
  return data;
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

export async function logoutUser() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.log('Server logout call failed (offline or token expired):', e.message);
  } finally {
    // Ensure token is discarded from Android Keystore
    await deleteToken();
  }
}

// ----------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------

export async function checkServerHealth() {
  try {
    const rootUrl = currentBaseUrl.replace(/\/api$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(`${rootUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      return { ok: true, data: await res.json() };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ----------------------------------------------------
// Dashboard Endpoints
// ----------------------------------------------------

export async function getDashboard() {
  const data = await apiRequest('/dashboard');
  return data.dashboard;
}

// ----------------------------------------------------
// Projects Endpoints
// ----------------------------------------------------

export async function getProjects() {
  const data = await apiRequest('/projects');
  return data.projects || [];
}

export async function getProject(id) {
  const data = await apiRequest(`/projects/${id}`);
  return data.project;
}

export async function createProject(projectData) {
  const data = await apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
  return data.project;
}

export async function updateProject(id, projectData) {
  const data = await apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  });
  return data.project;
}

export async function deleteProject(id) {
  return apiRequest(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// Tasks Endpoints
// ----------------------------------------------------

export async function getTasks() {
  const data = await apiRequest('/tasks');
  return data.tasks || [];
}

export async function getTask(id) {
  const data = await apiRequest(`/tasks/${id}`);
  return data.task;
}

function normalizeDueDate(dueDate) {
  if (!dueDate) return null;
  const str = String(dueDate).trim();
  if (!str) return null;
  return str.slice(0, 10);
}

export async function createTask(taskData) {
  const payload = {
    ...taskData,
    dueDate: normalizeDueDate(taskData.dueDate),
  };
  const data = await apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.task;
}

export async function updateTask(id, taskData) {
  const payload = {
    ...taskData,
    dueDate: normalizeDueDate(taskData.dueDate),
  };
  const data = await apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.task;
}

export async function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}
