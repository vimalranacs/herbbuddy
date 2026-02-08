import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { getGuestProfile, isGuestMode } from "../lib/guest-mode";
import { supabase } from "../lib/supabase";

interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

// Animated message component for smooth entrance
const AnimatedMessage = ({ item, isMe, formatTime }: {
    item: Message;
    isMe: boolean;
    formatTime: (timestamp: string) => string;
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(isMe ? 20 : -20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 100,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.theirMessage,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                },
            ]}
        >
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                {item.content}
            </Text>
            <View style={styles.messageFooter}>
                <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                    {formatTime(item.created_at)}
                </Text>
                {isMe && (
                    <Ionicons
                        name={item.is_read ? "checkmark-done" : "checkmark"}
                        size={14}
                        color={item.is_read ? "#a7f3d0" : "rgba(255,255,255,0.6)"}
                        style={styles.readReceipt}
                    />
                )}
            </View>
        </Animated.View>
    );
};

export default function ChatScreen() {
    const { chatId, name, recipientId, eventId } = useLocalSearchParams<{
        chatId?: string;
        name?: string;
        recipientId?: string;
        eventId?: string;
    }>();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(chatId || null);
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        initializeChat();
    }, []);

    // Real-time subscription for messages
    useEffect(() => {
        if (!activeChatId || !currentUserId) return;

        // Subscribe to new messages
        const messagesChannel = supabase
            .channel(`chat-messages-${activeChatId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${activeChatId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // If message is from other user, mark it as read immediately
                    if (newMsg.sender_id !== currentUserId) {
                        markMessageAsRead(newMsg.id);
                    }

                    // Scroll to bottom
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${activeChatId}`,
                },
                (payload) => {
                    // Update read status in real-time
                    const updatedMsg = payload.new as Message;
                    setMessages((prev) =>
                        prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
                    );
                }
            )
            .subscribe();

        return () => {
            messagesChannel.unsubscribe();
        };
    }, [activeChatId, currentUserId]);

    // Mark all unread messages as read when chat opens
    useEffect(() => {
        if (activeChatId && currentUserId && messages.length > 0) {
            markAllMessagesAsRead();
        }
    }, [activeChatId, currentUserId, messages.length]);

    const markMessageAsRead = async (messageId: string) => {
        try {
            await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", messageId);
        } catch (error) {
            console.log("Error marking message as read:", error);
        }
    };

    const markAllMessagesAsRead = async () => {
        if (!activeChatId || !currentUserId) return;

        try {
            await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("chat_id", activeChatId)
                .neq("sender_id", currentUserId)
                .eq("is_read", false);
        } catch (error) {
            console.log("Error marking messages as read:", error);
        }
    };

    const initializeChat = async () => {
        try {
            // Get current user ID
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
                return;
            }

            setCurrentUserId(userId);

            // If we have a chatId, load messages
            if (chatId) {
                await loadMessages(chatId);
                setActiveChatId(chatId);
            }
            // If we have a recipientId but no chatId, find or create chat
            else if (recipientId) {
                // SECURITY CHECK: If recipient is female, ensure we have permission
                const { data: recipientProfile } = await supabase
                    .from("profiles")
                    .select("gender")
                    .eq("id", recipientId)
                    .single();

                const isRecipientFemale = recipientProfile?.gender?.toLowerCase() === 'female' || recipientProfile?.gender?.toLowerCase() === 'woman';

                if (isRecipientFemale) {
                    // Check if chat already exists
                    const { data: existingChat } = await supabase
                        .from("chats")
                        .select("id")
                        .or(`and(participant_1.eq.${userId},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${userId})`)
                        .single();

                    if (!existingChat) {
                        // Check if there is an ACCEPTED request
                        const { data: request } = await supabase
                            .from("chat_requests")
                            .select("status")
                            .eq("sender_id", userId)
                            .eq("receiver_id", recipientId)
                            .single();

                        // If no accepted request, redirect to profile
                        if (request?.status !== 'accepted') {
                            Alert.alert(
                                "Request Required",
                                "You need to send a chat request first.",
                                [{ text: "Go to Profile", onPress: () => router.replace(`/view-profile?userId=${recipientId}`) }]
                            );
                            return;
                        }
                    }
                }

                const existingChatId = await findOrCreateChat(userId, recipientId, eventId);
                if (existingChatId) {
                    setActiveChatId(existingChatId);
                    await loadMessages(existingChatId);
                }
            }
        } catch (error) {
            console.error("Error initializing chat:", error);
        } finally {
            setLoading(false);
        }
    };

    const findOrCreateChat = async (
        userId: string,
        recipientId: string,
        eventId?: string
    ): Promise<string | null> => {
        try {
            // Check if chat already exists
            const { data: existingChat, error: fetchError } = await supabase
                .from("chats")
                .select("id")
                .or(
                    `and(participant_1.eq.${userId},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${userId})`
                )
                .single();

            // Handle missing table error gracefully
            if (fetchError && (fetchError.code === '42P01' || fetchError.message?.includes('does not exist'))) {
                console.log("Chat tables not yet created");
                return null;
            }

            if (existingChat) {
                return existingChat.id;
            }

            // Create new chat
            const { data: newChat, error } = await supabase
                .from("chats")
                .insert([
                    {
                        participant_1: userId,
                        participant_2: recipientId,
                        event_id: eventId || null,
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error("Error creating chat:", error);
                return null;
            }

            return newChat?.id || null;
        } catch (error) {
            console.error("Error finding/creating chat:", error);
            return null;
        }
    };

    const loadMessages = async (chatIdToLoad: string) => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chatIdToLoad)
                .order("created_at", { ascending: true });

            if (error) {
                // Handle missing table gracefully
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.log("Messages table not yet created");
                    setMessages([]);
                    return;
                }
                console.error("Error loading messages:", error);
                return;
            }

            setMessages(data || []);

            // Mark messages as read
            if (currentUserId) {
                await supabase
                    .from("messages")
                    .update({ is_read: true })
                    .eq("chat_id", chatIdToLoad)
                    .neq("sender_id", currentUserId)
                    .eq("is_read", false);
            }

            // Scroll to bottom after loading
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChatId || !currentUserId || sending) return;

        setSending(true);
        const messageContent = newMessage.trim();
        setNewMessage("");

        // Optimistic update - add message immediately
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            chat_id: activeChatId,
            sender_id: currentUserId,
            content: messageContent,
            created_at: new Date().toISOString(),
            is_read: false,
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Scroll to bottom immediately
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);

        try {
            const { data, error } = await supabase.from("messages").insert([
                {
                    chat_id: activeChatId,
                    sender_id: currentUserId,
                    content: messageContent,
                },
            ]).select().single();

            if (error) {
                console.error("Error sending message:", error);
                // Remove optimistic message on error
                setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
                setNewMessage(messageContent); // Restore message on error
            } else if (data) {
                // Replace optimistic message with real one
                setMessages((prev) =>
                    prev.map(m => m.id === optimisticMessage.id ? data : m)
                );
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => prev.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(messageContent);
        } finally {
            setSending(false);
        }
    };

    const formatTime = useCallback((timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }, []);

    const renderMessage = useCallback(({ item }: { item: Message }) => {
        const isMe = item.sender_id === currentUserId;
        return <AnimatedMessage item={item} isMe={isMe} formatTime={formatTime} />;
    }, [currentUserId, formatTime]);

    const keyExtractor = useCallback((item: Message) => item.id, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1a202c" />
                </Pressable>
                <Pressable
                    style={styles.headerInfo}
                    onPress={() => {
                        if (recipientId) {
                            router.push(`/view-profile?userId=${recipientId}`);
                        }
                    }}
                >
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarText}>
                            {(name || "U").charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.headerName}>{name || "User"}</Text>
                        <Text style={styles.headerStatus}>
                            {isTyping ? "typing..." : "Tap to view profile"}
                        </Text>
                    </View>
                </Pressable>
                <Pressable style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#718096" />
                </Pressable>
            </View>

            {/* Messages */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2f855a" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={keyExtractor}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onLayout={() => {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={15}
                    windowSize={10}
                    initialNumToRender={20}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-outline" size={48} color="#cbd5e0" />
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubtext}>
                                Say hi to start the conversation!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor="#a0aec0"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onSubmitEditing={sendMessage}
                />
                <Pressable
                    style={({ pressed }) => [
                        styles.sendButton,
                        (!newMessage.trim() || sending) && styles.sendButtonDisabled,
                        pressed && styles.sendButtonPressed,
                    ]}
                    onPress={sendMessage}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    headerName: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1a202c",
    },
    headerStatus: {
        fontSize: 13,
        color: "#2f855a",
    },
    moreButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
    },
    messageBubble: {
        maxWidth: "80%",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#2f855a",
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 15,
        color: "#1a202c",
        lineHeight: 20,
    },
    myMessageText: {
        color: "#fff",
    },
    messageFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4,
    },
    messageTime: {
        fontSize: 11,
        color: "#718096",
    },
    myMessageTime: {
        color: "rgba(255,255,255,0.7)",
    },
    readReceipt: {
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: "#f7fafc",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: "#1a202c",
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        backgroundColor: "#cbd5e0",
    },
    sendButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
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
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a202c",
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#718096",
        marginTop: 4,
    },
});
