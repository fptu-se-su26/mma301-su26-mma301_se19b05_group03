import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { palette } from '@/constants/palette';
import { useAuth } from '@/context/auth';
import type { ApiError } from '@/services/api';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError((err as ApiError)?.message || 'Đăng nhập thất bại');
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
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo STE" />
          <Text style={styles.title}>Môi trường học tập thông minh</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục với tài khoản FPT University của bạn.</Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="email@fpt.edu.vn"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Mật khẩu"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Đăng nhập" loading={submitting} onPress={submit} />
            <Pressable accessibilityRole="link" accessibilityLabel="Quên mật khẩu" onPress={() => router.push('/forgot-password' as Href)}>
              <Text style={styles.forgot}>Quên mật khẩu?</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản?</Text>
            <Pressable hitSlop={8} onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Đăng ký ngay</Text>
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
    width: 82,
    height: 82,
    borderRadius: 20,
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginBottom: 12 },
  form: { gap: 14, marginTop: 8 },
  error: { color: palette.danger, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  footerText: { fontSize: 14, color: palette.textMuted },
  footerLink: { fontSize: 14, fontWeight: '700', color: palette.brand },
  forgot: { textAlign: 'right', color: palette.brand, fontWeight: '700' },
});
