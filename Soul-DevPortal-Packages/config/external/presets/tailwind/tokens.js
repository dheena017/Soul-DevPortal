/**
 * Canonical Design Tokens for Workspace Monorepo Applications
 * Provides unified color palettes, status indicators, and surface hierarchies.
 */
export const tokens = {
  colors: {
    // 1. Surface & Background Hierarchy (Light/Dark mode)
    surface: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#2A2A2A',
      800: '#212121', // Panel & card surface
      900: '#181818', // Canvas & page background
      950: '#121212', // Deepest background
    },
    // Dual-Tone Palette (matched to user reference)
    workspaceTheme: {
      canvas: '#181818',
      surface: '#212121',
      border: '#2a2a2a',
      textMuted: '#858585',
    },
    // 2. Brand Primary Palette (Universal Identity)
    brand: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Primary Brand Blue
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
      DEFAULT: '#2563EB',
      foreground: '#FFFFFF',
    },
    // 3. Interactive Accent Palette (AI features, badges, active states)
    accent: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6', // Purple/Violet Accent
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
      950: '#2E1065',
      DEFAULT: '#7C3AED',
      foreground: '#FFFFFF',
    },
    // 4. Semantic Status & Alert Colors
    status: {
      success: {
        DEFAULT: '#10B981',
        light: '#ECFDF5',
        dark: '#064E3B',
        foreground: '#FFFFFF',
      },
      warning: {
        DEFAULT: '#F59E0B',
        light: '#FFFBEB',
        dark: '#78350F',
        foreground: '#FFFFFF',
      },
      danger: {
        DEFAULT: '#EF4444',
        light: '#FEF2F2',
        dark: '#7F1D1D',
        foreground: '#FFFFFF',
      },
      info: {
        DEFAULT: '#0EA5E9',
        light: '#F0F9FF',
        dark: '#0C4A6E',
        foreground: '#FFFFFF',
      },
    },
  },
};
