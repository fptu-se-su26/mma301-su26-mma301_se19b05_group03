import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { calendarApi } from '@/services/api';
import { formatDateTime } from '@/utils/format';

type CalendarItem = {
  kind: 'assignment' | 'event';
  id: string;
  title: string;
  date: string;
  course?: { code: string } | null;
  author?: string | null;
  submitted?: boolean;
};

const dayKeyOf = (date: string) =>
  new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });

export default function CalendarScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync<{ data: CalendarItem[] }>(
    () => calendarApi.upcoming(),
    []
  );
  const back = () => router.back();

  if (loading)
    return (
      <ScreenShell title="Lịch & hạn chót" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (error)
    return (
      <ScreenShell title="Lịch & hạn chót" onBack={back}>
        <ErrorState message={error} onRetry={reload} />
      </ScreenShell>
    );

  const items = data?.data ?? [];
  const grouped = items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const key = dayKeyOf(item.date);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  return (
    <ScreenShell title="Lịch & hạn chót" onBack={back}>
      <ScrollView contentContainerStyle={styles.body}>
        {items.length === 0 ? (
          <EmptyState title="Không có mục sắp tới" description="Bạn không có hạn nộp hoặc sự kiện nào." />
        ) : (
          Object.entries(grouped).map(([day, dayItems]) => (
            <View key={day} style={styles.section}>
              <Text style={styles.dayLabel}>{day}</Text>
              {dayItems.map((item) => (
                <Card key={`${item.kind}-${item.id}`} style={styles.card}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: item.kind === 'assignment' ? palette.brandSoft : palette.warningSoft },
                    ]}>
                    <Ionicons
                      name={item.kind === 'assignment' ? 'clipboard-outline' : 'megaphone-outline'}
                      size={20}
                      color={item.kind === 'assignment' ? palette.brand : palette.warning}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.meta}>
                      {formatDateTime(item.date)}
                      {item.course ? ` · ${item.course.code}` : ''}
                      {item.author ? ` · ${item.author}` : ''}
                    </Text>
                  </View>
                  {item.kind === 'assignment' ? (
                    item.submitted ? (
                      <Badge label="Đã nộp" tone="success" />
                    ) : (
                      <Badge label="Hạn nộp" tone="warning" />
                    )
                  ) : (
                    <Badge label="Sự kiện" tone="brand" />
                  )}
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 16 },
  section: { gap: 8 },
  dayLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint, marginTop: 2 },
});
