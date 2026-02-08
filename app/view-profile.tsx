import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getGuestProfile, isGuestMode } from "../lib/guest-mode";
import { supabase } from "../lib/supabase";

// Labels for display
const INTEREST_LABELS: Record<string, string> = {
    parties: "🎉 House Parties",
    drinks: "🍻 Drinks & Nightouts",
    chill: "🌿 Chill & Smoke-Friendly",
    exploring: "🚶 Exploring Places",
    travel: "🧳 Travel",
    movies: "🎬 Movies / Cafes",
    gaming: "🎮 Gaming",
    talks: "🧠 Deep Talks",
    fitness: "🏋️ Fitness",
};

const VIBE_LABELS: Record<string, string> = {
    introvert: "Introvert but social",
    extrovert: "Extrovert & outgoing",
    calm: "Calm & chill",
    energy: "High energy",
    planner: "Planner",
    spontaneous: "Spontaneous",
};

const GROUP_LABELS: Record<string, string> = {
    duo: "1–2 people",
    small: "Small group (3–6)",
    medium: "Medium (7–15)",
    large: "Big parties (15+)",
};

const REPORT_REASONS = [
    { id: "harassment", label: "Harassment or bullying" },
    { id: "spam", label: "Spam or scam" },
    { id: "inappropriate", label: "Inappropriate behavior" },
    { id: "fake", label: "Fake profile" },
    { id: "other", label: "Other" },
];

interface ProfileData {
    id: string;
    full_name: string;
    age: number;
    city: string;
    gender?: string;
    interests: string[];
    vibe: string[];
    group_comfort: string;
    photos: string[];
}

type ChatRequestStatus = 'none' | 'pending' | 'accepted' | 'rejected';

