import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

export default function ProfileScreen() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>AG</Text>
                    </View>
                    <Pressable style={styles.editAvatarButton}>
                        <Ionicons name="camera" size={16} color="#fff" />
                    </Pressable>
                </View>
                <Text style={styles.username}>Alex Green</Text>
                <Text style={styles.bio}>🌿 Herb enthusiast | Good vibes only</Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="calendar" size={24} color="#2f855a" />
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statLabel}>Events Joined</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="people" size={24} color="#2f855a" />
                    <Text style={styles.statNumber}>28</Text>
                    <Text style={styles.statLabel}>Buddies Met</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="sparkles" size={24} color="#2f855a" />
                    <Text style={styles.statNumber}>4.8</Text>
                    <Text style={styles.statLabel}>Vibe Score</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <Pressable style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="calendar-outline" size={22} color="#2f855a" />
                        </View>
                        <Text style={styles.actionText}>My Events</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>

                <Pressable style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="bookmark-outline" size={22} color="#2f855a" />
                        </View>
                        <Text style={styles.actionText}>Saved Events</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>

                <Pressable style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="heart-outline" size={22} color="#2f855a" />
                        </View>
                        <Text style={styles.actionText}>Buddies</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>
            </View>

            {/* Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>

                <View style={styles.settingCard}>
                    <View style={styles.settingLeft}>
                        <Ionicons name="notifications-outline" size={22} color="#4a5568" />
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingText}>Notifications</Text>
                            <Text style={styles.settingSubtext}>Get event updates</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ false: "#cbd5e0", true: "#6ee7b7" }}
                        thumbColor={notificationsEnabled ? "#2f855a" : "#f4f4f5"}
                    />
                </View>

                <View style={styles.settingCard}>
                    <View style={styles.settingLeft}>
                        <Ionicons name="location-outline" size={22} color="#4a5568" />
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingText}>Location Services</Text>
                            <Text style={styles.settingSubtext}>Find nearby events</Text>
                        </View>
                    </View>
                    <Switch
                        value={locationEnabled}
                        onValueChange={setLocationEnabled}
                        trackColor={{ false: "#cbd5e0", true: "#6ee7b7" }}
                        thumbColor={locationEnabled ? "#2f855a" : "#f4f4f5"}
                    />
                </View>

                <Pressable style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#4a5568" />
                        </View>
                        <Text style={styles.actionText}>Privacy & Safety</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>

                <Pressable style={styles.actionCard}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="help-circle-outline" size={22} color="#4a5568" />
                        </View>
                        <Text style={styles.actionText}>Help & Support</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>
            </View>

            {/* Logout */}
            <Pressable style={styles.logoutButton}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text style={styles.logoutText}>Logout</Text>
            </Pressable>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    header: {
        backgroundColor: "#2f855a",
        paddingTop: 40,
        paddingBottom: 32,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#065f46",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "#fff",
    },
    avatarText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
    },
    editAvatarButton: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#2f855a",
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
    },
    username: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    bio: {
        fontSize: 15,
        color: "#d1fae5",
    },
    statsContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a202c",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#718096",
        marginTop: 4,
        textAlign: "center",
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 12,
    },
    actionCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    actionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2d3748",
    },
    settingCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    settingTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    settingText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2d3748",
        marginBottom: 2,
    },
    settingSubtext: {
        fontSize: 13,
        color: "#718096",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#fee2e2",
        backgroundColor: "#fef2f2",
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#dc2626",
    },
    bottomPadding: {
        height: 40,
    },
});
