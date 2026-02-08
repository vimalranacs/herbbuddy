import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SkeletonCard } from "../../components/SkeletonLoader";
import { getCachedEvents, setCachedEvents } from "../../lib/cache";
import { calculateDistance, Coordinates, formatDistance, getCurrentLocation } from "../../lib/location";
import { supabase } from "../../lib/supabase";

interface Event {
  id: string;
  title: string;
  location: string;
  time: string;
  description: string;
  max_attendees: number;
  host_id: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Calculated client-side
  tags?: string[];
  contribution_needed?: boolean;
  contribution_details?: string;
  created_at?: string;
}

const CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "Hangout", label: "Hangout", emoji: "🌙" },
  { id: "Party", label: "Party", emoji: "🎉" },
  { id: "Outdoor", label: "Outdoor", emoji: "🌿" },
  { id: "Indoor", label: "Indoor", emoji: "🏠" },
  { id: "Study", label: "Study", emoji: "📚" },
  { id: "Cafe", label: "Cafe", emoji: "☕" },
  { id: "Music", label: "Music", emoji: "🎵" },
  { id: "Sports", label: "Sports", emoji: "⚽" },
  { id: "Gaming", label: "Gaming", emoji: "🎮" },
  { id: "Food", label: "Food", emoji: "🍔" },
  { id: "Chill", label: "Chill", emoji: "🧊" },
];

const isNewEvent = (dateString?: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
};

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    initializeLocation();
    fetchEvents();
  }, []);

  const initializeLocation = async () => {
    const result = await getCurrentLocation();
    if (result.success && result.coordinates) {
      setUserLocation(result.coordinates);
    } else {
      setLocationError(true);
    }
  };

  const fetchEvents = async (useCache = true) => {
    try {
      // Try to use cache first
      if (useCache) {
        const cachedEvents = await getCachedEvents();
        if (cachedEvents && cachedEvents.length > 0) {
          setEvents(cachedEvents);
          setLoading(false);
          // Still fetch fresh data in background
          fetchFreshEvents();
          return;
        }
      }
      await fetchFreshEvents();
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchFreshEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(data || []);
      // Cache the events
      if (data && data.length > 0) {
        await setCachedEvents(data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(false); // Skip cache on refresh
  };

  // Filter events by category and search query, calculate distances
  const filteredEvents = events
    .map((event) => {
      // Calculate distance if user location and event location are available
      let distance: number | undefined;
      if (userLocation && event.latitude && event.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.latitude,
          event.longitude
        );
      }
      return { ...event, distance };
    })
    .filter((event) => {
      // Filter by tags if a specific category is selected
      const matchesCategory = selectedCategory === "all" ||
        (event.tags && event.tags.includes(selectedCategory)) ||
        // Fallback for older events without tags: match text
        (!event.tags && `${event.title} ${event.description || ""}`.toLowerCase().includes(selectedCategory.toLowerCase()));

      const matchesSearch = searchQuery.trim() === "" ||
        `${event.title} ${event.description || ""} ${event.location} ${event.tags?.join(" ") || ""}`.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by distance (nearest first), events without distance go last
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return 0;
    });

  const getCategoryColor = (index: number) => {
    const colors = ["#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#6366F1", "#EC4899"];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore Events</Text>
          <Text style={styles.headerSubtitle}>
            Discover what's happening nearby
          </Text>
        </View>
        <Pressable style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color="#2f855a" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#a0aec0" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, places..."
            placeholderTextColor="#a0aec0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#a0aec0" />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.locationButton}>
          <Ionicons name="location" size={18} color="#fff" />
          <Text style={styles.locationText}>Nearby</Text>
        </Pressable>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryPill,
              selectedCategory === cat.id &&
              styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === cat.id &&
                styles.categoryLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Events Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredEvents.length} events found
        </Text>
        <View style={styles.sortContainer}>
          <Text style={styles.sortText}>Sort by: </Text>
          <Pressable style={styles.sortButton}>
            <Text style={styles.sortValue}>Recent</Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color="#2f855a"
            />
          </Pressable>
        </View>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.eventsContainer}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2f855a"]}
            tintColor="#2f855a"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or category filters, or be the first to create one!
            </Text>
            <Pressable
              style={styles.createEventEmptyButton}
              onPress={() => router.push('/add-event')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createEventEmptyText}>Create Event</Text>
            </Pressable>
          </View>
        ) : (
          filteredEvents.map((event, index) => {
            const color = getCategoryColor(index);
            return (
              <Pressable key={event.id} style={styles.eventCard}>
                {/* Event Emoji Badge */}
                <View
                  style={[
                    styles.eventEmojiBadge,
                    { backgroundColor: color + "20" },
                  ]}
                >
                  <Ionicons name="leaf" size={24} color={color} />
                </View>

                {/* Event Content */}
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    {event.distance !== undefined && (
                      <View style={styles.distanceBadge}>
                        <Ionicons name="navigate" size={10} color="#2f855a" />
                        <Text style={styles.distanceText}>
                          {formatDistance(event.distance)}
                        </Text>
                      </View>
                    )}
                    {isNewEvent(event.created_at) && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>

                  {/* Tags Row */}
                  {event.tags && event.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {event.tags.slice(0, 3).map(tag => (
                        <View key={tag} style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Contribution Badge */}
                  {event.contribution_needed && (
                    <View style={styles.contributionBadge}>
                      <Ionicons name="wallet-outline" size={12} color="#d97706" />
                      <Text style={styles.contributionText} numberOfLines={1}>
                        {event.contribution_details || "Contribution Needed"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#718096"
                      />
                      <Text style={styles.eventDetailText}>
                        {event.location}
                      </Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="#718096"
                      />
                      <Text style={styles.eventDetailText}>
                        {event.time}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.eventFooter}>
                    <View style={styles.attendeesInfo}>
                      <Ionicons name="people" size={14} color="#718096" />
                      <Text style={styles.attendeesText}>
                        0/{event.max_attendees} joined
                      </Text>
                    </View>
                    <Pressable
                      style={styles.joinButton}
                      onPress={() => router.push(`/join-plan?eventId=${event.id}&title=${encodeURIComponent(event.title)}`)}
                    >
                      <Text style={styles.joinButtonText}>
                        Join
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#fff"
                      />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a202c",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: "#a0aec0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a202c",
    padding: 0,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2f855a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  categoriesContainer: {
    backgroundColor: "#fff",
    paddingBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: "#2f855a",
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4a5568",
  },
  categoryLabelActive: {
    color: "#fff",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    fontSize: 13,
    color: "#718096",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sortValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2f855a",
  },
  eventsContainer: {
    flex: 1,
  },
  eventsContent: {
    paddingHorizontal: 20,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  eventEmojiBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a202c",
    flex: 1,
    marginRight: 8,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
    color: "#718096",
    flex: 1,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  attendeesInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attendeesText: {
    fontSize: 12,
    color: "#718096",
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2f855a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#718096",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
    width: "70%",
    textAlign: "center",
    marginBottom: 20,
  },
  createEventEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2f855a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createEventEmptyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  newBadge: {
    backgroundColor: "#ff4757",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  tagBadgeText: {
    fontSize: 10,
    color: "#15803d",
    fontWeight: "600",
  },
  contributionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
    marginBottom: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  contributionText: {
    fontSize: 11,
    color: "#b45309",
    fontWeight: "600",
  },
  bottomPadding: {
    height: 100,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6fffa",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2f855a",
  },
});
