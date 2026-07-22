import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';

export default function TabLayout() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarAccessibilityLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          href: undefined,
          title: 'Thông báo',
          tabBarAccessibilityLabel: 'Thông báo',
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: 'Học tập',
          tabBarAccessibilityLabel: 'Học tập',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          href: isStudent ? undefined : null,
          title: 'Nhóm',
          tabBarAccessibilityLabel: 'Nhóm học tập',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Tiện ích',
          tabBarAccessibilityLabel: 'Tiện ích',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          href: null,
          title: 'Hộp thư',
          tabBarAccessibilityLabel: 'Hộp thư và lời mời',
          tabBarIcon: ({ color, size }) => <Ionicons name="mail-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarAccessibilityLabel: 'Hồ sơ cá nhân',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
