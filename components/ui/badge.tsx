import { StyleSheet, Text, View } from 'react-native';
import { toneStyles } from '@/constants/palette';

type BadgeProps = {
  label: string;
  tone?: keyof typeof toneStyles;
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const style = toneStyles[tone] ?? toneStyles.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
