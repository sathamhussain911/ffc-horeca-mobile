export const COLORS = {
  primary:    '#1B5E20',
  primaryLight:'#2E7D32',
  blue:       '#1565C0',
  orange:     '#E65100',
  red:        '#C62828',
  amber:      '#B45309',
  gray:       '#6B7280',
  grayLight:  '#F3F4F6',
  grayBorder: '#E5E7EB',
  white:      '#FFFFFF',
  bg:         '#F0F4F0',
}

export const TEAMS = [
  'Team A','Team B','Team C','Team D','Team E',
  'Team F','Team G','Team H','Team I','Team J',
]

export const TEAM_COLORS: Record<string, string> = {
  'Team A':'#1565C0','Team B':'#6A1B9A','Team C':'#E65100','Team D':'#01579B',
  'Team E':'#2E7D32','Team F':'#880E4F','Team G':'#827717','Team H':'#00695C',
  'Team I':'#4527A0','Team J':'#BF360C',
}

export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  UNASSIGNED:   { label: 'Unassigned', bg: '#F5F5F5', text: '#616161', icon: '⏳' },
  ASSIGNED:     { label: 'Assigned',   bg: '#E3F2FD', text: '#1565C0', icon: '👥' },
  ACTIVE:       { label: 'Active',     bg: '#FFF3E0', text: '#E65100', icon: '⚡' },
  DONE:         { label: 'Done',       bg: '#E8F5E9', text: '#2E7D32', icon: '✅' },
  PARTIAL_DONE: { label: 'Partial',    bg: '#FFF3E0', text: '#E65100', icon: '½'  },
  HOLD:         { label: 'On Hold',    bg: '#FFEBEE', text: '#C62828', icon: '⏸' },
}

export const REASONS = [
  { key: 'QC_FAIL',     label: 'QC Failure',     icon: '🔍' },
  { key: 'BAD_QUALITY', label: 'Bad Quality',     icon: '⚠️' },
  { key: 'SHORT_STOCK', label: 'Stock Shortage',  icon: '📦' },
  { key: 'PREP_WASTE',  label: 'Prep Waste',      icon: '🗑️' },
  { key: 'OTHER',       label: 'Other',           icon: '📝' },
]
