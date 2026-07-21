import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/palette';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  textBlock: { flex: 1, gap: 2 },
  title: { fontSize: 22, fontWeight: '800', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted },
});
