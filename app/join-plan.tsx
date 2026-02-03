import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JoinPlanScreen() {
    const params = useLocalSearchParams();

    // Mock data - would come from params or API
    const plan = {
        title: params.title || "Sunset Herb Session 🌅",
        description: "Chill sunset vibes with good people. Bring your own herbs and let's enjoy the evening together!",
        host: "Alex Green",
        location: "Central Park",
        time: "Today, 6:00 PM",
        attendees: 3,
        maxAttendees: 8,
    };

    const handleJoin = () => {
        // TODO: Implement join logic
        console.log("Joined plan:", plan.title);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Plan Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="leaf" size={40} color="#fff" />
                    </View>
                </View>

                {/* Plan Details */}
                <Text style={styles.title}>{plan.title}</Text>
                <Text style={styles.description}>{plan.description}</Text>

                {/* Host Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Host</Text>
                    <View style={styles.hostCard}>
                        <View style={styles.hostAvatar}>
                            <Text style={styles.hostAvatarText}>{plan.host[0]}</Text>
                        </View>
                        <View style={styles.hostInfo}>
                            <Text style={styles.hostName}>{plan.host}</Text>
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={14} color="#f59e0b" />
                                <Text style={styles.rating}>4.8</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>

                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={20} color="#2f855a" />
                        <Text style={styles.detailText}>{plan.location}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={20} color="#2f855a" />
                        <Text style={styles.detailText}>{plan.time}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="people" size={20} color="#2f855a" />
                        <Text style={styles.detailText}>
                            {plan.attendees}/{plan.maxAttendees} spots filled
                        </Text>
                    </View>
                </View>

                {/* Attendees Preview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Going</Text>
                    <View style={styles.attendeesRow}>
                        {[1, 2, 3].map((i) => (
                            <View key={i} style={styles.attendeeAvatar}>
                                <Text style={styles.attendeeAvatarText}>
                                    {String.fromCharCode(65 + i)}
                                </Text>
                            </View>
                        ))}
                        <View style={styles.moreAttendees}>
                            <Text style={styles.moreAttendeesText}>+2</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.joinButton,
                        pressed && styles.joinButtonPressed,
                    ]}
                    onPress={handleJoin}
                >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.joinButtonText}>Join This Plan</Text>
                </Pressable>

                <Pressable style={styles.cancelButton} onPress={() => router.back()}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
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
        marginBottom: 32,
        textAlign: "center",
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
        backgroundColor: "#cbd5e0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    hostAvatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#4a5568",
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
    attendeesRow: {
        flexDirection: "row",
        gap: -8,
    },
    attendeeAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#cbd5e0",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    attendeeAvatarText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#4a5568",
    },
    moreAttendees: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    moreAttendeesText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
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
    joinButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    joinButtonText: {
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
});
