import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

interface ChatRequest {
    id: string;
    sender_id: string;
    status: string;
    message: string | null;
    created_at: string;
    sender_profile?: {
        id: string;
        full_name: string;
        photos: string[];
        city: string;
        age: number;
    };
}

export default function ChatRequestsScreen() {
    const [requests, setRequests] = useState<ChatRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [])
    );

    const loadRequests = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch pending requests for this user
            const { data: requestsData, error } = await supabase
                .from("chat_requests")
                .select("*")
                .eq("receiver_id", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching requests:", error);
                return;
            }

            if (requestsData && requestsData.length > 0) {
                // Fetch sender profiles
                const senderIds = requestsData.map(r => r.sender_id);
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, full_name, photos, city, age")
                    .in("id", senderIds);

                const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

                const enrichedRequests = requestsData.map(req => ({
                    ...req,
                    sender_profile: profileMap.get(req.sender_id)
                }));

                setRequests(enrichedRequests);
            } else {
                setRequests([]);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request: ChatRequest) => {
        if (!request.sender_profile) return;

        setProcessingId(request.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Update request status
            const { error: updateError } = await supabase
                .from("chat_requests")
                .update({ status: "accepted", updated_at: new Date().toISOString() })
                .eq("id", request.id);

            if (updateError) throw updateError;

            // Create chat between users
            const { data: existingChat } = await supabase
                .from("chats")
                .select("id")
                .or(`and(participant_1.eq.${user.id},participant_2.eq.${request.sender_id}),and(participant_1.eq.${request.sender_id},participant_2.eq.${user.id})`)
                .single();

            if (!existingChat) {
                const { error: chatError } = await supabase
                    .from("chats")
                    .insert({
                        participant_1: user.id,
                        participant_2: request.sender_id,
                    });

                if (chatError) throw chatError;
            }

            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== request.id));

            Alert.alert(
                "Request Accepted! 🎉",
                `You can now chat with ${request.sender_profile.full_name}`,
                [
                    { text: "Later", style: "cancel" },
                    {
                        text: "Chat Now",
                        onPress: () => router.push(
                            `/chat?recipientId=${request.sender_id}&name=${encodeURIComponent(request.sender_profile!.full_name)}`
                        )
                    }
                ]
            );
        } catch (error) {
            console.error("Error accepting request:", error);
            Alert.alert("Error", "Failed to accept request. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (request: ChatRequest) => {
        Alert.alert(
            "Decline Request",
            `Are you sure you want to decline the chat request from ${request.sender_profile?.full_name || "this user"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Decline",
                    style: "destructive",
                    onPress: async () => {
                        setProcessingId(request.id);
                        try {
                            const { error } = await supabase
                                .from("chat_requests")
                                .update({ status: "rejected", updated_at: new Date().toISOString() })
                                .eq("id", request.id);

                            if (error) throw error;

                            setRequests(prev => prev.filter(r => r.id !== request.id));
                        } catch (error) {
                            console.error("Error rejecting request:", error);
                            Alert.alert("Error", "Failed to decline request. Please try again.");
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderRequest = ({ item }: { item: ChatRequest }) => {
        const profile = item.sender_profile;
        const isProcessing = processingId === item.id;

        return (
            <View style={styles.requestCard}>
                <Pressable
                    style={styles.requestContent}
                    onPress={() => profile && router.push(`/view-profile?userId=${profile.id}`)}
                >
                    {profile?.photos && profile.photos.length > 0 ? (
                        <Image source={{ uri: profile.photos[0] }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {getInitials(profile?.full_name || "U")}
                            </Text>
                        </View>
                    )}

                    <View style={styles.info}>
                        <Text style={styles.name}>{profile?.full_name || "User"}</Text>
                        <Text style={styles.details}>
                            📍 {profile?.city || "Unknown"} • {profile?.age || "?"} years
                        </Text>
                        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                    </View>
                </Pressable>

                <View style={styles.actions}>
                    <Pressable
                        style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleAccept(item)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="checkmark" size={22} color="#fff" />
                        )}
                    </Pressable>

                    <Pressable
                        style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                        onPress={() => handleReject(item)}
                        disabled={isProcessing}
                    >
                        <Ionicons name="close" size={22} color="#ef4444" />
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Chat Requests</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2f855a" />
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e0" />
                    <Text style={styles.emptyTitle}>No Pending Requests</Text>
                    <Text style={styles.emptyText}>
                        When someone sends you a chat request, it will appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1a202c",
        marginTop: 16,
    },
    emptyText: {
        fontSize: 15,
        color: "#718096",
        textAlign: "center",
        marginTop: 8,
    },
    listContent: {
        padding: 16,
    },
    requestCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    requestContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#e2e8f0",
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#8b5cf6",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a202c",
    },
    details: {
        fontSize: 13,
        color: "#718096",
        marginTop: 2,
    },
    time: {
        fontSize: 12,
        color: "#a0aec0",
        marginTop: 2,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    acceptButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
    },
    rejectButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fee2e2",
        justifyContent: "center",
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
