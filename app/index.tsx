import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const handleLogin = () => {
    router.push("/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>FPT University</Text>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeContainer}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name="school-outline"
              size={40}
              color="#b45309"
            />
          </View>

          <Text style={styles.title}>Chào mừng trở lại!</Text>

          <Text style={styles.subtitle}>
            Đăng nhập để tiếp tục hành trình học tập của bạn.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <Text style={styles.label}>Email Sinh viên</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#555" />

            <TextInput
              placeholder="student@fpt.edu.vn"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Mật khẩu</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color="#555" />

            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
              style={styles.input}
            />

            <Ionicons name="eye-outline" size={22} color="#555" />
          </View>

          {/* Forgot */}
          <TouchableOpacity>
            <Text style={styles.forgot}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />

            <Text style={styles.or}>HOẶC</Text>

            <View style={styles.line} />
          </View>

          {/* Google */}
          <TouchableOpacity style={styles.googleButton}>
            <Ionicons name="logo-google" size={22} color="#2563eb" />

            <Text style={styles.googleText}>Đăng nhập bằng Google</Text>
          </TouchableOpacity>
        </View>

        {/* Notice */}
        <View style={styles.notice}>
          <Ionicons name="notifications-outline" size={24} color="#92400e" />

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Thông báo mới</Text>

            <Text style={styles.noticeText}>
              Hệ thống LMS đã được cập nhật phiên bản 2.5.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  header: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#b45309",
  },

  welcomeContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
    paddingHorizontal: 20,
  },

  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    lineHeight: 24,
  },

  form: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 55,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#000",
  },

  forgot: {
    textAlign: "right",
    color: "#92400e",
    fontWeight: "600",
    marginBottom: 20,
  },

  loginButton: {
    backgroundColor: "#f97316",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },

  or: {
    marginHorizontal: 10,
    color: "#777",
    fontWeight: "600",
  },

  googleButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  googleText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a8a",
  },

  notice: {
    margin: 20,
    backgroundColor: "#fff7ed",
    borderLeftWidth: 5,
    borderLeftColor: "#c2410c",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
  },

  noticeContent: {
    marginLeft: 10,
    flex: 1,
  },

  noticeTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  noticeText: {
    color: "#444",
    lineHeight: 20,
  },
});
