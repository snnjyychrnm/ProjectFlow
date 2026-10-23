import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDashboard, getProjects, getTasks } from '../services/api';
import { colors } from '../theme/colors';
import NetworkBanner from '../components/NetworkBanner';
import { StatusBadge, PriorityBadge } from '../components/Badges';

export default function DashboardScreen({ onNavigate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    setErrorMessage('');
    try {
      const [dashData, tasksData] = await Promise.all([
        getDashboard(),
        getTasks(),
      ]);
      setStats(dashData);
      setRecentTasks((tasksData || []).slice(0, 4));
    } catch (err) {
      if (err.isNetworkError) {
        setErrorMessage('Cannot reach backend. Pull down to retry.');
      } else if (!err.isAuthExpired) {
        setErrorMessage(err.message || 'Could not load dashboard statistics.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Network or Load Error Banner */}
      {errorMessage ? (
        <NetworkBanner
          message={errorMessage}
          onRetry={loadData}
          onDismiss={() => setErrorMessage('')}
        />
      ) : null}

      {/* Greeting Header */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextGroup}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.full_name || 'Project Manager'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <View style={styles.pullHint}>
          <Text style={styles.pullHintText}>↓ Pull to refresh data</Text>
        </View>
      </View>

      {/* Statistics Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overview Statistics</Text>
        <Text style={styles.sectionSubtitle}>Synced live with PostgreSQL database</Text>
      </View>

      {/* 2-Column Stats Grid */}
      <View style={styles.grid}>
        {/* Total Projects */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate && onNavigate('Projects')}
          activeOpacity={0.8}
        >
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Text style={styles.statIcon}>📁</Text>
          </View>
          <Text style={styles.statValue}>{stats?.totalProjects ?? 0}</Text>
          <Text style={styles.statLabel}>Total Projects</Text>
        </TouchableOpacity>

        {/* Total Tasks */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate && onNavigate('Tasks')}
          activeOpacity={0.8}
        >
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Text style={styles.statIcon}>📋</Text>
          </View>
          <Text style={styles.statValue}>{stats?.totalTasks ?? 0}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </TouchableOpacity>

        {/* Completed Tasks */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate && onNavigate('Tasks', { status: 'Completed' })}
          activeOpacity={0.8}
        >
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Text style={styles.statIcon}>✓</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {stats?.completedTasks ?? 0}
          </Text>
          <Text style={styles.statLabel}>Completed Tasks</Text>
        </TouchableOpacity>

        {/* Pending Tasks */}
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate && onNavigate('Tasks', { status: 'Pending' })}
          activeOpacity={0.8}
        >
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Text style={styles.statIcon}>⏳</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {stats?.pendingTasks ?? 0}
          </Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Projects in Progress Highlight */}
      <View style={styles.progressCard}>
        <View style={styles.progressCardContent}>
          <Text style={styles.progressCardTitle}>Projects In Progress</Text>
          <Text style={styles.progressCardSubtitle}>Active workloads requiring attention</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeValue}>{stats?.projectsInProgress ?? 0}</Text>
        </View>
      </View>

      {/* Recent Tasks Widget */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('Tasks')}>
          <Text style={styles.viewAllText}>View all tasks →</Text>
        </TouchableOpacity>
      </View>

      {recentTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptySubtitle}>Go to the Tasks tab to create your first task.</Text>
        </View>
      ) : (
        recentTasks.map((task) => (
          <View key={task.id} style={styles.taskMiniCard}>
            <View style={styles.taskMiniHeader}>
              <Text style={styles.taskMiniName} numberOfLines={1}>
                {task.name}
              </Text>
              <StatusBadge status={task.status} />
            </View>
            <View style={styles.taskMiniMeta}>
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <Text style={styles.taskMiniDueDate}>Due: {task.dueDate}</Text>
              )}
            </View>
          </View>
        ))
      )}
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  welcomeCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTextGroup: {
    marginBottom: 10,
  },
  greeting: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  pullHint: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pullHintText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textDim,
    fontSize: 11,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  progressCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  progressCardContent: {
    flex: 1,
  },
  progressCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  progressCardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  progressBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeValue: {
    color: colors.warning,
    fontSize: 20,
    fontWeight: '800',
  },
  taskMiniCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  taskMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskMiniName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  taskMiniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskMiniDueDate: {
    color: colors.textDim,
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
