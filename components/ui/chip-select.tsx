import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/palette';

export type Option = { value: string; label: string };

type ChipSelectProps = {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

export function ChipSelect({ label, options, value, onChange }: ChipSelectProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <Pressable
              key={`${option.value}-${index}`}
              onPress={() => onChange(option.value)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  chipTextActive: { color: palette.brandText },
});
