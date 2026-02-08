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
    status?: string;
    event_end_date?: string;
    attendee_count?: number;
}

type TabType = "upcoming" | "history";

export default function MyEventsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("upcoming");
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [historyEvents, setHistoryEvents] = useState<Event[]>([]);
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

            // Fetch ALL relevant events (Hosted + Joined)
            // 1. Hosted
            const { data: hosted, error: hostedError } = await supabase
                .from("events")
                .select("*")
                .eq("host_id", userId)
                .order("event_date", { ascending: true }); // Upcoming soonest first

            // 2. Joined
            const { data: participations } = await supabase
                .from("event_participants")
                .select("event_id")
                .eq("user_id", userId);

            let joined: any[] = [];
            if (participations && participations.length > 0) {
                const eventIds = participations.map((p) => p.event_id);
                const { data: joinedData } = await supabase
                    .from("events")
                    .select("*")
                    .in("id", eventIds)
                    .neq("host_id", userId) // Exclude if host (redundant safety)
                    .order("event_date", { ascending: true });
                joined = joinedData || [];
            }

            const allEvents = [...(hosted || []), ...joined];

            // 3. Process Counts & Status
            const eventsWithCounts = await Promise.all(
                allEvents.map(async (event) => {
                    const { count } = await supabase
                        .from("event_participants")
                        .select("*", { count: "exact", head: true })
                        .eq("event_id", event.id);
                    return { ...event, attendee_count: count || 0 };
                })
            );

            // 4. Split and Auto-Complete
            const now = new Date();
            const upcoming: Event[] = [];
            const history: Event[] = [];
            const expiredIds: string[] = [];

            eventsWithCounts.forEach(e => {
                const endDate = e.event_end_date ? new Date(e.event_end_date) : null;
                const isExpired = endDate ? endDate < now : false;
                const isCompleted = e.status === 'completed' || isExpired;

                if (isCompleted) {
                    history.push({ ...e, status: 'completed' }); // Treat as completed for UI
                    if (e.status !== 'completed' && endDate) {
                        expiredIds.push(e.id);
                    }
                } else {
                    upcoming.push(e);
                }
            });

            // Sort logic: Upcoming (sooner first), History (recent first)
            upcoming.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()); // Approximate string sort? No, use event_date if available.
            // Better: use event_date if available, else fallback
            const getDate = (e: any) => e.event_date ? new Date(e.event_date).getTime() : 0;
            upcoming.sort((a, b) => getDate(a) - getDate(b));
            history.sort((a, b) => getDate(b) - getDate(a));

            setUpcomingEvents(upcoming);
            setHistoryEvents(history);

            // 5. Fire Auto-Complete Update
            if (expiredIds.length > 0) {
                console.log("Auto-completing events:", expiredIds);
                await supabase.from("events").update({ status: 'completed' }).in('id', expiredIds);
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

    const displayedEvents = activeTab === "upcoming" ? upcomingEvents : historyEvents;

    const renderEventCard = (event: Event) => {
        const isHost = event.host_id === currentUserId;
        return (
            <Pressable
                key={event.id}
                style={styles.eventCard}
                onPress={() =>
                    router.push(
                        `/join-plan?eventId=${event.id}&title=${encodeURIComponent(event.title)}`
                    )
                }
            >
                <View style={[styles.eventBadge, isHost ? styles.createdBadge : styles.joinedBadge]}>
                    <Ionicons
                        name={isHost ? "star" : "leaf"}
                        size={22}
                        color={isHost ? "#0891b2" : "#2f855a"}
                    />
                </View>

                <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                            {event.title}
                        </Text>
                        <View style={[styles.typeBadge, isHost ? styles.createdTypeBadge : styles.joinedTypeBadge]}>
                            <Text style={[styles.typeBadgeText, isHost ? styles.createdTypeBadgeText : styles.joinedTypeBadgeText]}>
                                {isHost ? "Host" : "Joined"}
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
                                {event.attendee_count || 0}/{event.max_attendees} joined • {event.status === 'completed' ? 'Ended' : 'Upcoming'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#a0aec0" />
                    </View>
                </View>
            </Pressable>
        );
    };

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
                        <Ionicons name="calendar-outline" size={20} color="#0891b2" />
                    </View>
                    <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
                    <Text style={styles.statLabel}>Upcoming</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: "#f3f4f6" }]}>
                        <Ionicons name="time-outline" size={20} color="#4b5563" />
                    </View>
                    <Text style={styles.statNumber}>{historyEvents.length}</Text>
                    <Text style={styles.statLabel}>Past</Text>
                </View>
            </View>

            {/* Tab Filter */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
                    onPress={() => setActiveTab("upcoming")}
                >
                    <Ionicons
                        name="calendar"
                        size={18}
                        color={activeTab === "upcoming" ? "#0891b2" : "#718096"}
                    />
                    <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>
                        Upcoming ({upcomingEvents.length})
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === "history" && styles.activeTab]}
                    onPress={() => setActiveTab("history")}
                >
                    <Ionicons
                        name="time"
                        size={18}
                        color={activeTab === "history" ? "#4b5563" : "#718096"}
                    />
                    <Text style={[styles.tabText, activeTab === "history" && styles.activeTabTextJoined]}>
                        History ({historyEvents.length})
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
                            name={activeTab === "upcoming" ? "calendar-outline" : "time-outline"}
                            size={64}
                            color="#cbd5e0"
                        />
                        <Text style={styles.emptyTitle}>
                            {activeTab === "upcoming"
                                ? "No upcoming events"
                                : "No past events"}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === "upcoming"
                                ? "Join an event or create your own!"
                                : "Events you complete will appear here."}
                        </Text>
                        <Pressable
                            style={styles.emptyButton}
                            onPress={() =>
                                router.push(activeTab === "upcoming" ? "/(tabs)/explore" : "/add-event")
                            }
                        >
                            <Text style={styles.emptyButtonText}>
                                {activeTab === "upcoming" ? "Explore Events" : "Create Event"}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    displayedEvents.map((event) =>
                        renderEventCard(event)
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
