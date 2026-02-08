import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getGuestProfile, isGuestMode } from "../../lib/guest-mode";
import { supabase } from "../../lib/supabase";

interface Event {
    id: string;
    title: string;
    location: string;
    time: string;
    description: string;
    max_attendees: number;
    host_id: string;
    attendee_count?: number;
}

type TabType = "created" | "joined";

export default function MyEventsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("created");
    const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
    const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [])
    );

    const loadEvents = async () => {
        try {
            // Get current user
            const isGuest = await isGuestMode();
            let userId: string | null = null;

            if (isGuest) {
                const guestProfile = await getGuestProfile();
                userId = guestProfile?.id || null;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id || null;
            }
            setCurrentUserId(userId);

            if (!userId) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Fetch events created by user
            const { data: myCreatedEvents, error: createdError } = await supabase
                .from("events")
                .select("*")
                .eq("host_id", userId)
                .order("created_at", { ascending: false });

            if (createdError) {
                console.error("Error fetching created events:", createdError);
            } else {
                // Get attendee counts for created events
                const eventsWithCounts = await Promise.all(
                    (myCreatedEvents || []).map(async (event) => {
                        const { count } = await supabase
                            .from("event_participants")
                            .select("*", { count: "exact", head: true })
                            .eq("event_id", event.id);
                        return { ...event, attendee_count: count || 0 };
                    })
                );
                setCreatedEvents(eventsWithCounts);
            }

            // Fetch events joined by user (where user is participant but not host)
            const { data: participations, error: joinedError } = await supabase
                .from("event_participants")
                .select("event_id")
                .eq("user_id", userId);

            if (joinedError) {
                console.error("Error fetching joined events:", joinedError);
            } else if (participations && participations.length > 0) {
                const eventIds = participations.map((p) => p.event_id);
                const { data: myJoinedEvents, error: eventsError } = await supabase
                    .from("events")
                    .select("*")
                    .in("id", eventIds)
                    .neq("host_id", userId)
                    .order("created_at", { ascending: false });

                if (eventsError) {
                    console.error("Error fetching joined event details:", eventsError);
                } else {
                    // Get attendee counts for joined events
                    const eventsWithCounts = await Promise.all(
                        (myJoinedEvents || []).map(async (event) => {
                            const { count } = await supabase
                                .from("event_participants")
                                .select("*", { count: "exact", head: true })
                                .eq("event_id", event.id);
                            return { ...event, attendee_count: count || 0 };
                        })
                    );
                    setJoinedEvents(eventsWithCounts);
                }
            } else {
                setJoinedEvents([]);
            }
        } catch (error) {
            console.error("Error loading events:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadEvents();
    };

    const displayedEvents = activeTab === "created" ? createdEvents : joinedEvents;

    const renderEventCard = (event: Event, isCreated: boolean) => (
        <Pressable
            key={event.id}
            style={styles.eventCard}
            onPress={() =>
                router.push(
                    `/join-plan?eventId=${event.id}&title=${encodeURIComponent(event.title)}`
                )
            }
        >
            <View style={[styles.eventBadge, isCreated ? styles.createdBadge : styles.joinedBadge]}>
                <Ionicons
                    name={isCreated ? "star" : "leaf"}
                    size={22}
                    color={isCreated ? "#0891b2" : "#2f855a"}
                />
            </View>

            <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                    </Text>
                    <View style={[styles.typeBadge, isCreated ? styles.createdTypeBadge : styles.joinedTypeBadge]}>
                        <Text style={[styles.typeBadgeText, isCreated ? styles.createdTypeBadgeText : styles.joinedTypeBadgeText]}>
                            {isCreated ? "Host" : "Joined"}
                        </Text>
                    </View>
                </View>

                <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={14} color="#718096" />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                            {event.location}
                        </Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                        <Ionicons name="time-outline" size={14} color="#718096" />
                        <Text style={styles.eventDetailText}>{event.time}</Text>
                    </View>
                </View>

                <View style={styles.eventFooter}>
                    <View style={styles.attendeesInfo}>
                        <Ionicons name="people" size={14} color="#718096" />
                        <Text style={styles.attendeesText}>
                            {event.attendee_count || 0}/{event.max_attendees} joined
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#a0aec0" />
                </View>
            </View>
        </Pressable>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Events</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2f855a" />
                    <Text style={styles.loadingText}>Loading your events...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Events</Text>
                <Pressable
                    style={styles.addButton}
                    onPress={() => router.push("/add-event")}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </Pressable>
            </View>

            {/* Stats Summary */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#e0f2fe" }]}>
                        <Ionicons name="star" size={20} color="#0891b2" />
                    </View>
                    <Text style={styles.statNumber}>{createdEvents.length}</Text>
                    <Text style={styles.statLabel}>Created</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#d1fae5" }]}>
                        <Ionicons name="leaf" size={20} color="#2f855a" />
                    </View>
                    <Text style={styles.statNumber}>{joinedEvents.length}</Text>
                    <Text style={styles.statLabel}>Joined</Text>
                </View>
            </View>

            {/* Tab Filter */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === "created" && styles.activeTab]}
                    onPress={() => setActiveTab("created")}
                >
                    <Ionicons
                        name="star"
                        size={18}
                        color={activeTab === "created" ? "#0891b2" : "#718096"}
                    />
                    <Text style={[styles.tabText, activeTab === "created" && styles.activeTabText]}>
                        Created ({createdEvents.length})
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === "joined" && styles.activeTab]}
                    onPress={() => setActiveTab("joined")}
                >
                    <Ionicons
                        name="leaf"
                        size={18}
                        color={activeTab === "joined" ? "#2f855a" : "#718096"}
                    />
                    <Text style={[styles.tabText, activeTab === "joined" && styles.activeTabTextJoined]}>
                        Joined ({joinedEvents.length})
                    </Text>
                </Pressable>
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
                {displayedEvents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name={activeTab === "created" ? "star-outline" : "leaf-outline"}
                            size={64}
                            color="#cbd5e0"
                        />
                        <Text style={styles.emptyTitle}>
                            {activeTab === "created"
                                ? "No events created yet"
                                : "No events joined yet"}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === "created"
                                ? "Create your first event and invite others!"
                                : "Explore and join events near you!"}
                        </Text>
                        <Pressable
                            style={styles.emptyButton}
                            onPress={() =>
                                router.push(activeTab === "created" ? "/add-event" : "/(tabs)/explore")
                            }
                        >
                            <Text style={styles.emptyButtonText}>
                                {activeTab === "created" ? "Create Event" : "Explore Events"}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    displayedEvents.map((event) =>
                        renderEventCard(event, activeTab === "created")
                    )
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
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
    },
    statsContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#fff",
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#f7fafc",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
    },
    statLabel: {
        fontSize: 14,
        color: "#718096",
        marginTop: 2,
    },
    tabContainer: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    activeTab: {
        backgroundColor: "#f0fdf4",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#718096",
    },
    activeTabText: {
        color: "#0891b2",
    },
    activeTabTextJoined: {
        color: "#2f855a",
    },
    eventsContainer: {
        flex: 1,
        marginTop: 16,
    },
    eventsContent: {
        paddingHorizontal: 20,
    },
    eventCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    eventBadge: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    createdBadge: {
        backgroundColor: "#e0f2fe",
    },
    joinedBadge: {
        backgroundColor: "#d1fae5",
    },
    eventContent: {
        flex: 1,
    },
    eventHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a202c",
        flex: 1,
        marginRight: 8,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    createdTypeBadge: {
        backgroundColor: "#e0f2fe",
    },
    joinedTypeBadge: {
        backgroundColor: "#d1fae5",
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    createdTypeBadgeText: {
        color: "#0891b2",
    },
    joinedTypeBadgeText: {
        color: "#2f855a",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a202c",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#718096",
        textAlign: "center",
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: "#2f855a",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#fff",
    },
    bottomPadding: {
        height: 100,
    },
});
