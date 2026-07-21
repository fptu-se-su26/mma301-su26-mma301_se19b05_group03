import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { LoadingState } from '@/components/ui/states';
import { hasCapability } from '@/constants/capabilities';
import { palette } from '@/constants/palette';
import { AuthProvider, useAuth } from '@/context/auth';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: palette.background },
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <LoadingState label="Đang khởi động..." />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="team/[id]" />
        <Stack.Screen name="team/form" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="student/[id]" />
        <Stack.Screen name="students" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="quizzes/index" />
        <Stack.Screen name="quizzes/[id]" />
      <Stack.Screen name="quizzes/builder" />
      <Stack.Screen name="quizzes/import" />
        <Stack.Screen name="courses" />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="course-analytics" />
        <Stack.Screen name="assignments" />
        <Stack.Screen name="assignment/[id]" />
        <Stack.Screen name="gradebook" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="search" />
        <Stack.Protected guard={hasCapability(user?.role, 'admin')}>
          <Stack.Screen name="users" />
          <Stack.Screen name="admin" />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}

function NotificationObserver() {
  useEffect(() => {
    const openNotification = (notification: Notifications.Notification) => {
      const data = notification.request.content.data;
      const rawRoute = typeof data.url === 'string' ? data.url : typeof data.link === 'string' ? data.link : null;
      const route = typeof data.teamId === 'string'
        ? `/team/${data.teamId}`
        : typeof data.eventId === 'string'
          ? `/event/${data.eventId}`
          : typeof data.assignmentId === 'string'
            ? `/assignment/${data.assignmentId}`
            : typeof data.courseId === 'string'
              ? `/course/${data.courseId}`
              : rawRoute?.replace(/^\/teams\//, '/team/');
      if (route) router.push(route as Href);
    };
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) openNotification(lastResponse.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      openNotification(response.notification)
    );
    return () => subscription.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <AuthProvider>
          <NotificationObserver />
          <RootNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