export default function ViewProfileScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserGender, setCurrentUserGender] = useState<string | null>(null);

    // Chat request state
    const [chatRequestStatus, setChatRequestStatus] = useState<ChatRequestStatus>('none');
    const [sendingRequest, setSendingRequest] = useState(false);

    // Report modal state
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
    const [reportDetails, setReportDetails] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        // Get current user ID and gender
        const isGuest = await isGuestMode();
        if (isGuest) {
            const guestProfile = await getGuestProfile();
            setCurrentUserId(guestProfile?.id || null);
            setCurrentUserGender(guestProfile?.gender || null);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // Get current user's gender
            if (user?.id) {
                const { data: currentProfile } = await supabase
                    .from("profiles")
                    .select("gender")
                    .eq("id", user.id)
                    .single();
                setCurrentUserGender(currentProfile?.gender || null);
            }
        }

        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
            } else if (data) {
                setProfile({
                    id: data.id,
                    full_name: data.full_name || "User",
                    age: data.age || 0,
                    city: data.city || "",
                    gender: data.gender,
                    interests: data.interests || [],
                    vibe: data.vibe || [],
                    group_comfort: data.group_comfort || "",
                    photos: data.photos || [],
                });

                // Check for existing chat request if profile is female
                if (data.gender?.toLowerCase() === 'female' || data.gender?.toLowerCase() === 'woman') {
                    await checkChatRequestStatus(data.id);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkChatRequestStatus = async (targetUserId: string) => {
        if (!currentUserId) return;

        try {
            // Check if there's an existing request
            const { data: request } = await supabase
                .from("chat_requests")
                .select("status")
                .eq("sender_id", currentUserId)
                .eq("receiver_id", targetUserId)
                .single();

            if (request) {
                setChatRequestStatus(request.status as ChatRequestStatus);
            }

            // Also check if there's already an accepted chat
            const { data: existingChat } = await supabase
                .from("chats")
                .select("id")
                .or(`and(participant_1.eq.${currentUserId},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${currentUserId})`)
                .single();

            if (existingChat) {
                setChatRequestStatus('accepted');
            }
        } catch (error) {
            // No existing request
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const handleStartChat = () => {
        if (!profile) return;
        router.push(
            `/chat?recipientId=${profile.id}&name=${encodeURIComponent(profile.full_name)}`
        );
    };

    const handleSendChatRequest = async () => {
        if (!profile || !currentUserId) return;

        setSendingRequest(true);
        try {
            const { error } = await supabase
                .from("chat_requests")
                .insert({
                    sender_id: currentUserId,
                    receiver_id: profile.id,
                    status: 'pending',
                    message: `${profile.full_name} wants to chat with you!`
                });

            if (error) {
                if (error.code === '23505') {
                    Alert.alert("Already Sent", "You've already sent a chat request to this person.");
                } else {
                    throw error;
                }
            } else {
                setChatRequestStatus('pending');
                Alert.alert(
                    "Request Sent! 💬",
                    `Your chat request has been sent to ${profile.full_name}. They'll be notified and can accept or decline.`
                );
            }
        } catch (error) {
            console.error("Error sending chat request:", error);
            Alert.alert("Error", "Failed to send chat request. Please try again.");
        } finally {
            setSendingRequest(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!profile || !currentUserId || !selectedReportReason) return;

        setSubmittingReport(true);
        try {
            const { error } = await supabase
                .from("user_reports")
                .insert({
                    reporter_id: currentUserId,
                    reported_user_id: profile.id,
                    reason: selectedReportReason,
                    details: reportDetails.trim() || null,
                });

            if (error) throw error;

            setShowReportModal(false);
            setSelectedReportReason(null);
            setReportDetails("");

            Alert.alert(
                "Report Submitted",
                "Thank you for helping keep our community safe. We'll review your report."
            );
        } catch (error) {
            console.error("Error submitting report:", error);
            Alert.alert("Error", "Failed to submit report. Please try again.");
        } finally {
            setSubmittingReport(false);
        }
    };

    const isOwnProfile = currentUserId === userId;
    const isProfileFemale = profile?.gender?.toLowerCase() === 'female' || profile?.gender?.toLowerCase() === 'woman';
    const needsChatRequest = isProfileFemale && chatRequestStatus !== 'accepted';

    // Render chat button based on profile gender and request status
    const renderChatButton = () => {
        if (isOwnProfile || !currentUserId) return null;

        // If profile is female and needs chat request
        if (needsChatRequest) {
            if (chatRequestStatus === 'pending') {
                return (
                    <View style={styles.pendingButton}>
                        <Ionicons name="time-outline" size={18} color="#f59e0b" />
                        <Text style={styles.pendingText}>Request Pending</Text>
                    </View>
                );
            }

            if (chatRequestStatus === 'rejected') {
                return (
                    <View style={styles.rejectedButton}>
                        <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                        <Text style={styles.rejectedText}>Request Declined</Text>
                    </View>
                );
            }

            // No request yet - show request button
            return (
                <Pressable
                    style={styles.requestChatButton}
                    onPress={handleSendChatRequest}
                    disabled={sendingRequest}
                >
                    {sendingRequest ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                            <Text style={styles.startChatText}>Request to Chat</Text>
                        </>
                    )}
                </Pressable>
            );
        }

        // Normal chat button for non-female profiles or accepted requests
        return (
            <Pressable style={styles.startChatButton} onPress={handleStartChat}>
                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                <Text style={styles.startChatText}>Start Chat</Text>
            </Pressable>
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

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={styles.errorText}>Profile not found</Text>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Profile</Text>
                {/* Report button in header */}
                {!isOwnProfile && (
                    <Pressable
                        style={styles.reportBtn}
                        onPress={() => setShowReportModal(true)}
                    >
                        <Ionicons name="flag-outline" size={22} color="#fff" />
                    </Pressable>
                )}
                {isOwnProfile && <View style={{ width: 40 }} />}
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Photo & Name */}
                <View style={styles.profileHeader}>
                    {profile.photos && profile.photos.length > 0 ? (
                        <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{getInitials(profile.full_name)}</Text>
                        </View>
                    )}
                    <Text style={styles.name}>{profile.full_name}</Text>
                    <Text style={styles.info}>
                        📍 {profile.city} • {profile.age} years
                    </Text>
                    {profile.gender && <Text style={styles.gender}>{profile.gender}</Text>}

                    {/* Chat Button */}
                    {renderChatButton()}

                    {/* Female privacy notice */}
                    {isProfileFemale && !isOwnProfile && chatRequestStatus === 'none' && (
                        <Text style={styles.privacyNotice}>
                            🔒 This user has chat requests enabled for safety
                        </Text>
                    )}
                </View>

                {/* Vibe Section */}
                {profile.vibe && profile.vibe.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>✨ Vibe</Text>
                        <View style={styles.chipContainer}>
                            {profile.vibe.map((v) => (
                                <View key={v} style={styles.vibeChip}>
                                    <Text style={styles.vibeChipText}>{VIBE_LABELS[v] || v}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Interests Section */}
                {profile.interests && profile.interests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎯 Interests</Text>
                        <View style={styles.chipContainer}>
                            {profile.interests.map((interest) => (
                                <View key={interest} style={styles.interestChip}>
                                    <Text style={styles.interestChipText}>
                                        {INTEREST_LABELS[interest] || interest}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Group Comfort */}
                {profile.group_comfort && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>👥 Prefers</Text>
                        <View style={styles.prefCard}>
                            <Ionicons name="people" size={20} color="#2f855a" />
                            <Text style={styles.prefText}>
                                {GROUP_LABELS[profile.group_comfort] || profile.group_comfort}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Report Modal */}
            <Modal
                visible={showReportModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowReportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report User</Text>
                            <Pressable onPress={() => setShowReportModal(false)}>
                                <Ionicons name="close" size={24} color="#1a202c" />
                            </Pressable>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Why are you reporting {profile.full_name}?
                        </Text>

                        <View style={styles.reasonsList}>
                            {REPORT_REASONS.map((reason) => (
                                <Pressable
                                    key={reason.id}
                                    style={[
                                        styles.reasonItem,
                                        selectedReportReason === reason.id && styles.reasonItemSelected
                                    ]}
                                    onPress={() => setSelectedReportReason(reason.id)}
                                >
                                    <View style={[
                                        styles.reasonRadio,
                                        selectedReportReason === reason.id && styles.reasonRadioSelected
                                    ]}>
                                        {selectedReportReason === reason.id && (
                                            <View style={styles.reasonRadioInner} />
                                        )}
                                    </View>
                                    <Text style={styles.reasonText}>{reason.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <TextInput
                            style={styles.detailsInput}
                            placeholder="Additional details (optional)"
                            placeholderTextColor="#a0aec0"
                            value={reportDetails}
                            onChangeText={setReportDetails}
                            multiline
                            maxLength={500}
                        />

                        <Pressable
                            style={[
                                styles.submitReportButton,
                                !selectedReportReason && styles.submitReportButtonDisabled
                            ]}
                            onPress={handleSubmitReport}
                            disabled={!selectedReportReason || submittingReport}
                        >
                            {submittingReport ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitReportText}>Submit Report</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        fontSize: 18,
        color: "#ef4444",
        marginTop: 16,
    },
    backButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: "#2f855a",
        borderRadius: 8,
    },
    backButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#2f855a",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    reportBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
    },
    profileHeader: {
        alignItems: "center",
        paddingVertical: 24,
        backgroundColor: "#fff",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: "#2f855a",
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "#065f46",
    },
    avatarText: {
        fontSize: 40,
        fontWeight: "bold",
        color: "#fff",
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a202c",
        marginTop: 16,
    },
    info: {
        fontSize: 15,
        color: "#718096",
        marginTop: 4,
    },
    gender: {
        fontSize: 14,
        color: "#a0aec0",
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    vibeChip: {
        backgroundColor: "#f0fdf4",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#2f855a",
    },
    vibeChipText: {
        color: "#2f855a",
        fontWeight: "600",
        fontSize: 14,
    },
    interestChip: {
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    interestChipText: {
        color: "#4a5568",
        fontSize: 13,
    },
    prefCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    prefText: {
        fontSize: 16,
        color: "#2d3748",
        fontWeight: "500",
    },
    startChatButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2f855a",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 16,
        gap: 8,
        shadowColor: "#2f855a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startChatText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    requestChatButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#8b5cf6",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 16,
        gap: 8,
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    pendingButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: "#f59e0b",
    },
    pendingText: {
        color: "#d97706",
        fontSize: 16,
        fontWeight: "600",
    },
    rejectedButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fee2e2",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: "#ef4444",
    },
    rejectedText: {
        color: "#dc2626",
        fontSize: 16,
        fontWeight: "600",
    },
    privacyNotice: {
        fontSize: 12,
        color: "#718096",
        marginTop: 12,
        textAlign: "center",
        paddingHorizontal: 20,
    },
    // Report Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1a202c",
    },
    modalSubtitle: {
        fontSize: 15,
        color: "#718096",
        marginBottom: 20,
    },
    reasonsList: {
        marginBottom: 20,
    },
    reasonItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: "#f7fafc",
    },
    reasonItemSelected: {
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#2f855a",
    },
    reasonRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#cbd5e0",
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    reasonRadioSelected: {
        borderColor: "#2f855a",
    },
    reasonRadioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#2f855a",
    },
    reasonText: {
        fontSize: 15,
        color: "#1a202c",
    },
    detailsInput: {
        backgroundColor: "#f7fafc",
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: "#1a202c",
        height: 100,
        textAlignVertical: "top",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    submitReportButton: {
        backgroundColor: "#ef4444",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    submitReportButtonDisabled: {
        backgroundColor: "#fca5a5",
    },
    submitReportText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
