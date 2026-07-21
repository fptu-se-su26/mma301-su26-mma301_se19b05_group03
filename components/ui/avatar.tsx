import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { resolveFileUrl } from '@/constants/config';
import { palette } from '@/constants/palette';
import { initialsOf } from '@/utils/format';

export function Avatar({ name, avatarUrl, size = 40 }: { name?: string; avatarUrl?: string; size?: number }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {avatarUrl ? (
        <Image source={{ uri: resolveFileUrl(avatarUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initialsOf(name) || '?'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: palette.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: { color: palette.brandText, fontWeight: '700' },
});
