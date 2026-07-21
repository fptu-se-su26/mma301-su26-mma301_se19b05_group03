import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import type { ApiError } from '@/services/api';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', major: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Vui lòng nhập họ tên, email và mật khẩu.');
      return;
    }
    if (form.password.length < 8) {
      setError('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        major: form.major.trim(),
      });
    } catch (err) {
      setError((err as ApiError)?.message || 'Đăng ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoText}>STE</Text>
          </View>
          <Text style={styles.title}>Đăng ký sinh viên</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu tìm nhóm và ôn tập cùng STE.</Text>

          <View style={styles.form}>
            <TextField
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
            />
            <TextField
              label="Email trường"
              placeholder="tenban@fpt.edu.vn"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(email) => setForm({ ...form, email })}
            />
            <TextField
              label="Chuyên ngành"
              placeholder="Kỹ thuật phần mềm"
              value={form.major}
              onChangeText={(major) => setForm({ ...form, major })}
            />
            <TextField
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự"
              secureTextEntry
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Đăng ký" loading={submitting} onPress={submit} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản?</Text>
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Text style={styles.footerLink}>Đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginBottom: 12 },
  form: { gap: 14, marginTop: 8 },
  error: { color: palette.danger, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  footerText: { fontSize: 14, color: palette.textMuted },
  footerLink: { fontSize: 14, fontWeight: '700', color: palette.brand },
});
