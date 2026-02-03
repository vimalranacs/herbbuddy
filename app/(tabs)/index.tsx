import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>HerbBuddy 🌿</Text>
        <Text style={styles.tagline}>Find a buddy for the moment</Text>
      </View>

      {/* Feature Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Find Your Herb Buddy</Text>
        <Text style={styles.bannerText}>
          Discover nearby people and events to vibe, explore herbs, or just
          chill.
        </Text>
        <Pressable
          style={styles.bannerButton}
          onPress={() => router.push("/discover")}
        >
          <Text style={styles.bannerButtonText}>Discover Now</Text>
        </Pressable>
      </View>

      {/* Events / People */}
      <ScrollView contentContainerStyle={styles.cardsContainer}>
        {["Evening Walk", "Herb Session", "Cafe Meetup"].map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{item}</Text>
            <Text style={styles.cardSubtitle}>2–3 people nearby</Text>
            <Pressable style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Join</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        style={styles.floatingButton}
        onPress={() => router.push("/add-event")}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7fafc" },
  header: { paddingTop: 60, paddingBottom: 20, alignItems: "center" },
  appName: { fontSize: 28, fontWeight: "bold", color: "#22543d" },
  tagline: { fontSize: 14, color: "#4a5568", marginTop: 4 },
  banner: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#e6fffa",
  },
  bannerTitle: { fontSize: 20, fontWeight: "600", color: "#065f46" },
  bannerText: { fontSize: 14, color: "#2d3748", marginVertical: 8 },
  bannerButton: {
    marginTop: 10,
    backgroundColor: "#2f855a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  bannerButtonText: { color: "#fff", fontWeight: "600" },
  cardsContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#1a202c" },
  cardSubtitle: { fontSize: 13, color: "#718096", marginVertical: 4 },
  cardButton: {
    marginTop: 10,
    backgroundColor: "#edfdf6",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  cardButtonText: { color: "#2f855a", fontWeight: "600" },
  floatingButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2f855a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2f855a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
