import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SkeletonChatList } from "../../components/SkeletonLoader";
import { getGuestProfile, isGuestMode } from "../../lib/guest-mode";
import { supabase } from "../../lib/supabase";

interface Chat {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message: string | null;
    last_message_at: string | null;
    last_message_sender: string | null;
    event_id: string | null;
    other_user_name?: string;
    other_user_id?: string;
    other_user_photo?: string;
    unread_count?: number;
}

// Animated chat item component
const AnimatedChatItem = ({
    chat,
    index,
    onPress,
    formatTime,
    getInitials,
    isInitialLoad
}: {
    chat: Chat;
    index: number;
    onPress: () => void;
    formatTime: (timestamp: string | null) => string;
    getInitials: (name: string) => string;
    isInitialLoad: boolean;
}) => {
    const fadeAnim = useRef(new Animated.Value(isInitialLoad ? 0 : 1)).current;
    const slideAnim = useRef(new Animated.Value(isInitialLoad ? 30 : 0)).current;

    useEffect(() => {
        if (!isInitialLoad) return;

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 80,
                friction: 12,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isInitialLoad]);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <Pressable
                style={({ pressed }) => [
                    styles.chatCard,
                    pressed && styles.chatCardPressed,
                ]}
                onPress={onPress}
            >
                {chat.other_user_photo ? (
                    <Image source={{ uri: chat.other_user_photo }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(chat.other_user_name || "U")}
                        </Text>
                    </View>
                )}

                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>
                            {chat.other_user_name || "User"}
                        </Text>
                        <Text style={[
                            styles.chatTime,
                            (chat.unread_count || 0) > 0 && styles.chatTimeUnread,
                        ]}>
                            {formatTime(chat.last_message_at)}
                        </Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text
                            style={[
                                styles.lastMessage,
                                (chat.unread_count || 0) > 0 && styles.lastMessageUnread,
                            ]}
                            numberOfLines={1}
                        >
                            {chat.last_message || "Start a conversation..."}
                        </Text>
                        {(chat.unread_count || 0) > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {chat.unread_count! > 99 ? "99+" : chat.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

export default function ChatsScreen() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserGender, setCurrentUserGender] = useState<string | null>(null);
    const [chatRequestCount, setChatRequestCount] = useState(0);
    const initialLoadComplete = useRef(false);
    const isInitialLoad = useRef(true);

    // Load chats when screen gains focus
    useFocusEffect(
        useCallback(() => {
            loadChats(false);
            loadChatRequestCount();
        }, [])
    );

    // Initialize user and set up real-time subscription
    useEffect(() => {
        initUser();
    }, []);

    // Real-time subscription for chat updates
    useEffect(() => {
        if (!currentUserId) return;

        const chatsChannel = supabase
            .channel(`user-chats-${currentUserId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "chats",
                },
                (payload) => {
                    // Reload chats when any chat is updated
                    if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
                        const chat = payload.new as any;
                        if (chat.participant_1 === currentUserId || chat.participant_2 === currentUserId) {
                            loadChats();
                        }
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    // When a new message arrives, update the corresponding chat
                    const message = payload.new as any;

                    // Only update if it's a message for the current user
                    const chatIndex = chats.findIndex(c => c.id === message.chat_id);
                    if (chatIndex !== -1) {
                        // Refresh chats to get updated last_message and unread count
                        loadChats();
                    }
                }
            )
            .subscribe();

        return () => {
            chatsChannel.unsubscribe();
        };
    }, [currentUserId, chats]);

    const initUser = async () => {
        try {
            let userId: string | null = null;
            const isGuest = await isGuestMode();

            if (isGuest) {
                const guestProfile = await getGuestProfile();
                userId = guestProfile?.id || null;
                setCurrentUserGender(guestProfile?.gender || null);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id || null;

                // Get current user's gender
                if (user?.id) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("gender")
                        .eq("id", user.id)
                        .single();
                    setCurrentUserGender(profile?.gender || null);
                }
            }

            setCurrentUserId(userId);
        } catch (error) {
            console.error("Error getting user:", error);
        }
    };

    const loadChatRequestCount = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { count } = await supabase
                .from("chat_requests")
                .select("*", { count: "exact", head: true })
                .eq("receiver_id", user.id)
                .eq("status", "pending");

            setChatRequestCount(count || 0);
        } catch (error) {
            // Table might not exist yet
            console.log("Chat requests table may not exist");
        }
    };

    const loadChats = async (isRefresh: boolean = false) => {
        try {
            // Only show loading spinner on initial load, not on refresh
            if (!initialLoadComplete.current) {
                setLoading(true);
            }

            // Get current user ID (authenticated or guest)
            let userId: string | null = null;

            const isGuest = await isGuestMode();
            if (isGuest) {
                const guestProfile = await getGuestProfile();
                userId = guestProfile?.id || null;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id || null;
            }

            if (!userId) {
                setLoading(false);
                initialLoadComplete.current = true;
                return;
            }

            setCurrentUserId(userId);

            // Fetch chats where user is a participant
            // Handle missing table gracefully
            const { data, error } = await supabase
                .from("chats")
                .select("*")
                .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
                .order("updated_at", { ascending: false });

            if (error) {
                // Check if it's a "relation does not exist" error (table missing)
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.log("Chat tables not yet created - showing empty state");
                    // Only clear chats on initial load, not on refresh errors
                    if (!initialLoadComplete.current) {
                        setChats([]);
                    }
                } else {
                    console.error("Error fetching chats:", error);
                    // Don't clear existing chats on error during refresh
                }
                setLoading(false);
                initialLoadComplete.current = true;
                return;
            }

            // For each chat, get the other user's profile name
            const chatsWithNames = await Promise.all(
                (data || []).map(async (chat) => {
                    const otherUserId = chat.participant_1 === userId
                        ? chat.participant_2
                        : chat.participant_1;

                    let otherUserName = "User";
                    let otherUserPhoto: string | undefined = undefined;

                    // Try to get profile name and photo from Supabase
                    if (!otherUserId.startsWith("guest_")) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("full_name, photos")
                            .eq("id", otherUserId)
                            .single();
                        if (profile?.full_name) {
                            otherUserName = profile.full_name;
                        }
                        if (profile?.photos && profile.photos.length > 0) {
                            otherUserPhoto = profile.photos[0];
                        }
                    } else {
                        otherUserName = "Guest User";
                    }

                    // Count unread messages
                    const { count } = await supabase
                        .from("messages")
                        .select("*", { count: "exact", head: true })
                        .eq("chat_id", chat.id)
                        .eq("is_read", false)
                        .neq("sender_id", userId);

                    return {
                        ...chat,
                        other_user_name: otherUserName,
                        other_user_id: otherUserId,
                        other_user_photo: otherUserPhoto,
                        unread_count: count || 0,
                    };
                })
            );

            setChats(chatsWithNames);
            initialLoadComplete.current = true;
            // Only animate on initial load
            if (!isRefresh) {
                setTimeout(() => {
                    isInitialLoad.current = false;
                }, 500);
            }
        } catch (error) {
            console.error("Error loading chats:", error);
            // Don't clear existing chats on error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadChats(true);
    };

    const formatTime = useCallback((timestamp: string | null) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }, []);

    const getInitials = useCallback((name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    }, []);

    const handleChatPress = useCallback((chat: Chat) => {
        router.push(
            `/chat?chatId=${chat.id}&name=${encodeURIComponent(
                chat.other_user_name || "User"
            )}&recipientId=${chat.other_user_id}`
        );
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <View style={styles.headerButtons}>
                    {/* Chat Requests Button - Show for women users */}
                    {(currentUserGender?.toLowerCase() === 'female' || currentUserGender?.toLowerCase() === 'woman') && (
                        <Pressable
                            style={styles.requestsButton}
                            onPress={() => router.push('/chat-requests')}
                        >
                            <Ionicons name="mail-outline" size={22} color="#8b5cf6" />
                            {chatRequestCount > 0 && (
                                <View style={styles.requestsBadge}>
                                    <Text style={styles.requestsBadgeText}>
                                        {chatRequestCount > 9 ? '9+' : chatRequestCount}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    )}
                    <Pressable style={styles.newChatButton}>
                        <Ionicons name="create-outline" size={24} color="#2f855a" />
                    </Pressable>
                </View>
            </View>

            {/* Chat List */}
            <ScrollView
                style={styles.chatList}
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
                        <SkeletonChatList count={5} />
                    </View>
                ) : chats.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e0" />
                        <Text style={styles.emptyTitle}>No chats yet</Text>
                        <Text style={styles.emptyText}>
                            Join events or connect with others to start chatting!
                        </Text>
                        <Pressable
                            style={styles.exploreButton}
                            onPress={() => router.push("/(tabs)/explore")}
                        >
                            <Text style={styles.exploreButtonText}>Find People</Text>
                        </Pressable>
                    </View>
                ) : (
                    chats.map((chat, index) => (
                        <AnimatedChatItem
                            key={`${chat.id}-${chat.last_message_at || ''}`}
                            chat={chat}
                            index={index}
                            onPress={() => handleChatPress(chat)}
                            formatTime={formatTime}
                            getInitials={getInitials}
                            isInitialLoad={isInitialLoad.current}
                        />
                    ))
                )
                }

                <View style={styles.bottomPadding} />
            </ScrollView >
        </View >
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
    },
    newChatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
    },
    headerButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    requestsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f5f3ff",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    requestsBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        backgroundColor: "#ef4444",
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },
    requestsBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#fff",
    },
    chatList: {
        flex: 1,
    },
    chatCard: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f7fafc",
    },
    chatCardPressed: {
        backgroundColor: "#f7fafc",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },
    chatContent: {
        flex: 1,
        justifyContent: "center",
    },
    chatHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    chatName: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1a202c",
    },
    chatTime: {
        fontSize: 13,
        color: "#718096",
    },
    chatTimeUnread: {
        color: "#2f855a",
        fontWeight: "600",
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    lastMessage: {
        fontSize: 15,
        color: "#718096",
        flex: 1,
    },
    lastMessageUnread: {
        fontWeight: "600",
        color: "#2d3748",
    },
    unreadBadge: {
        backgroundColor: "#2f855a",
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
        marginLeft: 8,
    },
    unreadText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: "#718096",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
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
        lineHeight: 22,
    },
    exploreButton: {
        backgroundColor: "#2f855a",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        marginTop: 20,
    },
    exploreButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    bottomPadding: {
        height: 20,
    },
});
