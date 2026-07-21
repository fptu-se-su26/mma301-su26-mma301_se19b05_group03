export const palette = {
  brand: '#2563eb',
  brandDark: '#1d4ed8',
  brandSoft: '#eff6ff',
  brandText: '#1e40af',
  background: '#f1f5f9',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  danger: '#e11d48',
  dangerSoft: '#fff1f2',
  success: '#16a34a',
  successSoft: '#f0fdf4',
  warning: '#d97706',
  warningSoft: '#fffbeb',
  neutralSoft: '#f1f5f9',
};

export const toneStyles: Record<string, { bg: string; color: string }> = {
  brand: { bg: palette.brandSoft, color: palette.brandText },
  neutral: { bg: palette.neutralSoft, color: palette.textMuted },
  success: { bg: palette.successSoft, color: palette.success },
  danger: { bg: palette.dangerSoft, color: palette.danger },
  warning: { bg: palette.warningSoft, color: palette.warning },
};
