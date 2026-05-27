import { Image, StyleSheet, Text, View } from "react-native";

import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Banner */}
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
        }}
        style={styles.banner}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Ionicons name="home" size={32} color="#2563eb" />
          <Text style={styles.activeText}>Home</Text>
        </View>

        <View style={styles.navItem}>
          <MaterialIcons name="smart-toy" size={32} color="#000" />
          <Text style={styles.navText}>AI Study</Text>
        </View>

        <View style={styles.navItem}>
          <Ionicons name="people-outline" size={32} color="#000" />
          <Text style={styles.navText}>Team</Text>
        </View>

        <View style={styles.navItem}>
          <Feather name="bell" size={32} color="#000" />
          <Text style={styles.navText}>Notify</Text>
        </View>

        <View style={styles.navItem}>
          <Ionicons name="person-circle-outline" size={34} color="#000" />
          <Text style={styles.navText}>Profile</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Hệ thống tự học thông minh</Text>

        <Text style={styles.subtitle}>
          AI hỗ trợ học tập, teamwork và quản lý học tập dành cho sinh viên.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  banner: {
    width: "100%",
    height: 260,
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    backgroundColor: "#fff",

    paddingVertical: 15,

    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,

    marginTop: -20,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,

    elevation: 10,
  },

  navItem: {
    alignItems: "center",
  },

  activeText: {
    color: "#2563eb",
    fontWeight: "bold",
    marginTop: 5,
  },

  navText: {
    color: "#444",
    marginTop: 5,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
});
