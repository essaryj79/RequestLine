import { ThemeColors } from '../types';

export interface ColorPreset {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const themePresets: ColorPreset[] = [
  {
    name: 'Cosmic Slate (Dark)',
    isDark: true,
    colors: {
      bg: '#0f172a',        // slate-900
      text: '#f8fafc',      // slate-50
      primary: '#3b82f6',   // blue-500
      accent: '#10b981',    // emerald-500
      cardBg: '#1e293b',    // slate-800
      mutedText: '#94a3b8'  // slate-400
    }
  },
  {
    name: 'Midnight Neon (Dark)',
    isDark: true,
    colors: {
      bg: '#050505',
      text: '#e2e8f0',
      primary: '#ec4899',   // pink-500
      accent: '#22c55e',    // green-500
      cardBg: '#151515',
      mutedText: '#64748b'
    }
  },
  {
    name: 'Sunset Amber (Dark)',
    isDark: true,
    colors: {
      bg: '#181210',
      text: '#fef3c7',      // amber-100
      primary: '#f59e0b',   // amber-500
      accent: '#f97316',    // orange-500
      cardBg: '#261c18',
      mutedText: '#d97706'
    }
  },
  {
    name: 'Classic Concert (Light)',
    isDark: false,
    colors: {
      bg: '#f8fafc',        // slate-50
      text: '#0f172a',      // slate-900
      primary: '#1e40af',   // blue-800
      accent: '#0d9488',    // teal-600
      cardBg: '#ffffff',
      mutedText: '#475569'  // slate-600
    }
  },
  {
    name: 'Warm Parchment (Light)',
    isDark: false,
    colors: {
      bg: '#fcf8f2',
      text: '#2d1a10',
      primary: '#b45309',   // amber-700
      accent: '#15803d',    // green-700
      cardBg: '#fbf3e6',
      mutedText: '#78350f'
    }
  }
];
