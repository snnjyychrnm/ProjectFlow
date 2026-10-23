import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import TasksScreen from './src/screens/TasksScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TaskModal from './src/components/TaskModal';
import { getProjects, createTask } from './src/services/api';

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tasksProjectFilter, setTasksProjectFilter] = useState('All');

  // Quick add task from Projects or Dashboard
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [quickAddProjectId, setQuickAddProjectId] = useState(null);
  const [allProjects, setAllProjects] = useState([]);

  // Loading state while restoring token from Android Keystore
  if (isLoading) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashContent}>
          <View style={styles.splashLogoCircle}>
            <Text style={styles.splashLogoText}>P</Text>
          </View>
          <Text style={styles.splashTitle}>ProjectFlow</Text>
          <Text style={styles.splashSubtitle}>
            Restoring session from Android Keystore...
          </Text>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // If not authenticated, render Login/Register AuthScreen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.rootSafeArea}>
        <StatusBar style="light" />
        <AuthScreen />
      </SafeAreaView>
    );
  }

  // Cross-screen navigation helper
  function handleNavigate(targetTab, params = {}) {
    if (params?.projectId) {
      setTasksProjectFilter(String(params.projectId));
    }
    setActiveTab(targetTab);
  }

  // Quick create task modal opener
  async function handleOpenCreateTask(projectId) {
    try {
      const projs = await getProjects();
      setAllProjects(projs || []);
      setQuickAddProjectId(projectId);
      setQuickAddModalVisible(true);
    } catch {
      // Handled inside modal
    }
  }

  async function handleQuickSaveTask(taskData) {
    await createTask(taskData);
    setActiveTab('Tasks');
  }

  return (
    <SafeAreaView style={styles.rootSafeArea}>
      <StatusBar style="light" />

      {/* Screen Content */}
      <View style={styles.mainScreenContainer}>
        {activeTab === 'Dashboard' && (
          <DashboardScreen onNavigate={handleNavigate} />
        )}

        {activeTab === 'Projects' && (
          <ProjectsScreen
            onOpenCreateTask={handleOpenCreateTask}
            onSelectProjectFilter={(projId) => {
              setTasksProjectFilter(String(projId));
              setActiveTab('Tasks');
            }}
          />
        )}

        {activeTab === 'Tasks' && (
          <TasksScreen initialProjectFilter={tasksProjectFilter} />
        )}

        {activeTab === 'Profile' && <ProfileScreen />}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.tabBar}>
        {/* Dashboard Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Dashboard')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Dashboard' && styles.tabIconActive]}>
            📊
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'Dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Projects Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Projects')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Projects' && styles.tabIconActive]}>
            📁
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'Projects' && styles.tabLabelActive]}>
            Projects
          </Text>
        </TouchableOpacity>

        {/* Tasks Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setTasksProjectFilter('All');
            setActiveTab('Tasks');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Tasks' && styles.tabIconActive]}>
            📋
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'Tasks' && styles.tabLabelActive]}>
            Tasks
          </Text>
        </TouchableOpacity>

        {/* Profile / Settings Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Profile')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'Profile' && styles.tabIconActive]}>
            👤
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Quick Add Task Modal */}
      <TaskModal
        visible={quickAddModalVisible}
        onClose={() => setQuickAddModalVisible(false)}
        onSave={handleQuickSaveTask}
        projects={allProjects}
        defaultProjectId={quickAddProjectId}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  rootSafeArea: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  mainScreenContainer: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  splashLogoText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
  },
  splashTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
