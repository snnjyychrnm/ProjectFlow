import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

export default function TaskModal({
  visible,
  onClose,
  onSave,
  task = null, // if provided, edit mode
  projects = [],
  defaultProjectId = null,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (task) {
        setName(task.name || '');
        setDescription(task.description || '');
        setProjectId(String(task.projectId || ''));
        setPriority(task.priority || 'Medium');
        setStatus(task.status || 'Pending');
        setDueDate(task.dueDate || '');
      } else {
        setName('');
        setDescription('');
        setProjectId(defaultProjectId ? String(defaultProjectId) : (projects[0]?.id ? String(projects[0].id) : ''));
        setPriority('Medium');
        setStatus('Pending');
        setDueDate('');
      }
      setError('');
      setIsSaving(false);
    }
  }, [visible, task, projects, defaultProjectId]);

  function validate() {
    if (!name.trim()) {
      return 'Task name is required.';
    }
    if (name.trim().length > 150) {
      return 'Task name must be 150 characters or fewer.';
    }
    if (!projectId || !projects.some((p) => String(p.id) === String(projectId))) {
      return 'Please select a valid project.';
    }
    if (dueDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
        return 'Due date must be in YYYY-MM-DD format (e.g. 2026-11-15).';
      }
    }
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const taskData = {
        name: name.trim(),
        description: description.trim(),
        projectId: Number(projectId),
        priority,
        status,
        dueDate: dueDate.trim() || null,
      };

      await onSave(taskData, task ? task.id : null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {task ? 'Edit Task' : 'Create New Task'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Task Name */}
            <Text style={styles.label}>
              Task Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Build mobile authentication"
              placeholderTextColor={colors.textDim}
              maxLength={150}
            />

            {/* Project Picker */}
            <Text style={styles.label}>
              Project <Text style={styles.required}>*</Text>
            </Text>
            {projects.length === 0 ? (
              <Text style={styles.emptyWarning}>No projects found. Create a project on web or dashboard first.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {projects.map((proj) => {
                  const isSelected = String(proj.id) === String(projectId);
                  return (
                    <TouchableOpacity
                      key={proj.id}
                      style={[styles.projectChip, isSelected && styles.projectChipActive]}
                      onPress={() => setProjectId(String(proj.id))}
                    >
                      <Text style={[styles.projectChipText, isSelected && styles.projectChipTextActive]}>
                        📁 {proj.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add task details or notes..."
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={3}
            />

            {/* Priority Selector */}
            <Text style={styles.label}>Priority</Text>
            <View style={styles.buttonGroup}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                const pColor = colors.priority[p];
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.choiceButton,
                      isSelected && { backgroundColor: pColor.bg, borderColor: pColor.border },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isSelected && { color: pColor.text, fontWeight: '700' },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status Selector */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.buttonGroup}>
              {STATUSES.map((s) => {
                const isSelected = status === s;
                const sColor = colors.status[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.choiceButton,
                      isSelected && { backgroundColor: sColor.bg, borderColor: sColor.border },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isSelected && { color: sColor.text, fontWeight: '700' },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Due Date */}
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2026-12-31"
              placeholderTextColor={colors.textDim}
              maxLength={10}
            />
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>{task ? 'Update Task' : 'Create Task'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    color: colors.textMuted,
    fontSize: 20,
    paddingHorizontal: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: colors.danger,
  },
  emptyWarning: {
    color: colors.warning,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  projectChip: {
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  projectChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  projectChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  projectChipTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
