import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/palette';
import { Button } from './button';

export function LoadingState({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={palette.brand} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.muted}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Đã xảy ra lỗi</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? <Button label="Thử lại" variant="secondary" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
  },
  title: { fontSize: 16, fontWeight: '700', color: palette.text },
  muted: { fontSize: 14, color: palette.textMuted, textAlign: 'center' },
});
