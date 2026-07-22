import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { eventApi, type ApiError } from '@/services/api';
import { useAuth } from '@/context/auth';
import { Avatar } from '@/components/ui/avatar';
import { formatDateTime } from '@/utils/format';

type Participant = { _id?: string; participant?: { _id: string; name: string; major?: string } };
type Event = { _id?: string; title: string; content: string; eventDate?: string; registrationCount?: number; capacity?: number; author?: { _id: string } };

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const loadEvent = useCallback(async () => {
    if (!id) return;
    try {
      const response = await eventApi.get(id);
      setEvent(response.data.post);
      if (response.data.post?.type === 'event') {
        try {
          const people = await eventApi.participants(id);
          setParticipants(people.data.data || people.data || []);
        } catch {
          setParticipants([]);
        }
      }
      setError(null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }, [id]);
  useEffect(() => { loadEvent(); }, [loadEvent]);
  const action = async (type: 'register' | 'cancel') => {
    if (!id) return;
    setBusy(true);
    try {
      await (type === 'register' ? eventApi.register(id) : eventApi.cancel(id));
      await loadEvent();
      Alert.alert('Thành công', type === 'register' ? 'Bạn đã đăng ký sự kiện.' : 'Bạn đã hủy đăng ký.');
    } catch (requestError) {
      Alert.alert('Không thể thực hiện', (requestError as ApiError).message);
    } finally {
      setBusy(false);
    }
  };
  const canManage = user?.role === 'admin' || event?.author?._id === (user?.id || user?._id);
  const removeParticipant = (participant: Participant) => {
    const participantId = participant.participant?._id;
    if (!id || !participantId) return;
    Alert.alert('Xóa người tham gia', `Xóa ${participant.participant?.name} khỏi sự kiện?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await eventApi.removeParticipant(id, participantId);
          await loadEvent();
        } catch (requestError) {
          Alert.alert('Không thể xóa', (requestError as ApiError).message);
        }
      } },
    ]);
  };
  if (error) return <ScreenShell title="Chi tiết sự kiện" onBack={() => router.back()}><ErrorState message={error} /></ScreenShell>;
  if (!event) return <ScreenShell title="Chi tiết sự kiện" onBack={() => router.back()}><LoadingState /></ScreenShell>;
  return <ScreenShell title="Chi tiết sự kiện" onBack={() => router.back()}><ScrollView contentContainerStyle={styles.body}><Card style={styles.card}><Text style={styles.title}>{event.title}</Text>{event.eventDate ? <Text style={styles.meta}>{formatDateTime(event.eventDate)}</Text> : null}<Text style={styles.content}>{event.content}</Text><Text style={styles.meta}>{event.registrationCount || 0}{event.capacity != null ? `/${event.capacity}` : ''} người đã đăng ký</Text><Button label="Đăng ký" loading={busy} onPress={() => action('register')} /><Button label="Hủy đăng ký" variant="secondary" disabled={busy} onPress={() => action('cancel')} /></Card>{canManage ? <Card style={styles.card}><Text style={styles.sectionTitle}>Người tham gia</Text>{participants.map((item, index) => <View key={item._id || `${id}-participant-${item.participant?._id || item.participant?.name || index}`} style={styles.person}><Avatar name={item.participant?.name} size={34} /><View style={styles.personInfo}><Text style={styles.personName}>{item.participant?.name}</Text><Text style={styles.meta}>{item.participant?.major || ''}</Text></View><Button label="Xóa" variant="danger" size="sm" onPress={() => removeParticipant(item)} /></View>)}</Card> : null}</ScrollView></ScreenShell>;
}

const styles = StyleSheet.create({ body: { padding: 16, gap: 12 }, card: { gap: 12 }, title: { color: palette.text, fontSize: 22, fontWeight: '800' }, content: { color: palette.text, lineHeight: 22 }, meta: { color: palette.textMuted }, sectionTitle: { color: palette.text, fontWeight: '800', fontSize: 16 }, person: { flexDirection: 'row', alignItems: 'center', gap: 10 }, personInfo: { flex: 1 }, personName: { color: palette.text, fontWeight: '600' } });
