import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ROLE_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const links = [
    { label: 'Chỉnh sửa hồ sơ', icon: 'person-circle-outline' as const, onPress: () => router.push('/profile-edit') },
    { label: 'Đổi mật khẩu', icon: 'key-outline' as const, onPress: () => router.push('/change-password' as Href) },
    { label: 'Tìm sinh viên', icon: 'search-outline' as const, onPress: () => router.push('/students' as Href) },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Cá nhân" subtitle="Thông tin tài khoản của bạn" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size={64} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Badge label={ROLE_LABELS[user?.role || ''] || user?.role || ''} tone="brand" />
        </Card>

        {user?.major || user?.studentCode ? (
          <Card style={styles.card}>
            {user?.studentCode ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã số</Text>
                <Text style={styles.infoValue}>{user.studentCode}</Text>
              </View>
            ) : null}
            {user?.major ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Chuyên ngành</Text>
                <Text style={styles.infoValue}>{user.major}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {user?.skills && user.skills.length > 0 ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Kỹ năng</Text>
            <View style={styles.tags}>
              {user.skills.map((skill) => (
                <Badge key={skill} label={skill} tone="neutral" />
              ))}
            </View>
          </Card>
        ) : null}

        {user?.description ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Giới thiệu</Text>
            <Text style={styles.bio}>{user.description}</Text>
          </Card>
        ) : null}

        <Card style={styles.linksCard}>
          {links.map((link) => (
            <Pressable key={link.label} style={styles.linkRow} accessibilityRole="button" accessibilityLabel={link.label} onPress={link.onPress}>
              <Ionicons name={link.icon} size={20} color={palette.brand} />
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
            </Pressable>
          ))}
        </Card>

        <Button label="Đăng xuất" variant="danger" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 12 },
  profileCard: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  name: { fontSize: 20, fontWeight: '800', color: palette.text },
  email: { fontSize: 14, color: palette.textMuted },
  card: { gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: palette.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: palette.text },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bio: { fontSize: 14, color: palette.text, lineHeight: 22 },
  linksCard: { gap: 0, paddingVertical: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: palette.text },
});
