import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/palette';

export const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'clap', emoji: '👏' },
];

type ReactionBarProps = {
  current?: string | null;
  count: number;
  disabled?: boolean;
  onReact: (type: string) => void;
};

export function ReactionBar({ current, count, disabled, onReact }: ReactionBarProps) {
  return (
    <View style={styles.bar}>
      {REACTIONS.map((reaction) => {
        const active = current === reaction.type;
        return (
          <Pressable
            key={reaction.type}
            disabled={disabled}
            onPress={() => onReact(reaction.type)}
            style={[styles.pill, active && styles.pillActive]}>
            <Text style={styles.emoji}>{reaction.emoji}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.count}>{count} lượt cảm xúc</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    width: 40,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  pillActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  emoji: { fontSize: 18 },
  count: { marginLeft: 4, fontSize: 12, color: palette.textFaint },
});
