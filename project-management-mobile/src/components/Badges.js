import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function StatusBadge({ status = 'Pending', style }) {
  const conf = colors.status[status] || colors.status['Pending'];

  return (
    <View style={[styles.badge, { backgroundColor: conf.bg, borderColor: conf.border }, style]}>
      <Text style={[styles.badgeText, { color: conf.text }]}>{status}</Text>
    </View>
  );
}

export function PriorityBadge({ priority = 'Medium', style }) {
  const conf = colors.priority[priority] || colors.priority['Medium'];

  return (
    <View style={[styles.badge, { backgroundColor: conf.bg, borderColor: conf.border }, style]}>
      <Text style={[styles.badgeText, { color: conf.text }]}>{priority}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
