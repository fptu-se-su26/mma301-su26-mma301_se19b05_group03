import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>FPT University</Text>

        <View style={styles.logoBox}>
          <Text style={styles.logo}>🎓</Text>
        </View>

        <Text style={styles.title}>Chào mừng trở lại!</Text>
        <Text style={styles.subtitle}>
          Đăng nhập để tiếp tục hành trình học tập của bạn.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Email Sinh viên</Text>
          <TextInput
            style={styles.input}
            placeholder="student@fpt.edu.vn"
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            secureTextEntry
          />

          <TouchableOpacity>
            <Text style={styles.forgot}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn}>
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>

          <Text style={styles.or}>HOẶC</Text>

          <TouchableOpacity style={styles.googleBtn}>
            <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Thông báo mới</Text>
          <Text style={styles.noticeText}>
            Hệ thống LMS đã được cập nhật phiên bản 2.5.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 FPT University</Text>
          <Text style={styles.footerText}>Privacy Policy</Text>
          <Text style={styles.footerText}>Terms of Service</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#b45309',
    marginTop: 30,
    marginLeft: 20,
  },
  logoBox: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    alignSelf: 'center',
    borderRadius: 20,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginHorizontal: 40,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
  },
  forgot: {
    textAlign: 'right',
    color: '#b45309',
    marginTop: 10,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#f97316',
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
  },
  loginText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  or: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#555',
    fontWeight: '600',
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
  },
  googleText: {
    textAlign: 'center',
    color: '#1e3a8a',
    fontSize: 16,
  },
  noticeBox: {
    backgroundColor: '#fff7ed',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#c2410c',
  },
  noticeTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  noticeText: {
    marginTop: 8,
    color: '#555',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 40,
    gap: 8,
  },
  footerText: {
    color: '#666',
  },
});