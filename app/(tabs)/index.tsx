import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

interface Event {
  id: string;
  title: string;
  location: string;
  time: string;
  description: string;
  max_attendees: number;
  tags?: string[];
  contribution_needed?: boolean;
}

export default function HomeScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

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

      {/* Events */}
      <ScrollView
        contentContainerStyle={styles.cardsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2f855a"]}
            tintColor="#2f855a"
          />
        }
      >
        <Text style={styles.sectionTitle}>Recent Events</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2f855a" />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={48} color="#cbd5e0" />
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create one!</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.card}>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardSubtitle}>📍 {event.location}</Text>
              <Text style={styles.cardTime}>🕐 {event.time}</Text>

              {/* Tags Row */}
              {event.tags && event.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {event.tags.slice(0, 3).map(tag => (
                    <View key={tag} style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' }}>
                      <Text style={{ fontSize: 10, color: '#15803d', fontWeight: '600' }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contribution Badge */}
              {event.contribution_needed && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                  <Ionicons name="wallet-outline" size={12} color="#d97706" />
                  <Text style={{ fontSize: 11, color: "#b45309", fontWeight: "600" }}>
                    Contribution Needed
                  </Text>
                </View>
              )}

              <Pressable
                style={styles.cardButton}
                onPress={() =>
                  router.push(`/join-plan?eventId=${event.id}&title=${encodeURIComponent(event.title)}`)
                }
              >
                <Text style={styles.cardButtonText}>View Details</Text>
              </Pressable>
            </View>
          ))
        )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#1a202c" },
  cardSubtitle: { fontSize: 13, color: "#718096", marginTop: 4 },
  cardTime: { fontSize: 13, color: "#718096", marginTop: 2 },
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a202c",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
  },
});
