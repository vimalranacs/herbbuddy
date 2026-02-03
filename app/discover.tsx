import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

// Type for events
interface Event {
    id: string;
    title: string;
    location: string;
    time: string;
    description: string;
    max_attendees: number;
    host_id: string;
}

export default function DiscoverScreen() {
    const [filterDistance, setFilterDistance] = useState<"all" | "near">("all");
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch events from Supabase
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching events:", error);
                return;
            }

            if (data) {
                // For now, we'll add mock distance and attendees to match the UI expectations
                // In a real app, these would come from the backend or be calculated.
                const eventsWithMockData = data.map((event: any, index: number) => ({
                    ...event,
                    distance: `${(index * 0.5 + 0.3).toFixed(1)} km`, // Mock distance
                    attendees: event.max_attendees - Math.floor(Math.random() * 3), // Mock attendees
                }));
                setEvents(eventsWithMockData);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Mock filtering for now (in real app, use geolocation)
    const filteredEvents =
        filterDistance === "near"
            ? events.slice(0, 3) // Show first 3 as "nearby"
            : events;

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover Events 🌿</Text>
                <Text style={styles.headerSubtitle}>
                    Find herb buddies near you
                </Text>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <Pressable
                        style={[
                            styles.filterTab,
                            filterDistance === "all" && styles.filterTabActive,
                        ]}
                        onPress={() => setFilterDistance("all")}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filterDistance === "all" && styles.filterTextActive,
                            ]}
                        >
                            All Events
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.filterTab,
                            filterDistance === "near" && styles.filterTabActive,
                        ]}
                        onPress={() => setFilterDistance("near")}
                    >
                        <Ionicons
                            name="location"
                            size={16}
                            color={filterDistance === "near" ? "#fff" : "#2f855a"}
                        />
                        <Text
                            style={[
                                styles.filterText,
                                filterDistance === "near" && styles.filterTextActive,
                            ]}
                        >
                            Near Me
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Map Placeholder - Visual Representation */}
            <View style={styles.mapPlaceholder}>
                <View style={styles.mapOverlay}>
                    <Ionicons name="navigate-circle" size={80} color="#10b981" />
                    <Text style={styles.mapText}>
                        {filteredEvents.length} events nearby
                    </Text>
                </View>
                {/* Decorative pins */}
                <View style={[styles.pin, { top: "20%", left: "30%" }]}>
                    <Ionicons name="location" size={24} color="#ef4444" />
                </View>
                <View style={[styles.pin, { top: "40%", right: "25%" }]}>
                    <Ionicons name="location" size={24} color="#ef4444" />
                </View>
                <View style={[styles.pin, { bottom: "30%", left: "20%" }]}>
                    <Ionicons name="location" size={24} color="#ef4444" />
                </View>
                <View style={[styles.pin, { bottom: "25%", right: "30%" }]}>
                    <Ionicons name="location" size={24} color="#ef4444" />
                </View>
            </View>

            {/* Events List */}
            <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Events Near You</Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2f855a" />
                        <Text style={styles.loadingText}>Loading events...</Text>
                    </View>
                ) : filteredEvents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="leaf-outline" size={64} color="#cbd5e0" />
                        <Text style={styles.emptyText}>No events found</Text>
                        <Text style={styles.emptySubtext}>Be the first to create one!</Text>
                    </View>
                ) : (
                    filteredEvents.map((event) => (
                        <Pressable
                            key={event.id}
                            style={({ pressed }) => [
                                styles.eventCard,
                                pressed && styles.eventCardPressed,
                            ]}
                        >
                            <View style={styles.cardLeft}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="leaf" size={24} color="#fff" />
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.eventTitle} numberOfLines={1}>
                                        {event.title}
                                    </Text>
                                    <View style={styles.distanceBadge}>
                                        <Ionicons name="location" size={12} color="#065f46" />
                                        <Text style={styles.distanceText}>Nearby</Text>
                                    </View>
                                </View>

                                <Text style={styles.eventDescription} numberOfLines={1}>
                                    {event.description || "Join this event!"}
                                </Text>

                                <View style={styles.cardMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="location-outline" size={14} color="#718096" />
                                        <Text style={styles.metaText}>{event.location}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color="#718096" />
                                        <Text style={styles.metaText}>{event.time}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="people" size={14} color="#718096" />
                                        <Text style={styles.metaText}>0/{event.max_attendees}</Text>
                                    </View>
                                </View>
                            </View>

                            <Pressable
                                style={styles.joinButton}
                                onPress={() => router.push(`/join-plan?title=${encodeURIComponent(event.title)}`)}
                            >
                                <Text style={styles.joinButtonText}>Join</Text>
                            </Pressable>
                        </Pressable>
                    ))
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
        backgroundColor: "#2f855a",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: "#d1fae5",
        marginBottom: 16,
    },
    filterContainer: {
        flexDirection: "row",
        gap: 12,
    },
    filterTab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#fff",
        gap: 6,
    },
    filterTabActive: {
        backgroundColor: "#065f46",
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2f855a",
    },
    filterTextActive: {
        color: "#fff",
    },
    mapPlaceholder: {
        height: 220,
        backgroundColor: "#e0f2fe",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },
    mapOverlay: {
        alignItems: "center",
        zIndex: 10,
    },
    mapText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#065f46",
        marginTop: 8,
    },
    pin: {
        position: "absolute",
    },
    eventsList: {
        flex: 1,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 16,
    },
    eventCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    eventCardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    cardLeft: {
        marginRight: 12,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1a202c",
        flex: 1,
        marginRight: 8,
    },
    distanceBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#d1fae5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    distanceText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#065f46",
    },
    eventDescription: {
        fontSize: 13,
        color: "#718096",
        marginBottom: 8,
    },
    cardMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: "#4a5568",
    },
    joinButton: {
        backgroundColor: "#2f855a",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginLeft: 8,
    },
    joinButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    bottomPadding: {
        height: 20,
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
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a202c",
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#718096",
        marginTop: 8,
    },
});
