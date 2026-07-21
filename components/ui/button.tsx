import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette } from '@/constants/palette';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  size?: 'md' | 'sm';
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        variantStyles[variant],
        (pressed || isDisabled) && styles.dimmed,
        style as object,
      ]}
      {...rest}>
      <View style={styles.content}>
        {loading && <ActivityIndicator size="small" color={textColor[variant]} />}
        <Text style={[styles.label, { color: textColor[variant] }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: palette.brand },
  secondary: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  danger: { backgroundColor: palette.dangerSoft, borderWidth: 1, borderColor: palette.danger },
});

const textColor: Record<string, string> = {
  primary: '#ffffff',
  secondary: palette.text,
  danger: palette.danger,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { paddingVertical: 12, paddingHorizontal: 18 },
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  dimmed: { opacity: 0.6 },
});
