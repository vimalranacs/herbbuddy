import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { supabase } from "../lib/supabase";

const { width } = Dimensions.get("window");

// Type for events with attendee count
interface Event {
    id: string;
    title: string;
    location: string;
    time: string;
    description: string;
    max_attendees: number;
    host_id: string;
    attendee_count: number;
    cover_image_url?: string;
}

interface NearbyUser {
    id: string;
    full_name: string;
    photos: string[];
    city: string;
    vibe: string[];
}

export default function DiscoverScreen() {
    const [filterDistance, setFilterDistance] = useState<"all" | "near">("all");
    const [events, setEvents] = useState<Event[]>([]);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getUser();
    }, []);

    // Fetch events from Supabase
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Fetch events
            const { data: eventsData, error: eventsError } = await supabase
                .from("events")
                .select("*")
                .order("created_at", { ascending: false });

            if (eventsError) {
                console.error("Error fetching events:", eventsError);
                return;
            }

            if (eventsData) {
                // Fetch attendee counts for each event
                const eventsWithCounts = await Promise.all(
                    eventsData.map(async (event: any) => {
                        const { count, error } = await supabase
                            .from("event_participants")
                            .select("*", { count: "exact", head: true })
                            .eq("event_id", event.id);

                        return {
                            ...event,
                            attendee_count: error ? 0 : (count || 0),
                        };
                    })
                );
                setEvents(eventsWithCounts);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEvents();
        fetchNearbyUsers();
    }, []);

    const fetchNearbyUsers = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, photos, city, vibe")
                .neq("id", user?.id || "")
                .limit(10);

            if (!error && data) {
                setNearbyUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleJoinEvent = (event: Event) => {
        // Check if user is the creator
        if (currentUserId === event.host_id) {
            Alert.alert("Cannot Join", "You can't join your own event!");
            return;
        }

        // Check if event is full
        if (event.attendee_count >= event.max_attendees) {
            Alert.alert("Event Full", "This event has reached maximum capacity.");
            return;
        }

        // Navigate to join screen
        router.push(`/join-plan?eventId=${event.id}&title=${encodeURIComponent(event.title)}`);
    };

    // Filter events
    const filteredEvents =
        filterDistance === "near"
            ? events.slice(0, 3)
            : events;

    const getSpotsText = (event: Event) => {
        const remaining = event.max_attendees - event.attendee_count;
        if (remaining <= 0) return "Full";
        return `${event.attendee_count}/${event.max_attendees}`;
    };

    const isEventFull = (event: Event) => {
        return event.attendee_count >= event.max_attendees;
    };

    const isUserHost = (event: Event) => {
        return currentUserId === event.host_id;
    };

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

            {/* Trending Events Carousel */}
            {events.length > 0 && (
                <View style={styles.trendingSection}>
                    <Text style={styles.trendingSectionTitle}>🔥 Trending Events</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.trendingScroll}
                    >
                        {events.slice(0, 5).map((event) => (
                            <Pressable
                                key={event.id}
                                style={styles.trendingCard}
                                onPress={() => handleJoinEvent(event)}
                            >
                                <View style={styles.trendingImageContainer}>
                                    {event.cover_image_url ? (
                                        <Image source={{ uri: event.cover_image_url }} style={styles.trendingImage} />
                                    ) : (
                                        <View style={styles.trendingImagePlaceholder}>
                                            <Ionicons name="leaf" size={32} color="#2f855a" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.trendingTitle} numberOfLines={1}>{event.title}</Text>
                                <Text style={styles.trendingLocation} numberOfLines={1}>📍 {event.location}</Text>
                                <View style={styles.trendingBadge}>
                                    <Text style={styles.trendingBadgeText}>{event.attendee_count} joined</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* People Looking for Buddies */}
            {nearbyUsers.length > 0 && (
                <View style={styles.buddiesSection}>
                    <Text style={styles.buddiesSectionTitle}>👋 People Looking for Buddies</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.buddiesScroll}
                    >
                        {nearbyUsers.map((user) => (
                            <Pressable
                                key={user.id}
                                style={styles.buddyCard}
                                onPress={() => router.push(`/view-profile?userId=${user.id}`)}
                            >
                                {user.photos && user.photos.length > 0 ? (
                                    <Image source={{ uri: user.photos[0] }} style={styles.buddyAvatar} />
                                ) : (
                                    <View style={styles.buddyAvatarPlaceholder}>
                                        <Text style={styles.buddyAvatarText}>
                                            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.buddyName} numberOfLines={1}>{user.full_name}</Text>
                                <Text style={styles.buddyCity} numberOfLines={1}>📍 {user.city || "Nearby"}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Events List */}
            <ScrollView
                style={styles.eventsList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2f855a"]} />
                }
            >
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
                            onPress={() => handleJoinEvent(event)}
                        >
                            <View style={styles.cardLeft}>
                                <View style={[
                                    styles.iconCircle,
                                    isUserHost(event) && styles.iconCircleHost,
                                    isEventFull(event) && styles.iconCircleFull,
                                ]}>
                                    <Ionicons
                                        name={isUserHost(event) ? "star" : "leaf"}
                                        size={24}
                                        color="#fff"
                                    />
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.eventTitle} numberOfLines={1}>
                                        {event.title}
                                    </Text>
                                    {isUserHost(event) && (
                                        <View style={styles.hostBadge}>
                                            <Text style={styles.hostBadgeText}>Your Event</Text>
                                        </View>
                                    )}
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
                                    <View style={[
                                        styles.spotsBadge,
                                        isEventFull(event) && styles.spotsBadgeFull,
                                    ]}>
                                        <Ionicons
                                            name="people"
                                            size={14}
                                            color={isEventFull(event) ? "#dc2626" : "#2f855a"}
                                        />
                                        <Text style={[
                                            styles.spotsText,
                                            isEventFull(event) && styles.spotsTextFull,
                                        ]}>
                                            {getSpotsText(event)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Join/View Button */}
                            <Pressable
                                style={[
                                    styles.joinButton,
                                    isUserHost(event) && styles.viewButton,
                                    isEventFull(event) && !isUserHost(event) && styles.fullButton,
                                ]}
                                onPress={() => handleJoinEvent(event)}
                            >
                                <Text style={[
                                    styles.joinButtonText,
                                    isEventFull(event) && !isUserHost(event) && styles.fullButtonText,
                                ]}>
                                    {isUserHost(event) ? "View" : isEventFull(event) ? "Full" : "Join"}
                                </Text>
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
        height: 180,
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
    iconCircleHost: {
        backgroundColor: "#0891b2",
    },
    iconCircleFull: {
        backgroundColor: "#9ca3af",
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
    hostBadge: {
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    hostBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#0891b2",
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
        alignItems: "center",
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
    spotsBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#d1fae5",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    spotsBadgeFull: {
        backgroundColor: "#fee2e2",
    },
    spotsText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2f855a",
    },
    spotsTextFull: {
        color: "#dc2626",
    },
    joinButton: {
        backgroundColor: "#2f855a",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginLeft: 8,
    },
    viewButton: {
        backgroundColor: "#0891b2",
    },
    fullButton: {
        backgroundColor: "#e5e7eb",
    },
    joinButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    fullButtonText: {
        color: "#6b7280",
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
    // Trending Events Section
    trendingSection: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    trendingSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a202c",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    trendingScroll: {
        paddingHorizontal: 12,
    },
    trendingCard: {
        width: 160,
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 4,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    trendingImageContainer: {
        height: 80,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 8,
    },
    trendingImage: {
        width: "100%",
        height: "100%",
    },
    trendingImagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#e6fffa",
        justifyContent: "center",
        alignItems: "center",
    },
    trendingTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1a202c",
    },
    trendingLocation: {
        fontSize: 12,
        color: "#718096",
        marginTop: 2,
    },
    trendingBadge: {
        marginTop: 6,
        backgroundColor: "#d1fae5",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: "flex-start",
    },
    trendingBadgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#2f855a",
    },
    // Buddies Section
    buddiesSection: {
        paddingTop: 8,
        paddingBottom: 8,
    },
    buddiesSectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a202c",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    buddiesScroll: {
        paddingHorizontal: 12,
    },
    buddyCard: {
        width: 100,
        alignItems: "center",
        marginHorizontal: 4,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    buddyAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    buddyAvatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#8b5cf6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    buddyAvatarText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },
    buddyName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1a202c",
        textAlign: "center",
    },
    buddyCity: {
        fontSize: 11,
        color: "#718096",
        marginTop: 2,
    },
});
