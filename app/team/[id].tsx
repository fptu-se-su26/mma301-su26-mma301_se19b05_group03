import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { TeamChat } from '@/components/ui/team-chat';
import { TextField } from '@/components/ui/text-field';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { TEAM_STATUS_LABELS } from '@/constants/labels';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { teamApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { openProtectedFile } from '@/services/protected-file';
import { formatRelative } from '@/utils/format';

type Member = { user?: { _id: string; name: string; major?: string }; role: string };
type Team = {
  _id: string;
  name: string;
  description?: string;
  topic?: string;
  major?: string;
  status: string;
  skillsNeeded?: string[];
  maxMembers?: number;
  leader?: { _id: string; name: string };
  members?: Member[];
};
type JoinRequest = {
  _id: string;
  status: string;
  message?: string;
  createdAt: string;
  applicant?: { _id: string; name: string; major?: string; skills?: string[] };
};
type Resource = {
  _id: string;
  type: 'file' | 'link';
  title: string;
  fileUrl?: string;
  linkUrl?: string;
  uploadedBy?: { _id: string; name: string };
  createdAt: string;
};
type Teammate = { _id: string; name: string; major?: string; skills?: string[]; score?: number };

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync<{ data: { team: Team } }>(
    () => teamApi.get(String(id)),
    [id]
  );

  const team = data?.data.team;
  const myId = user?.id || user?._id;
  const isMember = Boolean(team?.members?.some((m) => m.user?._id === myId));
  const isLeader = team?.leader?._id === myId;
  const canRequest = user?.role === 'student' && !isMember && team?.status === 'recruiting';

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [linkForm, setLinkForm] = useState({ title: '', url: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!team || !isLeader) return;
    try {
      const res = await teamApi.teamRequests(team._id, { status: 'pending' });
      setRequests(res.data as JoinRequest[]);
    } catch {
      setRequests([]);
    }
  }, [team, isLeader]);

  const loadResources = useCallback(async () => {
    if (!team || !isMember) return;
    try {
      const res = await teamApi.resources(team._id);
      setResources(res.data.resources as Resource[]);
    } catch {
      setResources([]);
    }
  }, [team, isMember]);

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    if (!team || !isLeader) return;
    teamApi.recommendedTeammates(team._id).then((res) => {
      const recommendations = res.data?.recommendations || res.data || [];
      setTeammates(Array.isArray(recommendations) ? recommendations : []);
    }).catch(() => setTeammates([]));
  }, [team, isLeader]);

  const requestJoin = async () => {
    if (!team) return;
    setSubmitting(true);
    try {
      await teamApi.requestJoin(team._id, { message: message.trim() || undefined });
      Alert.alert('Đã gửi yêu cầu', 'Yêu cầu tham gia của bạn đã được gửi tới trưởng nhóm.');
      setMessage('');
    } catch (err) {
      Alert.alert('Không thể gửi yêu cầu', (err as ApiError)?.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (requestId: string, decision: 'accepted' | 'rejected') => {
    try {
      await teamApi.decideRequest(requestId, { decision });
      await Promise.all([reload(), loadRequests()]);
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xử lý yêu cầu.');
    }
  };

  const invite = async (teammate: Teammate) => {
    if (!team) return;
    setInviting(teammate._id);
    try {
      await teamApi.invite(team._id, teammate._id);
      setTeammates((items) => items.filter((item) => item._id !== teammate._id));
      Alert.alert('Đã gửi lời mời', `Đã mời ${teammate.name} tham gia nhóm.`);
    } catch (err) {
      Alert.alert('Không thể mời', (err as ApiError)?.message || 'Vui lòng thử lại.');
    } finally {
      setInviting(null);
    }
  };

  const removeMember = (member: Member) => {
    if (!team || !member.user) return;
    Alert.alert('Xóa thành viên', `Xóa "${member.user.name}" khỏi nhóm?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamApi.removeMember(team._id, member.user!._id);
            await reload();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa thành viên.');
          }
        },
      },
    ]);
  };

  const leaveTeam = () => {
    if (!team) return;
    Alert.alert('Rời nhóm', `Bạn chắc chắn muốn rời nhóm "${team.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Rời nhóm',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamApi.leave(team._id);
            router.back();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể rời nhóm.');
          }
        },
      },
    ]);
  };

  const deleteTeam = () => {
    if (!team) return;
    Alert.alert('Xóa nhóm', `Xóa nhóm "${team.name}"? Hành động này không thể hoàn tác.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa nhóm',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamApi.remove(team._id);
            router.back();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa nhóm.');
          }
        },
      },
    ]);
  };

  const addLink = async () => {
    if (!team || !linkForm.title.trim() || !linkForm.url.trim()) {
      Alert.alert('Thiếu thông tin', 'Nhập tiêu đề và đường dẫn.');
      return;
    }
    setBusy(true);
    try {
      await teamApi.addLink(team._id, { title: linkForm.title.trim(), linkUrl: linkForm.url.trim() });
      setLinkForm({ title: '', url: '' });
      setShowLinkForm(false);
      await loadResources();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể thêm liên kết.');
    } finally {
      setBusy(false);
    }
  };

  const addFile = async () => {
    if (!team) return;
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('title', asset.name);
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as unknown as Blob);
      await teamApi.uploadFile(team._id, formData);
      await loadResources();
    } catch (err) {
      Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể tải tệp lên.');
    } finally {
      setBusy(false);
    }
  };

  const openResource = async (resource: Resource) => {
    if (resource.type === 'link') {
      if (resource.linkUrl) await WebBrowser.openBrowserAsync(resource.linkUrl);
      return;
    }
    try {
      await openProtectedFile(resource.fileUrl);
    } catch {
      Alert.alert('Không thể mở tệp', 'Tệp không tải được hoặc phiên đăng nhập đã hết hạn.');
    }
  };

  const removeResource = (resource: Resource) => {
    if (!team) return;
    Alert.alert('Xóa tài nguyên', `Xóa "${resource.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await teamApi.removeResource(team._id, resource._id);
            await loadResources();
          } catch (err) {
            Alert.alert('Lỗi', (err as ApiError)?.message || 'Không thể xóa.');
          }
        },
      },
    ]);
  };

  const back = () => router.back();

  if (loading) {
    return (
      <ScreenShell title="Chi tiết nhóm" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  }
  if (error || !team) {
    return (
      <ScreenShell title="Chi tiết nhóm" onBack={back}>
        <ErrorState message={error || 'Không tìm thấy nhóm'} onRetry={reload} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Chi tiết nhóm" onBack={back}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.name}>{team.name}</Text>
          <Badge label={TEAM_STATUS_LABELS[team.status] || team.status} tone="brand" />
        </View>
        {team.topic ? <Text style={styles.topic}>{team.topic}</Text> : null}
        {team.description ? <Text style={styles.desc}>{team.description}</Text> : null}
        <View style={styles.metaRow}>
          {team.major ? <Badge label={team.major} tone="neutral" /> : null}
          <Badge label={`${team.members?.length || 0}/${team.maxMembers || 0} thành viên`} tone="neutral" />
        </View>
      </Card>

      {isLeader ? (
        <View style={styles.actionRow}>
          <Button
            label="Sửa nhóm"
            variant="secondary"
            style={styles.flex}
            onPress={() => router.push(`/team/form?id=${team._id}`)}
          />
          <Button label="Xóa nhóm" variant="danger" style={styles.flex} onPress={deleteTeam} />
        </View>
      ) : null}

      {team.skillsNeeded && team.skillsNeeded.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Kỹ năng cần tuyển</Text>
          <View style={styles.tags}>
            {team.skillsNeeded.map((skill) => (
              <Badge key={skill} label={skill} tone="brand" />
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Thành viên</Text>
        {(team.members ?? []).map((member) => (
          <View key={member.user?._id || Math.random().toString()} style={styles.member}>
            <Avatar name={member.user?.name} size={38} />
            <View style={styles.flex}>
              <Text style={styles.memberName}>{member.user?.name || 'Ẩn danh'}</Text>
              {member.user?.major ? <Text style={styles.meta}>{member.user.major}</Text> : null}
            </View>
            <Badge
              label={member.role === 'leader' ? 'Trưởng nhóm' : 'Thành viên'}
              tone={member.role === 'leader' ? 'brand' : 'neutral'}
            />
            {isLeader && member.role !== 'leader' ? (
              <Pressable onPress={() => removeMember(member)} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={palette.danger} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </Card>

      {isLeader ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Yêu cầu tham gia ({requests.length})</Text>
          {requests.length === 0 ? (
            <Text style={styles.meta}>Chưa có yêu cầu đang chờ.</Text>
          ) : (
            requests.map((request) => (
              <View key={request._id} style={styles.request}>
                <View style={styles.member}>
                  <Avatar name={request.applicant?.name} size={38} />
                  <View style={styles.flex}>
                    <Text style={styles.memberName}>{request.applicant?.name || 'Ẩn danh'}</Text>
                    {request.applicant?.major ? (
                      <Text style={styles.meta}>{request.applicant.major}</Text>
                    ) : null}
                  </View>
                </View>
                {request.message ? <Text style={styles.requestMsg}>“{request.message}”</Text> : null}
                {request.applicant?.skills && request.applicant.skills.length > 0 ? (
                  <View style={styles.tags}>
                    {request.applicant.skills.map((skill) => (
                      <Badge key={skill} label={skill} tone="neutral" />
                    ))}
                  </View>
                ) : null}
                <View style={styles.actionRow}>
                  <Button
                    label="Chấp nhận"
                    size="sm"
                    style={styles.flex}
                    onPress={() => decide(request._id, 'accepted')}
                  />
                  <Button
                    label="Từ chối"
                    variant="secondary"
                    size="sm"
                    style={styles.flex}
                    onPress={() => decide(request._id, 'rejected')}
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      ) : null}

      {isLeader && teammates.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Bạn học phù hợp</Text>
          {teammates.map((teammate) => (
            <View key={teammate._id} style={styles.member}>
              <Avatar name={teammate.name} size={38} />
              <View style={styles.flex}>
                <Text style={styles.memberName}>{teammate.name}</Text>
                <Text style={styles.meta}>{teammate.major || teammate.skills?.join(', ') || 'Sinh viên'}</Text>
              </View>
              <Button label="Mời" size="sm" loading={inviting === teammate._id} onPress={() => invite(teammate)} />
            </View>
          ))}
        </Card>
      ) : null}

      {isMember ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Không gian làm việc</Text>
          </View>
          <View style={styles.actionRow}>
            <Button
              label="Thêm liên kết"
              variant="secondary"
              size="sm"
              style={styles.flex}
              onPress={() => setShowLinkForm((v) => !v)}
            />
            <Button label="Tải tệp" variant="secondary" size="sm" style={styles.flex} loading={busy} onPress={addFile} />
          </View>
          {showLinkForm ? (
            <View style={styles.linkForm}>
              <TextField
                placeholder="Tiêu đề"
                value={linkForm.title}
                onChangeText={(title) => setLinkForm({ ...linkForm, title })}
              />
              <TextField
                placeholder="https://..."
                autoCapitalize="none"
                value={linkForm.url}
                onChangeText={(url) => setLinkForm({ ...linkForm, url })}
              />
              <Button label="Lưu liên kết" size="sm" loading={busy} onPress={addLink} />
            </View>
          ) : null}
          {resources.length === 0 ? (
            <Text style={styles.meta}>Chưa có tài nguyên nào.</Text>
          ) : (
            resources.map((resource) => {
              const canDelete = isLeader || resource.uploadedBy?._id === myId;
              return (
                <View key={resource._id} style={styles.resource}>
                  <Ionicons
                    name={resource.type === 'link' ? 'link-outline' : 'document-outline'}
                    size={20}
                    color={palette.brand}
                  />
                  <Pressable style={styles.flex} onPress={() => openResource(resource)}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.meta}>
                      {resource.uploadedBy?.name ? `${resource.uploadedBy.name} · ` : ''}
                      {formatRelative(resource.createdAt)}
                    </Text>
                  </Pressable>
                  {canDelete ? (
                    <Pressable onPress={() => removeResource(resource)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={palette.danger} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </Card>
      ) : null}

      {isMember && team ? (
        <Card style={styles.card}>
          <TeamChat teamId={team._id} myId={myId} />
        </Card>
      ) : null}

      {canRequest ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Gửi yêu cầu tham gia</Text>
          <TextField
            placeholder="Lời nhắn tới trưởng nhóm (tùy chọn)"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <Button label="Gửi yêu cầu tham gia" loading={submitting} onPress={requestJoin} />
        </Card>
      ) : null}

        {isMember && !isLeader ? <Button label="Rời nhóm" variant="danger" onPress={leaveTeam} /> : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, gap: 12 },
  flex: { flex: 1 },
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 20, fontWeight: '800', color: palette.text, flex: 1 },
  topic: { fontSize: 15, color: palette.textMuted },
  desc: { fontSize: 14, color: palette.text, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberName: { fontSize: 15, fontWeight: '600', color: palette.text },
  meta: { fontSize: 12, color: palette.textFaint },
  request: { gap: 8, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 },
  requestMsg: { fontSize: 13, color: palette.textMuted, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 12 },
  linkForm: { gap: 8, backgroundColor: palette.neutralSoft, borderRadius: 12, padding: 12 },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 10,
  },
  resourceTitle: { fontSize: 14, fontWeight: '600', color: palette.text },
});
