import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';

type Shortcut = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  route: Href;
};

export default function HubScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const role = user?.role;
  const isStudent = role === 'student';
  const canManageCourses = role === 'lecturer' || role === 'admin';
  const isAdmin = role === 'admin';

  const shortcuts: Shortcut[] = [
    {
      label: 'Bộ câu hỏi ôn tập',
      description: 'Làm bài và ôn luyện',
      icon: 'help-circle-outline',
      tint: palette.brand,
      route: '/quizzes',
    },
    {
      label: 'Lịch & hạn chót',
      description: 'Hạn nộp và sự kiện',
      icon: 'calendar-outline',
      tint: palette.warning,
      route: '/calendar',
    },
    {
      label: 'Tìm kiếm',
      description: 'Tìm mọi nội dung',
      icon: 'search-outline',
      tint: palette.textMuted,
      route: '/search',
    },
    ...(isStudent
      ? [
          {
            label: 'Học phần',
            description: 'Ghi danh học phần',
            icon: 'school-outline' as const,
            tint: palette.warning,
            route: '/courses' as const,
          },
          {
            label: 'Bài tập',
            description: 'Nộp bài và xem hạn',
            icon: 'clipboard-outline' as const,
            tint: palette.success,
            route: '/assignments' as const,
          },
          {
            label: 'Điểm của tôi',
            description: 'Kết quả học tập',
            icon: 'ribbon-outline' as const,
            tint: palette.brand,
            route: '/gradebook' as const,
          },
          {
            label: 'Bảng xếp hạng',
            description: 'Điểm hoạt động & huy hiệu',
            icon: 'trophy-outline' as const,
            tint: palette.warning,
            route: '/leaderboard' as const,
          },
          {
            label: 'Yêu cầu tham gia',
            description: 'Theo dõi lời mời của bạn',
            icon: 'paper-plane-outline' as const,
            tint: palette.textMuted,
            route: '/requests' as const,
          },
        ]
      : []),
    ...(canManageCourses
      ? [
          {
            label: 'Quản lý học phần',
            description: 'Học phần và danh sách lớp',
            icon: 'book-outline' as const,
            tint: palette.warning,
            route: '/courses' as const,
          },
          {
            label: 'Bài tập',
            description: 'Giao bài và chấm điểm',
            icon: 'clipboard-outline' as const,
            tint: palette.success,
            route: '/assignments' as const,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: 'Quản lý người dùng',
            description: 'Tài khoản và phân quyền',
            icon: 'people-outline' as const,
            tint: palette.danger,
            route: '/users' as const,
          },
          {
            label: 'Tổng quan hệ thống',
            description: 'Thống kê và hoạt động',
            icon: 'stats-chart-outline' as const,
            tint: palette.brand,
            route: '/admin' as const,
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Tiện ích" subtitle="Truy cập nhanh các chức năng" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {shortcuts.map((item) => (
            <Pressable key={item.label} style={styles.cell} onPress={() => router.push(item.route)}>
              <Card style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: `${item.tint}1A` }]}>
                  <Ionicons name={item.icon} size={24} color={item.tint} />
                </View>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%' },
  card: { gap: 8, minHeight: 132, justifyContent: 'flex-start' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '800', color: palette.text },
  description: { fontSize: 12, color: palette.textMuted },
});
