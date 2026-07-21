import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import { useAsync } from '@/hooks/use-async';
import { assignmentApi } from '@/services/api';
import type { ApiError } from '@/services/api';
import { formatDateTime } from '@/utils/format';
import { openProtectedFile } from '@/services/protected-file';

type MySubmission = {
  status: string;
  score: number | null;
  feedback: string;
  fileUrl: string;
  fileName: string;
  content: string;
  submittedAt: string;
  gradedAt: string | null;
} | null;

type Assignment = {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  maxScore: number;
  course?: { _id: string; code: string; title: string };
  mySubmission?: MySubmission;
  submissionCount?: number;
};

type SubmissionRow = {
  _id: string;
  content: string;
  fileUrl: string;
  fileName: string;
  status: string;
  score: number | null;
  feedback: string;
  submittedAt: string;
  student: { _id: string; name: string; email?: string; avatarUrl?: string; major?: string };
};

type PickedFile = { uri: string; name: string; mimeType?: string };

const openAttachment = async (fileUrl?: string) => {
  await openProtectedFile(fileUrl);
};

export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'lecturer' || user?.role === 'admin';

  const detail = useAsync<{ data: { assignment: Assignment } }>(() => assignmentApi.get(String(id)), [id]);
  const submissions = useAsync<{ data: SubmissionRow[] }>(
    () => (canManage ? assignmentApi.submissions(String(id)) : Promise.resolve({ data: [] })),
    [id]
  );

  const assignment = detail.data?.data.assignment;

  const [content, setContent] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});
  const [gradingId, setGradingId] = useState<string | null>(null);

  const back = () => router.back();

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  const submitWork = async () => {
    if (!content.trim() && !file) {
      setSubmitError('Vui lòng nhập nội dung hoặc đính kèm tệp.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (file) {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as unknown as Blob);
      }
      await assignmentApi.submit(String(id), formData);
      setContent('');
      setFile(null);
      await detail.reload();
    } catch (err) {
      setSubmitError((err as ApiError)?.message || 'Không thể nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  const gradeState = (row: SubmissionRow) =>
    grades[row._id] ?? { score: row.score == null ? '' : String(row.score), feedback: row.feedback || '' };

  const grade = async (row: SubmissionRow) => {
    const state = gradeState(row);
    if (state.score.trim() === '') return;
    setGradingId(row._id);
    try {
      await assignmentApi.grade(String(id), row._id, {
        score: Number(state.score),
        feedback: state.feedback.trim(),
      });
      await submissions.reload();
      await detail.reload();
    } catch (err) {
      setSubmitError((err as ApiError)?.message || 'Không thể chấm điểm.');
    } finally {
      setGradingId(null);
    }
  };

  if (detail.loading)
    return (
      <ScreenShell title="Bài tập" onBack={back}>
        <LoadingState />
      </ScreenShell>
    );
  if (detail.error || !assignment)
    return (
      <ScreenShell title="Bài tập" onBack={back}>
        <ErrorState message={detail.error || 'Không tìm thấy bài tập'} onRetry={detail.reload} />
      </ScreenShell>
    );

  const mine = assignment.mySubmission;

  return (
    <ScreenShell title="Chi tiết bài tập" onBack={back}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.title}>{assignment.title}</Text>
          <View style={styles.metaRow}>
            {assignment.course ? <Badge label={assignment.course.code} tone="neutral" /> : null}
            <Badge label={`Tối đa ${assignment.maxScore} điểm`} tone="brand" />
          </View>
          <Text style={styles.meta}>
            {assignment.dueDate ? `Hạn nộp: ${formatDateTime(assignment.dueDate)}` : 'Không có hạn nộp'}
          </Text>
          {assignment.description ? <Text style={styles.desc}>{assignment.description}</Text> : null}
        </Card>

        {isStudent ? (
          <>
            {mine ? (
              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Bài nộp của bạn</Text>
                <Badge label={mine.status === 'graded' ? 'Đã chấm' : 'Đã nộp'} tone={mine.status === 'graded' ? 'success' : 'warning'} />
                {mine.content ? <Text style={styles.desc}>{mine.content}</Text> : null}
                {mine.fileName ? (
                  <Button label={`Mở: ${mine.fileName}`} variant="secondary" size="sm" onPress={() => openAttachment(mine.fileUrl)} />
                ) : null}
                <Text style={styles.meta}>Nộp lúc: {formatDateTime(mine.submittedAt)}</Text>
                {mine.status === 'graded' ? (
                  <View style={styles.gradeBox}>
                    <Text style={styles.score}>
                      Điểm: {mine.score}/{assignment.maxScore}
                    </Text>
                    {mine.feedback ? <Text style={styles.desc}>Nhận xét: {mine.feedback}</Text> : null}
                  </View>
                ) : null}
              </Card>
            ) : null}

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{mine ? 'Nộp lại bài' : 'Nộp bài'}</Text>
              <TextField label="Nội dung" placeholder="Nhập nội dung hoặc ghi chú..." value={content} onChangeText={setContent} multiline />
              <Button label={file ? file.name : 'Đính kèm tệp (tùy chọn)'} variant="secondary" onPress={pickFile} />
              {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
              <Button label="Nộp bài" loading={submitting} onPress={submitWork} />
            </Card>
          </>
        ) : null}

        {canManage ? (
          <>
            <Text style={styles.sectionTitle}>Bài nộp của sinh viên</Text>
            {submissions.loading ? (
              <LoadingState />
            ) : (submissions.data?.data ?? []).length === 0 ? (
              <EmptyState title="Chưa có bài nộp" description="Chưa có sinh viên nào nộp bài." />
            ) : (
              (submissions.data?.data ?? []).map((row) => {
                const state = gradeState(row);
                return (
                  <Card key={row._id} style={styles.card}>
                    <View style={styles.studentRow}>
                      <Avatar name={row.student.name} size={36} />
                      <View style={styles.flex}>
                        <Text style={styles.studentName}>{row.student.name}</Text>
                        <Text style={styles.meta}>Nộp lúc: {formatDateTime(row.submittedAt)}</Text>
                      </View>
                      <Badge label={row.status === 'graded' ? 'Đã chấm' : 'Chưa chấm'} tone={row.status === 'graded' ? 'success' : 'warning'} />
                    </View>
                    {row.content ? <Text style={styles.desc}>{row.content}</Text> : null}
                    {row.fileName ? (
                      <Button label={`Mở: ${row.fileName}`} variant="secondary" size="sm" onPress={() => openAttachment(row.fileUrl)} />
                    ) : null}
                    <View style={styles.gradeRow}>
                      <TextField
                        containerStyle={styles.scoreInput}
                        label={`Điểm (tối đa ${assignment.maxScore})`}
                        keyboardType="number-pad"
                        value={state.score}
                        onChangeText={(score) => setGrades((prev) => ({ ...prev, [row._id]: { ...state, score } }))}
                      />
                    </View>
                    <TextField
                      label="Nhận xét"
                      value={state.feedback}
                      onChangeText={(feedback) => setGrades((prev) => ({ ...prev, [row._id]: { ...state, feedback } }))}
                      multiline
                    />
                    <Button label="Lưu điểm" size="sm" loading={gradingId === row._id} onPress={() => grade(row)} />
                  </Card>
                );
              })
            )}
          </>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 12 },
  card: { gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: palette.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: 12, color: palette.textFaint },
  desc: { fontSize: 14, color: palette.text, lineHeight: 21 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  score: { fontSize: 16, fontWeight: '800', color: palette.success },
  gradeBox: { gap: 6, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  studentName: { fontSize: 15, fontWeight: '700', color: palette.text },
  gradeRow: { flexDirection: 'row', gap: 10 },
  scoreInput: { width: 160 },
  error: { color: palette.danger, fontSize: 13 },
});
