import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function SignInScreen() {
  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Banner */}
      <View style={styles.topBanner}>
        <MaterialCommunityIcons
          name="book-education-outline"
          size={44}
          color="#34d399"
        />
        <Text style={styles.brandName}>FPT University</Text>
        <Text style={styles.tagline}>Học để thay đổi thế giới</Text>
      </View>

      {/* Card Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Đăng nhập tài khoản</Text>
        <Text style={styles.cardSubtitle}>
          Vui lòng nhập thông tin để tiếp tục
        </Text>

        <Text style={styles.fieldLabel}>Email sinh viên</Text>
        <View style={styles.fieldRow}>
          <Ionicons name="at-outline" size={20} color="#10b981" />
          <TextInput
            placeholder="student@fpt.edu.vn"
            placeholderTextColor="#94a3b8"
            style={styles.fieldInput}
          />
        </View>

        <Text style={styles.fieldLabel}>Mật khẩu</Text>
        <View style={styles.fieldRow}>
          <Ionicons name="key-outline" size={20} color="#10b981" />
          <TextInput
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            style={styles.fieldInput}
          />
          <Ionicons name="eye-off-outline" size={20} color="#10b981" />
        </View>

        <TouchableOpacity>
          <Text style={styles.forgotPwd}>Lấy lại mật khẩu</Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.separator}>
          <View style={styles.sepLine} />
          <Text style={styles.sepText}>hoặc</Text>
          <View style={styles.sepLine} />
        </View>

        {/* Google login */}
        <TouchableOpacity style={styles.googleBtn}>
          <Ionicons name="logo-google" size={20} color="#ef4444" />
          <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoIconWrap}>
          <Ionicons name="megaphone-outline" size={20} color="#064e3b" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Thông báo hệ thống</Text>
          <Text style={styles.infoDesc}>
            LMS đã cập nhật lên phiên bản 2.5. Vui lòng tải lại trang.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  topBanner: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },

  brandName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f1f5f9",
    marginTop: 12,
    letterSpacing: 1,
  },

  tagline: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#1e293b",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 12,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 4,
  },

  fieldInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#f1f5f9",
  },

  forgotPwd: {
    textAlign: "right",
    color: "#10b981",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 22,
  },

  submitBtn: {
    backgroundColor: "#10b981",
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  submitBtnText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1.5,
  },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  sepLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#334155",
  },

  sepText: {
    marginHorizontal: 12,
    color: "#64748b",
    fontSize: 13,
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },

  googleBtnText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#f1f5f9",
  },

  infoBox: {
    margin: 16,
    marginTop: 20,
    backgroundColor: "#34d399",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#a7f3d0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#064e3b",
    marginBottom: 2,
  },

  infoDesc: {
    fontSize: 13,
    color: "#065f46",
  },
});
