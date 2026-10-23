import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { getTasks, getProjects, createTask, updateTask, deleteTask } from '../services/api';
import { colors } from '../theme/colors';
import NetworkBanner from '../components/NetworkBanner';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import TaskModal from '../components/TaskModal';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];
const PRIORITY_FILTERS = ['All', 'Low', 'Medium', 'High'];

export default function TasksScreen({ initialProjectFilter = 'All' }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Quick Status/Priority Menu Modal state for quick edit
  const [quickMenuTask, setQuickMenuTask] = useState(null);

  const loadData = useCallback(async () => {
    setErrorMessage('');
    try {
      const [tasksData, projectsData] = await Promise.all([
        getTasks(),
        getProjects(),
      ]);
      setTasks(tasksData || []);
      setProjects(projectsData || []);
    } catch (err) {
      if (err.isNetworkError) {
        setErrorMessage('Cannot reach backend. Pull down to retry.');
      } else if (!err.isAuthExpired) {
        setErrorMessage(err.message || 'Could not load tasks.');
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

  // Quick toggle completed status
  async function handleToggleCompleted(task) {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const updated = await updateTask(task.id, {
        projectId: task.projectId,
        name: task.name,
        description: task.description || '',
        priority: task.priority,
        status: newStatus,
        dueDate: task.dueDate || null,
      });

      setTasks((current) =>
        current.map((t) => (String(t.id) === String(task.id) ? updated : t))
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update task status.');
    }
  }

  // Quick change status or priority
  async function handleChangeTaskStatus(task, newStatus) {
    try {
      const updated = await updateTask(task.id, {
        projectId: task.projectId,
        name: task.name,
        description: task.description || '',
        priority: task.priority,
        status: newStatus,
        dueDate: task.dueDate || null,
      });
      setTasks((current) =>
        current.map((t) => (String(t.id) === String(task.id) ? updated : t))
      );
      setQuickMenuTask(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update status.');
    }
  }

  async function handleChangeTaskPriority(task, newPriority) {
    try {
      const updated = await updateTask(task.id, {
        projectId: task.projectId,
        name: task.name,
        description: task.description || '',
        priority: newPriority,
        status: task.status,
        dueDate: task.dueDate || null,
      });
      setTasks((current) =>
        current.map((t) => (String(t.id) === String(task.id) ? updated : t))
      );
      setQuickMenuTask(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update priority.');
    }
  }

  // Delete task with confirmation
  function handleDeleteTask(taskId) {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to permanently delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setTasks((current) =>
                current.filter((t) => String(t.id) !== String(taskId))
              );
            } catch (err) {
              Alert.alert('Delete Failed', err.message || 'Could not delete task.');
            }
          },
        },
      ]
    );
  }

  // Save (create or update)
  async function handleSaveTask(taskData, taskId) {
    if (taskId) {
      const updated = await updateTask(taskId, taskData);
      setTasks((current) =>
        current.map((t) => (String(t.id) === String(taskId) ? updated : t))
      );
    } else {
      const created = await createTask(taskData);
      setTasks((current) => [created, ...current]);
    }
  }

  // Open create modal
  function openCreateModal() {
    if (projects.length === 0) {
      Alert.alert(
        'No Projects Found',
        'Please ensure at least one project exists before creating a task.'
      );
      return;
    }
    setEditingTask(null);
    setModalVisible(true);
  }

  // Open edit modal
  function openEditModal(task) {
    setEditingTask(task);
    setModalVisible(true);
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.name.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All' || task.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'All' || task.priority === priorityFilter;

    const matchesProject =
      projectFilter === 'All' || String(task.projectId) === String(projectFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
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
        {/* Network Error Banner */}
        {errorMessage ? (
          <NetworkBanner
            message={errorMessage}
            onRetry={loadData}
            onDismiss={() => setErrorMessage('')}
          />
        ) : null}

        {/* Screen Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Tasks</Text>
            <Text style={styles.screenSubtitle}>
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
            </Text>
          </View>

          <TouchableOpacity style={styles.headerAddBtn} onPress={openCreateModal}>
            <Text style={styles.headerAddBtnText}>+ New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks..."
            placeholderTextColor={colors.textDim}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Chips */}
        <Text style={styles.filterGroupLabel}>Status Filter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {STATUS_FILTERS.map((s) => {
            const isSelected = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Priority Filter Chips */}
        <Text style={styles.filterGroupLabel}>Priority Filter</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {PRIORITY_FILTERS.map((p) => {
            const isSelected = priorityFilter === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setPriorityFilter(p)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Project Filter Chips if multiple projects exist */}
        {projects.length > 1 && (
          <>
            <Text style={styles.filterGroupLabel}>Project Filter</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.filterChip, projectFilter === 'All' && styles.filterChipActive]}
                onPress={() => setProjectFilter('All')}
              >
                <Text style={[styles.filterChipText, projectFilter === 'All' && styles.filterChipTextActive]}>
                  All Projects
                </Text>
              </TouchableOpacity>
              {projects.map((proj) => {
                const isSelected = String(projectFilter) === String(proj.id);
                return (
                  <TouchableOpacity
                    key={proj.id}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setProjectFilter(isSelected ? 'All' : String(proj.id))}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      📁 {proj.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Task Cards List */}
        <View style={styles.tasksList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No matching tasks</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter !== 'All' || priorityFilter !== 'All'
                  ? 'No tasks match the active filters. Try clearing search or filters.'
                  : 'Tap "+ New Task" above to add your first task.'}
              </Text>
            </View>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'Completed';
              const project = projects.find((p) => String(p.id) === String(task.projectId));

              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskCardMain}>
                    {/* Completion Checkbox */}
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => handleToggleCompleted(task)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
                        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>

                    {/* Task Content */}
                    <View style={styles.taskContent}>
                      <Text
                        style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
                      >
                        {task.name}
                      </Text>

                      {task.description ? (
                        <Text style={styles.taskDescription} numberOfLines={2}>
                          {task.description}
                        </Text>
                      ) : null}

                      {/* Project Tag */}
                      {project && (
                        <View style={styles.projectTag}>
                          <Text style={styles.projectTagText}>📁 {project.name}</Text>
                        </View>
                      )}

                      {/* Badges Row */}
                      <View style={styles.badgesRow}>
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />

                        {task.dueDate && (
                          <View style={styles.dueDateBadge}>
                            <Text style={styles.dueDateText}>📅 {task.dueDate}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Task Card Action Buttons */}
                  <View style={styles.taskActionsRow}>
                    {/* Quick status toggle button */}
                    <TouchableOpacity
                      style={styles.quickStatusBtn}
                      onPress={() => setQuickMenuTask(task)}
                    >
                      <Text style={styles.quickStatusBtnText}>⚡ Change Status / Priority</Text>
                    </TouchableOpacity>

                    <View style={styles.editDeleteGroup}>
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={() => openEditModal(task)}
                      >
                        <Text style={styles.editActionText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteActionBtn}
                        onPress={() => handleDeleteTask(task.id)}
                      >
                        <Text style={styles.deleteActionText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Inline Quick Status / Priority Picker if expanded */}
                  {quickMenuTask && String(quickMenuTask.id) === String(task.id) && (
                    <View style={styles.quickMenuDrawer}>
                      <Text style={styles.quickMenuTitle}>Update Status</Text>
                      <View style={styles.quickButtonGroup}>
                        {['Pending', 'In Progress', 'Completed'].map((st) => (
                          <TouchableOpacity
                            key={st}
                            style={[
                              styles.quickChoiceBtn,
                              task.status === st && styles.quickChoiceBtnActive,
                            ]}
                            onPress={() => handleChangeTaskStatus(task, st)}
                          >
                            <Text
                              style={[
                                styles.quickChoiceText,
                                task.status === st && styles.quickChoiceTextActive,
                              ]}
                            >
                              {st}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.quickMenuTitle}>Update Priority</Text>
                      <View style={styles.quickButtonGroup}>
                        {['Low', 'Medium', 'High'].map((pr) => (
                          <TouchableOpacity
                            key={pr}
                            style={[
                              styles.quickChoiceBtn,
                              task.priority === pr && styles.quickChoiceBtnActive,
                            ]}
                            onPress={() => handleChangeTaskPriority(task, pr)}
                          >
                            <Text
                              style={[
                                styles.quickChoiceText,
                                task.priority === pr && styles.quickChoiceTextActive,
                              ]}
                            >
                              {pr}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={styles.closeQuickMenuBtn}
                        onPress={() => setQuickMenuTask(null)}
                      >
                        <Text style={styles.closeQuickMenuText}>Close Menu</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTask}
        task={editingTask}
        projects={projects}
        defaultProjectId={projectFilter !== 'All' ? projectFilter : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 60,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  headerAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  clearSearch: {
    color: colors.textDim,
    fontSize: 16,
    paddingHorizontal: 4,
  },
  filterGroupLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  tasksList: {
    marginTop: 10,
  },
  taskCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  taskCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    paddingRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textDim,
  },
  taskDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  projectTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  projectTagText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dueDateBadge: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueDateText: {
    color: colors.textDim,
    fontSize: 11,
  },
  taskActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  quickStatusBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  quickStatusBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  editDeleteGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  editActionBtn: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  editActionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteActionBtn: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteActionText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  quickMenuDrawer: {
    marginTop: 12,
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickMenuTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  quickButtonGroup: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  quickChoiceBtn: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickChoiceBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  quickChoiceText: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  quickChoiceTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  closeQuickMenuBtn: {
    alignSelf: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  closeQuickMenuText: {
    color: colors.textDim,
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
