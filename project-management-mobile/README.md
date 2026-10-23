# ProjectFlow Android Mobile Application

A cross-platform React Native / Android mobile application built to communicate with the exact same Express backend and PostgreSQL database as the ProjectFlow web application.

---

## 🌟 Key Features & Requirements Matrix

| Requirement | Implementation Details |
|---|---|
| **Android Required** | Built with React Native & Expo for Android, supporting Android Emulators and physical Android devices via Expo Go or native APK. |
| **Same Backend & DB** | Connects to `http://10.0.2.2:5000/api` (Android Emulator) or `http://192.168.1.9:5000/api` (LAN device). Zero backend changes. |
| **Shared Authentication** | Register, log in, and log out with the same accounts used on the web (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`). |
| **Secure Device Storage (Android Keystore)** | The authentication JWT is stored in hardware/software-backed **Android Keystore** via `expo-secure-store`. It is never stored in unencrypted plain local storage. |
| **Dashboard** | View real-time statistics: Total Projects, Total Tasks, Completed Tasks, Pending Tasks, and Projects in Progress directly from `/api/dashboard`. |
| **Projects & Grouped Tasks** | View all projects and expand/collapse to view all tasks under each project. |
| **Task Management CRUD** | Create, edit, and delete tasks with validated modal forms. |
| **Status & Priority Controls** | Checkbox toggle to mark completed, plus instant status picker (Pending / In Progress / Completed) and priority picker (Low / Medium / High). |
| **Search & Filters** | Real-time text search and filter chips for Status, Priority, and Project. |
| **Pull-to-Refresh Sync** | Android `RefreshControl` on Dashboard, Projects, and Tasks. Changes made on Web instantly appear on Mobile upon pull-to-refresh, and vice-versa. |
| **Session Expiration (401)** | Automatically intercepts 401 Unauthorized responses, clears token from Android Keystore, redirects to Login, and displays: *"Your session has expired. Please log in again."* |
| **Offline / Network Resilience** | Intercepts connection errors, timeouts, and offline states. Displays a clear network warning banner with a **Retry** button instead of a blank screen or crash. |

---

## 📁 Project Structure

```
project-management-mobile/
├── assets/                          # App icons and splash assets
├── src/
│   ├── components/
│   │   ├── Badges.js               # StatusBadge & PriorityBadge components
│   │   ├── NetworkBanner.js        # Offline notice banner with Retry action
│   │   └── TaskModal.js            # Modal dialog for creating and editing tasks
│   ├── context/
│   │   └── AuthContext.js          # Authentication state, session restoration, & expiry listener
│   ├── screens/
│   │   ├── AuthScreen.js           # Login & Registration with Keystore indicator and Server Switcher
│   │   ├── DashboardScreen.js      # Statistics overview with pull-to-refresh
│   │   ├── ProjectsScreen.js       # Projects list with collapsible tasks under each project
│   │   ├── TasksScreen.js          # Task list with search, filter chips, CRUD, & status changes
│   │   └── ProfileScreen.js        # User details, Keystore security badge, & Server configuration
│   ├── services/
│   │   ├── api.js                  # Centralized API client with interceptors & network handlers
│   │   └── storage.js              # Android Keystore secure storage abstraction
│   └── theme/
│       └── colors.js               # Dark-mode styling tokens aligned with the web app
├── App.js                          # Root application with Tab Navigation
├── index.js                        # Entry point
├── app.json                        # Expo Android configuration & Keystore permissions
├── package.json                    # Project dependencies
├── test-mobile-flow.js             # Verification script for auth, Keystore, network, & expiry
└── test-mobile-crud.js             # Verification script for task CRUD and live dashboard sync
```

---

## 🔒 Android Keystore Implementation

The application strictly fulfills the requirement:
> *"The login token is stored in secure device storage (Android Keystore), not in plain local storage."*

In `src/services/storage.js`:
- Uses `expo-secure-store`, which interfaces directly with Android's `KeyStore` provider (`AndroidKeyStore`).
- Under the hood on Android, encryption keys are generated and stored in the Android Keystore system. Values are encrypted with AES-GCM (or RSA) and written to `EncryptedSharedPreferences`.
- Plaintext tokens are **never** written to `localStorage` or unencrypted `AsyncStorage`.

---

## 🌐 Network Configuration & Android IP Routing

Because Android Emulators and physical devices communicate with host machines differently:
- **Android Emulator**: Uses `http://10.0.2.2:5000/api` (default) to reach `http://localhost:5000` on the PC.
- **Physical Android Phone**: Uses `http://192.168.1.9:5000/api` (PC's local Wi-Fi IP).
- **Web / Desktop**: Uses `http://localhost:5000/api`.

An in-app **Server Configuration** widget is built directly into the Login screen and Profile screen, allowing testers to switch presets or test server reachability live with one tap.

---

## 🚀 How to Run the Mobile App

### 1. Ensure the Backend is Running
From `backend/`:
```bash
npm start
# Backend running at http://localhost:5000
```

### 2. Start the Mobile Application
From `project-management-mobile/`:
```bash
# Start Metro bundler / Expo dev server
npx expo start
```

### 3. Open on Android
- **Physical Device**: Install **Expo Go** from the Google Play Store, open the camera, and scan the QR code printed in the terminal.
- **Android Emulator**: Press `a` in the terminal to launch on a running Android emulator.
- **Web Preview**: Press `w` in the terminal to preview in a web browser.

---

## 🧪 Automated Verification Scripts

Two automated verification suites are included:

1. **`node test-mobile-flow.js`**:
   - Tests Android Keystore secure token storage, retrieval, and deletion.
   - Tests user registration and login against PostgreSQL.
   - Tests 401 session expiry auto-logout and clear message delivery.
   - Tests network failure handling (no crash, clear error banner).

2. **`node test-mobile-crud.js`**:
   - Creates a shared project.
   - Creates a task under that project.
   - Updates task priority and changes status (Pending -> In Progress -> Completed).
   - Validates live recalculation of Dashboard metrics.
   - Deletes task.
