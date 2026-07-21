import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/palette';

type DetailHeaderProps = {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
};

export function DetailHeader({ title, onBack, right }: DetailHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={16}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={26} color={palette.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: palette.neutralSoft },
  title: { fontSize: 17, fontWeight: '700', color: palette.text, flex: 1 },
});
