/**
 * Theme & Color Palette
 * Modern dark-mode styling aligned with the web application aesthetics
 */

export const colors = {
  bg: '#0f172a',            // Slate 900
  bgSurface: '#1e293b',     // Slate 800
  bgSurfaceLight: '#334155',// Slate 700
  bgInput: '#0f172a',
  
  border: '#334155',
  borderLight: '#475569',
  
  text: '#f8fafc',          // Slate 50
  textMuted: '#94a3b8',     // Slate 400
  textDim: '#64748b',       // Slate 500
  
  primary: '#6366f1',       // Indigo 500
  primaryHover: '#4f46e5',  // Indigo 600
  primaryDark: '#3730a3',
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  
  success: '#10b981',       // Emerald 500
  successBg: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.3)',
  
  warning: '#f59e0b',       // Amber 500
  warningBg: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.3)',
  
  danger: '#ef4444',        // Rose 500
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.3)',
  
  info: '#38bdf8',          // Sky 400
  infoBg: 'rgba(56, 189, 248, 0.15)',
  
  // Status Colors
  status: {
    'Completed': {
      text: '#34d399',
      bg: 'rgba(16, 185, 129, 0.16)',
      border: 'rgba(16, 185, 129, 0.35)',
    },
    'In Progress': {
      text: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.35)',
    },
    'Pending': {
      text: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.16)',
      border: 'rgba(148, 163, 184, 0.35)',
    },
    'Not Started': {
      text: '#cbd5e1',
      bg: 'rgba(203, 213, 225, 0.12)',
      border: 'rgba(203, 213, 225, 0.25)',
    },
  },

  // Priority Colors
  priority: {
    'High': {
      text: '#f87171',
      bg: 'rgba(239, 68, 68, 0.16)',
      border: 'rgba(239, 68, 68, 0.35)',
    },
    'Medium': {
      text: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.35)',
    },
    'Low': {
      text: '#60a5fa',
      bg: 'rgba(59, 130, 246, 0.16)',
      border: 'rgba(59, 130, 246, 0.35)',
    },
  },
};
