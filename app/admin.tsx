import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { ScreenShell } from '@/components/ui/screen-shell';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { palette } from '@/constants/palette';
import { useAsync } from '@/hooks/use-async';
import { adminApi, notificationApi, type ApiError } from '@/services/api';
import { TextField } from '@/components/ui/text-field';

type Tab = 'overview' | 'clubs' | 'registrations' | 'taxonomies' | 'notifications' | 'reports' | 'settings';
type Taxonomy = { _id: string; type: string; name: string; description?: string; isActive?: boolean };
type Club = { _id: string; name: string; description?: string; status: string; contactEmail?: string; logoUrl?: string; category?: string | { _id: string }; leader?: { _id?: string; name: string } };
type Registration = { _id: string; clubName: string; status: string; contactEmail?: string; applicant?: { name: string } };
type Setting = { platformName: string; maintenanceMode: boolean; allowRegistration: boolean; supportEmail: string; maxUploadSizeMb: number };

export default function AdminWorkspaceScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const stats = useAsync<{ data: { stats: Record<string, unknown> } }>(() => adminApi.stats(), []);
  const activity = useAsync<{ data: { activity: { users: unknown[]; teams: unknown[]; posts: unknown[] } } }>(() => adminApi.activity(), []);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [taxonomyForm, setTaxonomyForm] = useState({ type: 'skill', name: '', description: '' });
  const [editingTaxonomy, setEditingTaxonomy] = useState<string | null>(null);
  const [clubForm, setClubForm] = useState({ name: '', description: '', category: '', leader: '', contactEmail: '', logoUrl: '', status: 'active' });
  const [editingClub, setEditingClub] = useState<string | null>(null);
  const [notificationForm, setNotificationForm] = useState({ mode: 'audience', audience: 'all', recipient: '', message: '', link: '' });
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (tab === 'clubs') setClubs((await adminApi.clubs({ limit: 50 })).data.data || []);
        if (tab === 'registrations') setRegistrations((await adminApi.clubRegistrations({ limit: 50 })).data.data || []);
        if (tab === 'taxonomies') setTaxonomies((await adminApi.taxonomies({ limit: 100 })).data.data || []);
        if (tab === 'reports') setReport((await adminApi.reports()).data.report || null);
        if (tab === 'settings') setSetting((await adminApi.settings()).data.setting || null);
      } catch (err) {
        Alert.alert('Không thể tải dữ liệu', (err as ApiError).message);
      }
    };
    if (tab !== 'overview') load();
  }, [tab]);

  const mutate = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    try { await fn(); } catch (err) { Alert.alert('Không thể thực hiện', (err as ApiError).message); } finally { setSaving(false); }
  };

  const removeClub = (club: Club) => Alert.alert('Xóa câu lạc bộ', `Xóa ${club.name}?`, [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => mutate(async () => { await adminApi.removeClub(club._id); setClubs((items) => items.filter((item) => item._id !== club._id)); }) }]);
  const removeTaxonomy = (item: Taxonomy) => Alert.alert('Xóa danh mục', `Xóa ${item.name}?`, [{ text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: () => mutate(async () => { await adminApi.removeTaxonomy(item._id); setTaxonomies((items) => items.filter((value) => value._id !== item._id)); }) }]);
  const openClub = (club?: Club) => {
    setEditingClub(club?._id || 'new');
    setClubForm({ name: club?.name || '', description: club?.description || '', category: typeof club?.category === 'string' ? club.category : club?.category?._id || '', leader: club?.leader?._id || '', contactEmail: club?.contactEmail || '', logoUrl: club?.logoUrl || '', status: club?.status || 'active' });
  };
  const saveClub = () => mutate(async () => {
    const payload = { name: clubForm.name.trim(), description: clubForm.description.trim(), category: clubForm.category.trim() || null, leader: clubForm.leader.trim(), contactEmail: clubForm.contactEmail.trim(), logoUrl: clubForm.logoUrl.trim(), status: clubForm.status };
    if (editingClub === 'new') await adminApi.createClub(payload);
    else if (editingClub) await adminApi.updateClub(editingClub, payload);
    setEditingClub(null);
    setClubs((await adminApi.clubs({ limit: 50 })).data.data || []);
  });
  const saveTaxonomy = () => mutate(async () => {
    if (editingTaxonomy) await adminApi.updateTaxonomy(editingTaxonomy, { name: taxonomyForm.name.trim(), description: taxonomyForm.description.trim() });
    else await adminApi.createTaxonomy(taxonomyForm);
    setEditingTaxonomy(null);
    setTaxonomyForm({ type: 'skill', name: '', description: '' });
    setTaxonomies((await adminApi.taxonomies({ limit: 100 })).data.data || []);
  });
  const sendNotification = () => mutate(async () => {
    const payload = notificationForm.mode === 'recipient'
      ? { recipient: notificationForm.recipient.trim(), message: notificationForm.message.trim(), link: notificationForm.link.trim() }
      : { audience: notificationForm.audience, message: notificationForm.message.trim(), link: notificationForm.link.trim() };
    const result = await notificationApi.send(payload);
    setRecipientCount(result.data.data.recipientCount);
    setNotificationForm({ ...notificationForm, message: '', link: '' });
  });

  const renderTab = () => {
    if (tab === 'overview') {
      const values = stats.data?.data.stats || {};
      return <><View style={styles.grid}>{[['Người dùng', 'totalUsers'], ['Nhóm', 'totalTeams'], ['Học phần', 'totalCourses'], ['Câu lạc bộ', 'totalClubs']].map(([label, key]) => <Card key={key} style={styles.stat}><Text style={styles.value}>{String(values[key] || 0)}</Text><Text style={styles.muted}>{label}</Text></Card>)}</View><Card style={styles.card}><Text style={styles.heading}>Hoạt động gần đây</Text><Text style={styles.muted}>{activity.data?.data.activity.users.length || 0} người dùng mới</Text><Text style={styles.muted}>{activity.data?.data.activity.teams.length || 0} nhóm mới</Text><Text style={styles.muted}>{activity.data?.data.activity.posts.length || 0} bài đăng mới</Text></Card></>;
    }
    if (tab === 'clubs') return <><Card style={styles.card}><Text style={styles.heading}>{editingClub === 'new' ? 'Tạo câu lạc bộ' : editingClub ? 'Cập nhật câu lạc bộ' : 'Tạo câu lạc bộ'}</Text>{['name', 'description', 'category', 'leader', 'contactEmail', 'logoUrl'].map((key) => <TextField key={key} label={{ name: 'Tên', description: 'Mô tả', category: 'Mã danh mục', leader: 'Mã người phụ trách', contactEmail: 'Email liên hệ', logoUrl: 'Đường dẫn logo' }[key]} value={clubForm[key as keyof typeof clubForm]} onChangeText={(value) => setClubForm({ ...clubForm, [key]: value })} />)}<ChipSelect label="Trạng thái" options={[{ value: 'active', label: 'Đang hoạt động' }, { value: 'inactive', label: 'Ngừng hoạt động' }]} value={clubForm.status} onChange={(status) => setClubForm({ ...clubForm, status })} /><View style={styles.actions}><Button label="Hủy" variant="secondary" onPress={() => setEditingClub(null)} /><Button label={editingClub ? 'Lưu câu lạc bộ' : 'Tạo câu lạc bộ'} loading={saving} onPress={saveClub} /></View></Card><Card style={styles.card}><View style={styles.row}><Text style={styles.heading}>Câu lạc bộ ({clubs.length})</Text><Button label="＋ Tạo" size="sm" onPress={() => openClub()} /></View>{clubs.map((club) => <View key={club._id} style={styles.row}><View style={styles.flex}><Text style={styles.item}>{club.name}</Text><Text style={styles.muted}>{club.leader?.name || club.contactEmail || ''} · {club.status}</Text></View><Button label="Sửa" size="sm" onPress={() => openClub(club)} /><Button label="Xóa" size="sm" variant="danger" onPress={() => removeClub(club)} /></View>)}</Card></>;
    if (tab === 'registrations') return <Card style={styles.card}><Text style={styles.heading}>Đơn đăng ký ({registrations.length})</Text>{registrations.map((item) => <View key={item._id} style={styles.request}><View style={styles.flex}><Text style={styles.item}>{item.clubName}</Text><Text style={styles.muted}>{item.applicant?.name || item.contactEmail || ''} · {item.status}</Text></View>{item.status === 'pending' ? <View style={styles.actions}><Button label="Duyệt" size="sm" onPress={() => mutate(async () => { await adminApi.approveClubRegistration(item._id); setRegistrations((items) => items.map((value) => value._id === item._id ? { ...value, status: 'approved' } : value)); })} /><Button label="Từ chối" size="sm" variant="danger" onPress={() => mutate(async () => { await adminApi.rejectClubRegistration(item._id, 'Không phù hợp tiêu chí'); setRegistrations((items) => items.map((value) => value._id === item._id ? { ...value, status: 'rejected' } : value)); })} /></View> : null}</View>)}</Card>;
    if (tab === 'taxonomies') return <><Card style={styles.card}><Text style={styles.heading}>{editingTaxonomy ? 'Cập nhật danh mục' : 'Thêm danh mục'}</Text>{!editingTaxonomy ? <ChipSelect label="Loại" options={[{ value: 'skill', label: 'Kỹ năng' }, { value: 'major', label: 'Chuyên ngành' }, { value: 'category', label: 'Danh mục' }]} value={taxonomyForm.type} onChange={(type) => setTaxonomyForm({ ...taxonomyForm, type })} /> : null}<TextField label="Tên" value={taxonomyForm.name} onChangeText={(name) => setTaxonomyForm({ ...taxonomyForm, name })} /><TextField label="Mô tả" value={taxonomyForm.description} onChangeText={(description) => setTaxonomyForm({ ...taxonomyForm, description })} /><View style={styles.actions}>{editingTaxonomy ? <Button label="Hủy" variant="secondary" onPress={() => { setEditingTaxonomy(null); setTaxonomyForm({ type: 'skill', name: '', description: '' }); }} /> : null}<Button label={editingTaxonomy ? 'Lưu' : 'Thêm'} loading={saving} onPress={saveTaxonomy} /></View></Card><Card style={styles.card}><Text style={styles.heading}>Danh mục hiện có</Text>{taxonomies.map((item) => <View key={item._id} style={styles.row}><View style={styles.flex}><Text style={styles.item}>{item.name}</Text><Text style={styles.muted}>{item.type} · {item.isActive === false ? 'Tắt' : 'Bật'}</Text></View><Button label="Sửa" size="sm" onPress={() => { setEditingTaxonomy(item._id); setTaxonomyForm({ type: item.type, name: item.name, description: item.description || '' }); }} /><Button label="Xóa" size="sm" variant="danger" onPress={() => removeTaxonomy(item)} /></View>)}</Card></>;
    if (tab === 'notifications') return <Card style={styles.card}><Text style={styles.heading}>Gửi thông báo</Text><ChipSelect label="Đối tượng" options={[{ value: 'audience', label: 'Theo nhóm' }, { value: 'recipient', label: 'Theo người nhận' }]} value={notificationForm.mode} onChange={(mode) => setNotificationForm({ ...notificationForm, mode })} />{notificationForm.mode === 'recipient' ? <TextField label="Mã người nhận" value={notificationForm.recipient} onChangeText={(recipient) => setNotificationForm({ ...notificationForm, recipient })} /> : <ChipSelect label="Nhóm người nhận" options={[{ value: 'all', label: 'Tất cả' }, { value: 'student', label: 'Sinh viên' }, { value: 'lecturer', label: 'Giảng viên' }, { value: 'admin', label: 'Quản trị viên' }, { value: 'club_leader', label: 'Chủ nhiệm CLB' }]} value={notificationForm.audience} onChange={(audience) => setNotificationForm({ ...notificationForm, audience })} />}<TextField label="Nội dung" multiline value={notificationForm.message} onChangeText={(message) => setNotificationForm({ ...notificationForm, message })} /><TextField label="Đường dẫn (tùy chọn)" value={notificationForm.link} onChangeText={(link) => setNotificationForm({ ...notificationForm, link })} autoCapitalize="none" /><Button label="Gửi thông báo" loading={saving} onPress={sendNotification} />{recipientCount !== null ? <Text style={styles.success}>Đã gửi đến {recipientCount} người nhận.</Text> : null}</Card>;
    if (tab === 'reports') return <Card style={styles.card}><Text style={styles.heading}>Báo cáo hệ thống</Text>{report ? Object.entries((report.totals || {}) as Record<string, unknown>).map(([key, value]) => <View key={key} style={styles.row}><Text style={styles.muted}>{key}</Text><Text style={styles.item}>{String(value)}</Text></View>) : <LoadingState />}</Card>;
    return setting ? <Card style={styles.card}><Text style={styles.heading}>Cài đặt hệ thống</Text><TextField label="Tên nền tảng" value={setting.platformName} onChangeText={(platformName) => setSetting({ ...setting, platformName })} /><TextField label="Email hỗ trợ" value={setting.supportEmail} onChangeText={(supportEmail) => setSetting({ ...setting, supportEmail })} keyboardType="email-address" autoCapitalize="none" /><TextField label="Giới hạn tải lên (MB)" value={String(setting.maxUploadSizeMb)} onChangeText={(value) => setSetting({ ...setting, maxUploadSizeMb: Number(value) || 1 })} keyboardType="numeric" /><Button label="Lưu cài đặt" loading={saving} onPress={() => mutate(() => adminApi.updateSettings(setting))} /></Card> : <LoadingState />;
  };

  if (stats.loading || activity.loading) return <ScreenShell title="Khu vực quản trị" onBack={() => router.back()}><LoadingState /></ScreenShell>;
  if (stats.error) return <ScreenShell title="Khu vực quản trị" onBack={() => router.back()}><ErrorState message={stats.error} onRetry={stats.reload} /></ScreenShell>;
  const tabs: [Tab, string][] = [['overview', 'Tổng quan'], ['clubs', 'Câu lạc bộ'], ['registrations', 'Đơn đăng ký'], ['taxonomies', 'Danh mục'], ['notifications', 'Thông báo'], ['reports', 'Báo cáo'], ['settings', 'Cài đặt']];
  return <ScreenShell title="Khu vực quản trị" onBack={() => router.back()}><ScrollView contentContainerStyle={styles.body} horizontal={false}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map(([key, label]) => <Pressable key={key} style={[styles.tab, tab === key && styles.activeTab]} onPress={() => setTab(key)}><Text style={tab === key ? styles.activeText : styles.tabText}>{label}</Text></Pressable>)}</ScrollView>{renderTab()}</ScrollView></ScreenShell>;
}

const styles = StyleSheet.create({ body: { padding: 16, gap: 12 }, tabs: { gap: 8, paddingBottom: 4 }, tab: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 10, backgroundColor: palette.neutralSoft }, activeTab: { backgroundColor: palette.brand }, tabText: { color: palette.textMuted, fontWeight: '700' }, activeText: { color: '#fff', fontWeight: '700' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, stat: { width: '47%', gap: 3 }, value: { color: palette.brand, fontSize: 25, fontWeight: '800' }, card: { gap: 12 }, heading: { color: palette.text, fontSize: 16, fontWeight: '800' }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 }, request: { gap: 10, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 }, actions: { flexDirection: 'row', gap: 8 }, flex: { flex: 1 }, item: { color: palette.text, fontWeight: '600' }, muted: { color: palette.textMuted, fontSize: 13 }, success: { color: palette.success, fontWeight: '700' } });
