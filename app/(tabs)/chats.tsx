import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

// Mock chat data
const MOCK_CHATS = [
    {
        id: 1,
        name: "Alex Green",
        lastMessage: "See you at the park!",
        time: "2m ago",
        unread: 2,
        avatar: "A",
    },
    {
        id: 2,
        name: "Sarah Johnson",
        lastMessage: "That sounds great!",
        time: "15m ago",
        unread: 0,
        avatar: "S",
    },
    {
        id: 3,
        name: "Mike Wilson",
        lastMessage: "I'm bringing snacks",
        time: "1h ago",
        unread: 1,
        avatar: "M",
    },
    {
        id: 4,
        name: "Beach Bonfire Group",
        lastMessage: "Emma: Can't wait!",
        time: "3h ago",
        unread: 5,
        avatar: "🔥",
    },
];

export default function ChatsScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <Pressable style={styles.newChatButton}>
                    <Ionicons name="create-outline" size={24} color="#2f855a" />
                </Pressable>
            </View>

            {/* Chat List */}
            <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
                {MOCK_CHATS.map((chat) => (
                    <Pressable
                        key={chat.id}
                        style={({ pressed }) => [
                            styles.chatCard,
                            pressed && styles.chatCardPressed,
                        ]}
                        onPress={() => router.push(`/chat?name=${chat.name}&id=${chat.id}`)}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{chat.avatar}</Text>
                        </View>

                        <View style={styles.chatContent}>
                            <View style={styles.chatHeader}>
                                <Text style={styles.chatName}>{chat.name}</Text>
                                <Text style={styles.chatTime}>{chat.time}</Text>
                            </View>
                            <View style={styles.messageRow}>
                                <Text
                                    style={[
                                        styles.lastMessage,
                                        chat.unread > 0 && styles.lastMessageUnread,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {chat.lastMessage}
                                </Text>
                                {chat.unread > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadText}>{chat.unread}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Pressable>
                ))}
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
        backgroundColor: "#cbd5e0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#4a5568",
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
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
    },
});
