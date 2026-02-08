import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getGuestProfile, isGuestMode } from "../lib/guest-mode";
import { supabase } from "../lib/supabase";

interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    time: string;
    max_attendees: number;
    host_id: string;
}

interface Profile {
    id: string;
    full_name: string;
}

export default function JoinPlanScreen() {
    const params = useLocalSearchParams<{ eventId?: string; title?: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [hostProfile, setHostProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [attendeeCount, setAttendeeCount] = useState(0);
    const [hasJoined, setHasJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [participants, setParticipants] = useState<Profile[]>([]);

    useEffect(() => {
        loadEventData();
    }, [params.eventId]);

    const loadEventData = async () => {
        console.log("📦 Loading event with ID:", params.eventId);

        if (!params.eventId) {
            console.log("❌ No eventId provided");
            setLoading(false);
            return;
        }

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

            // Fetch event by ID
            const { data: eventData, error } = await supabase
                .from("events")
                .select("*")
                .eq("id", params.eventId)
                .single();

            if (error) {
                console.error("❌ Error fetching event:", error);
                Alert.alert("Error", "Event not found");
                router.back();
                return;
            }

            setEvent(eventData);
            setIsHost(eventData.host_id === userId);

            // Fetch attendee count
            const { count } = await supabase
                .from("event_participants")
                .select("*", { count: "exact", head: true })
                .eq("event_id", eventData.id);

            setAttendeeCount(count || 0);

            // Check if current user has already joined
            if (userId) {
                const { data: participation } = await supabase
                    .from("event_participants")
                    .select("id")
                    .eq("event_id", eventData.id)
                    .eq("user_id", userId)
                    .single();

                setHasJoined(!!participation);
            }

            // Fetch host profile
            if (eventData?.host_id) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .eq("id", eventData.host_id)
                    .single();

                if (profileData) {
                    setHostProfile(profileData);
                }
            }

            // Fetch participants with their profiles
            const { data: participantData, error: participantsError } = await supabase
                .from("event_participants")
                .select("user_id")
                .eq("event_id", eventData.id);

            if (!participantsError && participantData && participantData.length > 0) {
                const participantIds = participantData.map((p) => p.user_id);
                const { data: participantProfiles } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", participantIds);

                if (participantProfiles) {
                    setParticipants(participantProfiles);
                }
            } else {
                setParticipants([]);
            }
        } catch (error) {
            console.error("Error loading event:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!event || !currentUserId) {
            Alert.alert("Error", "Please log in to join events");
            return;
        }

        if (isHost) {
            Alert.alert("Notice", "You can't join your own event!");
            return;
        }

        if (hasJoined) {
            Alert.alert("Already Joined", "You've already joined this event!");
            return;
        }

        if (attendeeCount >= event.max_attendees) {
            Alert.alert("Event Full", "This event has reached maximum capacity.");
            return;
        }

        setJoining(true);
        try {
            const { error } = await supabase
                .from("event_participants")
                .insert({
                    event_id: event.id,
                    user_id: currentUserId,
                });

            if (error) {
                console.error("Join error:", error);
                if (error.code === "23505") {
                    Alert.alert("Already Joined", "You've already joined this event!");
                } else {
                    Alert.alert("Error", "Failed to join event. Please try again.");
                }
                return;
            }

            Alert.alert(
                "Joined! 🎉",
                "You've successfully joined this event. Chat with the host for updates!",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Error joining:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!event || !currentUserId) return;

        Alert.alert(
            "Leave Event",
            "Are you sure you want to leave this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from("event_participants")
                                .delete()
                                .eq("event_id", event.id)
                                .eq("user_id", currentUserId);

                            if (error) {
                                Alert.alert("Error", "Failed to leave event");
                                return;
                            }

                            Alert.alert("Left Event", "You've left this event.");
                            router.back();
                        } catch (error) {
                            console.error("Error leaving:", error);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteEvent = async () => {
        if (!event || !isHost) return;

        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const { error } = await supabase
                                .from("events")
                                .delete()
                                .eq("id", event.id);

                            if (error) {
                                Alert.alert("Error", "Failed to delete event");
                                return;
                            }

                            Alert.alert("Deleted", "Event has been deleted.");
                            router.back();
                        } catch (error) {
                            console.error("Error deleting:", error);
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleChatWithHost = () => {
        if (!event?.host_id || !currentUserId) {
            Alert.alert("Error", "Unable to start chat");
            return;
        }

        if (isHost) {
            Alert.alert("Notice", "This is your own event!");
            return;
        }

        router.push(
            `/chat?recipientId=${event.host_id}&name=${encodeURIComponent(
                hostProfile?.full_name || "Host"
            )}&eventId=${event.id}`
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2f855a" />
                </View>
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={styles.errorText}>Event not found</Text>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const spotsRemaining = event.max_attendees - attendeeCount;
    const isFull = spotsRemaining <= 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Plan Icon */}
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, isHost && styles.iconCircleHost]}>
                        <Ionicons name={isHost ? "star" : "leaf"} size={40} color="#fff" />
                    </View>
                    {isHost && (
                        <View style={styles.yourEventBadge}>
                            <Text style={styles.yourEventText}>Your Event</Text>
                        </View>
                    )}
                </View>

                {/* Plan Details */}
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.description}>
                    {event.description || "Join this event!"}
                </Text>

                {/* Spots Badge */}
                <View style={[styles.spotsBadge, isFull && styles.spotsBadgeFull]}>
                    <Ionicons
                        name="people"
                        size={20}
                        color={isFull ? "#dc2626" : "#2f855a"}
                    />
                    <Text style={[styles.spotsText, isFull && styles.spotsTextFull]}>
                        {isFull
                            ? "Event Full"
                            : `${attendeeCount}/${event.max_attendees} spots filled • ${spotsRemaining} remaining`}
                    </Text>
                </View>

                {/* Host Info */}
                {hostProfile && !isHost && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Host</Text>
                        <Pressable
                            style={styles.hostCard}
                            onPress={() => router.push(`/view-profile?userId=${hostProfile.id}`)}
                        >
                            <View style={styles.hostAvatar}>
                                <Text style={styles.hostAvatarText}>
                                    {hostProfile.full_name?.[0] || "H"}
                                </Text>
                            </View>
                            <View style={styles.hostInfo}>
                                <Text style={styles.hostName}>
                                    {hostProfile.full_name || "Host"}
                                </Text>
                                <View style={styles.ratingContainer}>
                                    <Ionicons name="eye-outline" size={14} color="#718096" />
                                    <Text style={styles.rating}>Tap to view profile</Text>
                                </View>
                            </View>
                            {/* Only show chat button after joining */}
                            {hasJoined && (
                                <Pressable
                                    style={styles.chatHostButton}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleChatWithHost();
                                    }}
                                >
                                    <Ionicons name="chatbubble-outline" size={18} color="#2f855a" />
                                    <Text style={styles.chatHostText}>Chat</Text>
                                </Pressable>
                            )}
                        </Pressable>
                    </View>
                )}

                {/* Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>

                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={20} color="#2f855a" />
                        <Text style={styles.detailText}>{event.location}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={20} color="#2f855a" />
                        <Text style={styles.detailText}>{event.time}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="people" size={20} color="#2f855a" />
                        <Text style={styles.detailText}>
                            {attendeeCount}/{event.max_attendees} spots filled
                        </Text>
                    </View>
                </View>

                {/* Participants Section - show when there are participants and user is host or has joined */}
                {participants.length > 0 && (isHost || hasJoined) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Participants ({participants.length})
                        </Text>
                        {participants.map((participant) => (
                            <Pressable
                                key={participant.id}
                                style={styles.participantCard}
                                onPress={() => router.push(`/view-profile?userId=${participant.id}`)}
                            >
                                <View style={styles.participantAvatar}>
                                    <Text style={styles.participantAvatarText}>
                                        {participant.full_name?.[0] || "?"}
                                    </Text>
                                </View>
                                <View style={styles.participantInfo}>
                                    <Text style={styles.participantName}>
                                        {participant.full_name || "Unknown User"}
                                        {participant.id === currentUserId && " (You)"}
                                    </Text>
                                    <View style={styles.participantHint}>
                                        <Ionicons name="eye-outline" size={12} color="#718096" />
                                        <Text style={styles.participantHintText}>Tap to view profile</Text>
                                    </View>
                                </View>
                                {/* Chat button - don't show for yourself */}
                                {participant.id !== currentUserId && (
                                    <Pressable
                                        style={styles.participantChatBtn}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            router.push(
                                                `/chat?recipientId=${participant.id}&name=${encodeURIComponent(
                                                    participant.full_name || "User"
                                                )}&eventId=${event.id}`
                                            );
                                        }}
                                    >
                                        <Ionicons name="chatbubble-outline" size={16} color="#2f855a" />
                                    </Pressable>
                                )}
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* Info Note */}
                {!isHost && !hasJoined && (
                    <View style={styles.infoNote}>
                        <Ionicons name="information-circle" size={20} color="#2f855a" />
                        <Text style={styles.infoNoteText}>
                            Join the event to unlock chat with the host!
                        </Text>
                    </View>
                )}

                {/* Already Joined Note */}
                {hasJoined && (
                    <View style={styles.joinedNote}>
                        <Ionicons name="checkmark-circle" size={20} color="#2f855a" />
                        <Text style={styles.joinedNoteText}>
                            You've joined this event!
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.footer}>
                {isHost ? (
                    <>
                        <Pressable
                            style={({ pressed }) => [
                                styles.deleteButton,
                                pressed && styles.buttonPressed,
                                deleting && styles.buttonDisabled,
                            ]}
                            onPress={handleDeleteEvent}
                            disabled={deleting}
                        >
                            <Ionicons name="trash" size={20} color="#fff" />
                            <Text style={styles.deleteButtonText}>
                                {deleting ? "Deleting..." : "Delete Event"}
                            </Text>
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>Back</Text>
                        </Pressable>
                    </>
                ) : hasJoined ? (
                    <>
                        <Pressable
                            style={({ pressed }) => [
                                styles.leaveButton,
                                pressed && styles.buttonPressed,
                            ]}
                            onPress={handleLeave}
                        >
                            <Ionicons name="exit-outline" size={20} color="#fff" />
                            <Text style={styles.leaveButtonText}>Leave Event</Text>
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>Back</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Pressable
                            style={({ pressed }) => [
                                styles.joinButton,
                                pressed && styles.buttonPressed,
                                (joining || isFull) && styles.buttonDisabled,
                            ]}
                            onPress={handleJoin}
                            disabled={joining || isFull}
                        >
                            <Ionicons
                                name={isFull ? "close-circle" : "checkmark-circle"}
                                size={24}
                                color="#fff"
                            />
                            <Text style={styles.joinButtonText}>
                                {joining
                                    ? "Joining..."
                                    : isFull
                                        ? "Event Full"
                                        : "Join This Plan"}
                            </Text>
                        </Pressable>
                        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    content: {
        padding: 24,
        paddingBottom: 200,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        fontSize: 18,
        color: "#4a5568",
        marginTop: 16,
    },
    backButton: {
        marginTop: 24,
        backgroundColor: "#2f855a",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
    },
    iconCircleHost: {
        backgroundColor: "#0891b2",
    },
    yourEventBadge: {
        marginTop: 12,
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    yourEventText: {
        color: "#0891b2",
        fontWeight: "600",
        fontSize: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 16,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#4a5568",
        lineHeight: 24,
        marginBottom: 24,
        textAlign: "center",
    },
    spotsBadge: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#d1fae5",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 24,
        gap: 8,
    },
    spotsBadgeFull: {
        backgroundColor: "#fee2e2",
    },
    spotsText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#2f855a",
    },
    spotsTextFull: {
        color: "#dc2626",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 12,
    },
    hostCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    hostAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    hostAvatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    hostInfo: {
        flex: 1,
    },
    hostName: {
        fontSize: 17,
        fontWeight: "600",
        color: "#2d3748",
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    rating: {
        fontSize: 14,
        fontWeight: "600",
        color: "#718096",
    },
    chatHostButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#2f855a",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    chatHostText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2f855a",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    detailText: {
        fontSize: 15,
        color: "#2d3748",
        flex: 1,
    },
    infoNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 14,
        color: "#2f855a",
        lineHeight: 20,
    },
    joinedNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#d1fae5",
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    joinedNoteText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#2f855a",
    },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 20,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    joinButton: {
        backgroundColor: "#2f855a",
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "#2f855a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonDisabled: {
        backgroundColor: "#9ca3af",
        opacity: 0.7,
    },
    joinButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    leaveButton: {
        backgroundColor: "#f59e0b",
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    leaveButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    deleteButton: {
        backgroundColor: "#dc2626",
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    deleteButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#718096",
    },
    participantCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    participantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#d1fae5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    participantAvatarText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2f855a",
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#2d3748",
    },
    participantHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    participantHintText: {
        fontSize: 12,
        color: "#718096",
    },
    participantChatBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2f855a",
    },
});
