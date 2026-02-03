import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

// For demo purposes, we'll use a mock event_id
// In a real app, this would come from navigation params
const DEMO_EVENT_ID = "demo-event-123";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    isMine?: boolean;
}

export default function ChatScreen() {
    const params = useLocalSearchParams();
    const chatName = params.name || "Chat";

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Get current user and fetch messages
    useEffect(() => {
        getCurrentUser();
        fetchMessages();
        const subscription = subscribeToMessages();

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, []);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("event_id", DEMO_EVENT_ID)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching messages:", error);
                return;
            }

            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`messages:${DEMO_EVENT_ID}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `event_id=eq.${DEMO_EVENT_ID}`,
                },
                (payload) => {
                    setMessages((current) => [...current, payload.new as Message]);
                    // Scroll to bottom when new message arrives
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            )
            .subscribe();
        return channel;
    };

    const handleSend = async () => {
        if (!inputText.trim() || !userId) return;

        const messageText = inputText.trim();
        setInputText(""); // Clear input immediately

        try {
            const { error } = await supabase
                .from("messages")
                .insert([
                    {
                        event_id: DEMO_EVENT_ID,
                        sender_id: userId,
                        content: messageText,
                    },
                ]);

            if (error) {
                Alert.alert("Error", "Failed to send message");
                console.error(error);
                setInputText(messageText); // Restore text on error
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setInputText(messageText);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender_id === userId;
        const messageTime = new Date(item.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        return (
            <View
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessageContainer : styles.theirMessageContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isMe ? styles.myMessage : styles.theirMessage,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isMe ? styles.myMessageText : styles.theirMessageText,
                        ]}
                    >
                        {item.content}
                    </Text>
                </View>
                <Text style={styles.messageTime}>{messageTime}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={90}
            >
                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor="#a0aec0"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <Pressable
                            style={styles.attachButton}
                            onPress={() => { }}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#718096" />
                        </Pressable>
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            styles.sendButton,
                            pressed && styles.sendButtonPressed,
                            !inputText.trim() && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        marginBottom: 16,
    },
    myMessageContainer: {
        alignItems: "flex-end",
    },
    theirMessageContainer: {
        alignItems: "flex-start",
    },
    messageBubble: {
        maxWidth: "75%",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
        marginBottom: 4,
    },
    myMessage: {
        backgroundColor: "#2f855a",
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: "#fff",
    },
    theirMessageText: {
        color: "#2d3748",
    },
    messageTime: {
        fontSize: 11,
        color: "#a0aec0",
        marginHorizontal: 8,
    },
    inputContainer: {
        flexDirection: "row",
        padding: 12,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        gap: 8,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#f7fafc",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#2d3748",
        maxHeight: 100,
    },
    attachButton: {
        padding: 4,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.9,
    },
    sendButtonDisabled: {
        backgroundColor: "#cbd5e0",
    },
});
