
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
} from 'react-native';

import {
  getProjects,
  getTasks,
  updateTask,
  createProject,
} from '../services/api';

import { colors } from '../theme/colors';
import NetworkBanner from '../components/NetworkBanner';
import { StatusBadge, PriorityBadge } from '../components/Badges';

export default function ProjectsScreen({
  onOpenCreateTask,
  onSelectProjectFilter,
}) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');
  const [expandedProjects, setExpandedProjects] = useState({});

  // Create project form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStatus, setProjectStatus] = useState('Not Started');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const loadData = useCallback(async () => {
    setErrorMessage('');

    try {
      const [projectsData, tasksData] = await Promise.all([
        getProjects(),
        getTasks(),
      ]);

      setProjects(projectsData || []);
      setTasks(tasksData || []);
    } catch (err) {
      if (err.isNetworkError) {
        setErrorMessage('Cannot reach backend. Pull down to retry.');
      } else if (!err.isAuthExpired) {
        setErrorMessage(err.message || 'Could not load projects.');
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

  function toggleProjectExpanded(projectId) {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  }

  async function handleCreateProject() {
    const name = projectName.trim();
    const startDate = projectStartDate.trim();
    const endDate = projectEndDate.trim();

    if (!name) {
      setErrorMessage('Please enter a project name.');
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate && !datePattern.test(startDate)) {
      setErrorMessage('Start date must use YYYY-MM-DD format.');
      return;
    }

    if (endDate && !datePattern.test(endDate)) {
      setErrorMessage('End date must use YYYY-MM-DD format.');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setErrorMessage('End date cannot be before start date.');
      return;
    }

    setCreatingProject(true);
    setErrorMessage('');

    try {
      const newProject = await createProject({
        name,
        description: projectDescription.trim(),
        status: projectStatus,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      if (!newProject) {
        throw new Error('Project was not returned by the server.');
      }

      setProjects((current) => [
        newProject,
        ...current.filter(
          (project) => String(project.id) !== String(newProject.id)
        ),
      ]);

      setExpandedProjects((current) => ({
        ...current,
        [newProject.id]: false,
      }));

      setProjectName('');
      setProjectDescription('');
      setProjectStatus('Not Started');
      setProjectStartDate('');
      setProjectEndDate('');
      setShowCreateForm(false);
    } catch (err) {
      setErrorMessage(err.message || 'Could not create project.');
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleToggleTaskStatus(task) {
    const newStatus =
      task.status === 'Completed' ? 'Pending' : 'Completed';

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
        current.map((t) =>
          String(t.id) === String(task.id) ? updated : t
        )
      );
    } catch (err) {
      setErrorMessage(err.message || 'Could not update task status.');
    }
  }

  const filteredProjects = projects.filter((project) => {
    const name = (project.name || '').toLowerCase();
    const description = (project.description || '').toLowerCase();
    const query = search.toLowerCase();

    return name.includes(query) || description.includes(query);
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Projects...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Network / Error Notice */}
      {errorMessage ? (
        <NetworkBanner
          message={errorMessage}
          onRetry={loadData}
          onDismiss={() => setErrorMessage('')}
        />
      ) : null}

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Projects & Workstreams</Text>

        <Text style={styles.subtitle}>
          Tap any project to view and manage tasks under it.
        </Text>

        <TouchableOpacity
          style={styles.createProjectButton}
          onPress={() => {
            setErrorMessage('');
            setShowCreateForm((current) => !current);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.createProjectButtonText}>
            {showCreateForm ? 'Cancel' : '+ Create Project'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Project Form */}
      {showCreateForm && (
        <View style={styles.createProjectForm}>
          <Text style={styles.formTitle}>Create New Project</Text>

          <Text style={styles.formLabel}>Project Name *</Text>
          <TextInput
            style={styles.formInput}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Enter project name"
            placeholderTextColor={colors.textDim}
            maxLength={150}
            editable={!creatingProject}
            returnKeyType="next"
          />

          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.formInput, styles.descriptionInput]}
            value={projectDescription}
            onChangeText={setProjectDescription}
            placeholder="Describe the project (optional)"
            placeholderTextColor={colors.textDim}
            multiline
            editable={!creatingProject}
          />

          <Text style={styles.formLabel}>Status</Text>
          <View style={styles.statusOptions}>
            {['Not Started', 'In Progress', 'Completed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  projectStatus === status && styles.statusOptionSelected,
                ]}
                onPress={() => setProjectStatus(status)}
                disabled={creatingProject}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    projectStatus === status &&
                      styles.statusOptionTextSelected,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Start Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.formInput}
            value={projectStartDate}
            onChangeText={setProjectStartDate}
            placeholder="2026-10-23"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            editable={!creatingProject}
          />

          <Text style={styles.formLabel}>End Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.formInput}
            value={projectEndDate}
            onChangeText={setProjectEndDate}
            placeholder="2026-12-31"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            editable={!creatingProject}
          />

          <TouchableOpacity
            style={[
              styles.submitProjectButton,
              creatingProject && styles.submitProjectButtonDisabled,
            ]}
            onPress={handleCreateProject}
            disabled={creatingProject}
            activeOpacity={0.8}
          >
            {creatingProject ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitProjectButtonText}>
                  Creating...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitProjectButtonText}>
                Save Project
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search projects..."
          placeholderTextColor={colors.textDim}
        />

        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📁</Text>

          <Text style={styles.emptyTitle}>
            {search ? 'No projects match your search' : 'No projects found'}
          </Text>

          <Text style={styles.emptySubtitle}>
            {search
              ? 'Try a different search term or clear the filter.'
              : 'Create a project above, or projects created on the web application will appear here automatically.'}
          </Text>
        </View>
      ) : (
        filteredProjects.map((project) => {
          const projectTasks = tasks.filter(
            (task) => String(task.projectId) === String(project.id)
          );

          const isExpanded = !!expandedProjects[project.id];

          const completedCount = projectTasks.filter(
            (task) => task.status === 'Completed'
          ).length;

          return (
            <View key={project.id} style={styles.projectCard}>
              {/* Project Card Header */}
              <TouchableOpacity
                style={styles.projectHeader}
                onPress={() => toggleProjectExpanded(project.id)}
                activeOpacity={0.7}
              >
                <View style={styles.projectTitleRow}>
                  <View style={styles.folderIconBadge}>
                    <Text style={styles.folderIcon}>📁</Text>
                  </View>

                  <View style={styles.projectTitleContainer}>
                    <Text style={styles.projectName}>
                      {project.name}
                    </Text>

                    <Text style={styles.projectDates}>
                      {project.startDate || project.endDate
                        ? `${project.startDate || '—'} → ${
                            project.endDate || '—'
                          }`
                        : `Created ${project.createdDate || 'recently'}`}
                    </Text>
                  </View>

                  <Text style={styles.expandArrow}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </View>

                {project.description ? (
                  <Text
                    style={styles.projectDesc}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {project.description}
                  </Text>
                ) : null}

                {/* Status and Task Count Badges */}
                <View style={styles.projectMetaRow}>
                  <StatusBadge status={project.status} />

                  <View style={styles.taskCountBadge}>
                    <Text style={styles.taskCountText}>
                      {completedCount}/{projectTasks.length} tasks completed
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Tasks Under Each Project */}
              {isExpanded && (
                <View style={styles.tasksSection}>
                  <View style={styles.tasksSectionHeader}>
                    <Text style={styles.tasksSectionTitle}>
                      Tasks in this project ({projectTasks.length})
                    </Text>

                    {onOpenCreateTask && (
                      <TouchableOpacity
                        style={styles.addTaskBtn}
                        onPress={() => onOpenCreateTask(project.id)}
                      >
                        <Text style={styles.addTaskBtnText}>
                          + Add Task
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {projectTasks.length === 0 ? (
                    <View style={styles.emptyTasksBox}>
                      <Text style={styles.emptyTasksText}>
                        No tasks in this project yet. Tap "+ Add Task" to
                        create one.
                      </Text>
                    </View>
                  ) : (
                    projectTasks.map((task) => {
                      const isDone = task.status === 'Completed';

                      return (
                        <View key={task.id} style={styles.taskItem}>
                          <TouchableOpacity
                            style={styles.checkboxTouch}
                            onPress={() => handleToggleTaskStatus(task)}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isDone && styles.checkboxDone,
                              ]}
                            >
                              {isDone && (
                                <Text style={styles.checkboxCheck}>✓</Text>
                              )}
                            </View>
                          </TouchableOpacity>

                          <View style={styles.taskDetails}>
                            <Text
                              style={[
                                styles.taskItemName,
                                isDone && styles.taskItemNameDone,
                              ]}
                            >
                              {task.name}
                            </Text>

                            <View style={styles.taskItemMeta}>
                              <PriorityBadge priority={task.priority} />
                              <StatusBadge status={task.status} />

                              {task.dueDate && (
                                <Text style={styles.taskItemDueDate}>
                                  📅 {task.dueDate}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                  {projectTasks.length > 0 && onSelectProjectFilter && (
                    <TouchableOpacity
                      style={styles.viewInTasksTabBtn}
                      onPress={() => onSelectProjectFilter(project.id)}
                    >
                      <Text style={styles.viewInTasksTabText}>
                        Manage all {projectTasks.length} tasks in Tasks view →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })
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
  header: {
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },

  // Create Project styles
  createProjectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  createProjectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  createProjectForm: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  formTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  formLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    color: colors.text,
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  statusOptionText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statusOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  submitProjectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  submitProjectButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitProjectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    color: colors.textDim,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  clearSearch: {
    color: colors.textDim,
    fontSize: 20,
    paddingHorizontal: 4,
  },

  // Project card styles
  projectCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  projectHeader: {
    padding: 16,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  folderIcon: {
    fontSize: 18,
  },
  projectTitleContainer: {
    flex: 1,
  },
  projectName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  projectDates: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  expandArrow: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 6,
  },
  projectDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  projectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  taskCountBadge: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskCountText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // Task section styles
  tasksSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 14,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tasksSectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  addTaskBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addTaskBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTasksBox: {
    padding: 14,
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyTasksText: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  checkboxTouch: {
    padding: 4,
    marginRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  taskDetails: {
    flex: 1,
  },
  taskItemName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskItemNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textDim,
  },
  taskItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskItemDueDate: {
    color: colors.textDim,
    fontSize: 10,
  },
  viewInTasksTabBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewInTasksTabText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty state styles
  emptyCard: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
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
