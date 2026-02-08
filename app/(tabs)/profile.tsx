import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { clearGuestData, getGuestProfile, isGuestMode } from "../../lib/guest-mode";
import { supabase } from "../../lib/supabase";

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

const SOCIAL_LABELS: Record<string, string> = {
    alcohol: "🍺 Alcohol-friendly",
    smoke: "🌿 Smoke-friendly",
    none: "🚫 No substances",
    neutral: "🤷 Doesn't matter",
};

const GROUP_LABELS: Record<string, string> = {
    duo: "1–2 people",
    small: "Small group (3–6)",
    medium: "Medium (7–15)",
    large: "Big parties (15+)",
};

interface ProfileData {
    full_name: string;
    age: number;
    city: string;
    gender?: string;
    interests: string[];
    vibe: string[];
    social_preferences: string[];
    group_comfort: string;
    photos: string[];
    isGuest: boolean;
    userId?: string;
}

interface ProfileStats {
    eventsJoined: number;
    chatsCount: number;
}

export default function ProfileScreen() {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [stats, setStats] = useState<ProfileStats>({ eventsJoined: 0, chatsCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const isGuest = await isGuestMode();
            let userId: string | null = null;

            if (isGuest) {
                const guestProfile = await getGuestProfile();
                if (guestProfile) {
                    userId = guestProfile.id;
                    setProfile({
                        full_name: guestProfile.full_name,
                        age: guestProfile.age,
                        city: guestProfile.city,
                        gender: guestProfile.gender,
                        interests: guestProfile.interests || [],
                        vibe: guestProfile.vibe || [],
                        social_preferences: guestProfile.social_preferences || [],
                        group_comfort: guestProfile.group_comfort || "",
                        photos: guestProfile.photos || [],
                        isGuest: true,
                        userId: userId,
                    });
                }
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    userId = user.id;
                    const { data: dbProfile } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .single();

                    if (dbProfile) {
                        setProfile({
                            full_name: dbProfile.full_name || "User",
                            age: dbProfile.age || 0,
                            city: dbProfile.city || "",
                            gender: dbProfile.gender,
                            interests: dbProfile.interests || [],
                            vibe: dbProfile.vibe || [],
                            social_preferences: dbProfile.social_preferences || [],
                            group_comfort: dbProfile.group_comfort || "",
                            photos: dbProfile.photos || [],
                            isGuest: false,
                            userId: userId,
                        });
                    }
                }
            }

            if (userId) {
                await loadStats(userId);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async (userId: string) => {
        try {
            const { count: chatsCount } = await supabase
                .from("chats")
                .select("*", { count: "exact", head: true })
                .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

            const { count: eventsHosted } = await supabase
                .from("events")
                .select("*", { count: "exact", head: true })
                .eq("host_id", userId);

            setStats({
                eventsJoined: eventsHosted || 0,
                chatsCount: chatsCount || 0,
            });
        } catch (error) {
            console.log("Stats not available yet");
        }
    };

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    try {
                        if (profile?.isGuest) {
                            await clearGuestData();
                        } else {
                            await supabase.auth.signOut();
                        }
                        router.replace("/welcome");
                    } catch (error) {
                        console.error("Logout error:", error);
                    }
                },
            },
        ]);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header with Photo */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {profile?.photos && profile.photos.length > 0 ? (
                        <Image source={{ uri: profile.photos[0] }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {profile ? getInitials(profile.full_name) : "??"}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.username}>{profile?.full_name || "Loading..."}</Text>
                {profile?.isGuest && (
                    <View style={styles.guestBadge}>
                        <Text style={styles.guestBadgeText}>🎭 Guest Mode</Text>
                    </View>
                )}
                <Text style={styles.bio}>
                    {profile ? `📍 ${profile.city} • ${profile.age} years` : "🌿 Herb enthusiast"}
                </Text>
                {profile?.gender && (
                    <Text style={styles.genderText}>{profile.gender}</Text>
                )}
                {/* Edit Profile Button */}
                <Pressable
                    style={styles.editProfileButton}
                    onPress={() => router.push("/profile-setup")}
                >
                    <Ionicons name="pencil" size={16} color="#fff" />
                    <Text style={styles.editProfileText}>Edit Profile</Text>
                </Pressable>
            </View>

            {/* Vibe Section */}
            {profile?.vibe && profile.vibe.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✨ My Vibe</Text>
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
            {profile?.interests && profile.interests.length > 0 && (
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

            {/* Preferences Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚙️ Preferences</Text>
                <View style={styles.prefCard}>
                    {profile?.social_preferences && profile.social_preferences.length > 0 && (
                        <View style={styles.prefRow}>
                            <Ionicons name="wine-outline" size={18} color="#2f855a" />
                            <Text style={styles.prefLabel}>Social:</Text>
                            <Text style={styles.prefValue}>
                                {profile.social_preferences.map(p => SOCIAL_LABELS[p] || p).join(", ")}
                            </Text>
                        </View>
                    )}
                    {profile?.group_comfort && (
                        <View style={styles.prefRow}>
                            <Ionicons name="people-outline" size={18} color="#2f855a" />
                            <Text style={styles.prefLabel}>Group Size:</Text>
                            <Text style={styles.prefValue}>
                                {GROUP_LABELS[profile.group_comfort] || profile.group_comfort}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="calendar" size={24} color="#2f855a" />
                    <Text style={styles.statNumber}>{stats.eventsJoined}</Text>
                    <Text style={styles.statLabel}>Events Created</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="chatbubbles" size={24} color="#2f855a" />
                    <Text style={styles.statNumber}>{stats.chatsCount}</Text>
                    <Text style={styles.statLabel}>Conversations</Text>
                </View>
            </View>

            {/* Guest Mode Notice */}
            {profile?.isGuest && (
                <View style={styles.guestNotice}>
                    <Ionicons name="information-circle" size={20} color="#92400e" />
                    <Text style={styles.guestNoticeText}>
                        Your profile is saved locally. Sign up to sync across devices!
                    </Text>
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <Pressable style={styles.actionCard} onPress={() => router.push("/discover")}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="calendar-outline" size={22} color="#2f855a" />
                        </View>
                        <Text style={styles.actionText}>Browse Events</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>

                <Pressable style={styles.actionCard} onPress={() => router.push("/add-event")}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="add-circle-outline" size={22} color="#2f855a" />
                        </View>
                        <Text style={styles.actionText}>Create Event</Text>
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

                <Pressable style={styles.actionCard} onPress={() => router.push("/terms-and-conditions")}>
                    <View style={styles.actionLeft}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="document-text-outline" size={22} color="#4a5568" />
                        </View>
                        <Text style={styles.actionText}>Terms & Conditions</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
                </Pressable>
            </View>

            {/* Sign Up Prompt for Guests */}
            {profile?.isGuest && (
                <Pressable style={styles.signUpButton} onPress={() => router.push("/signup")}>
                    <Ionicons name="person-add-outline" size={20} color="#2f855a" />
                    <Text style={styles.signUpText}>Create Account</Text>
                </Pressable>
            )}

            {/* Logout */}
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text style={styles.logoutText}>
                    {profile?.isGuest ? "Exit Guest Mode" : "Logout"}
                </Text>
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
        paddingTop: 50,
        paddingBottom: 32,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
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
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: "#fff",
    },
    avatarText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
    },
    username: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    guestBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    guestBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
    bio: {
        fontSize: 15,
        color: "#d1fae5",
    },
    genderText: {
        fontSize: 13,
        color: "#a7f3d0",
        marginTop: 4,
    },
    editProfileButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 12,
        gap: 6,
    },
    editProfileText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 20,
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
        gap: 12,
    },
    prefRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    prefLabel: {
        color: "#718096",
        fontSize: 14,
        fontWeight: "500",
    },
    prefValue: {
        flex: 1,
        color: "#2d3748",
        fontSize: 14,
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
    guestNotice: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fef3c7",
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    guestNoticeText: {
        flex: 1,
        fontSize: 13,
        color: "#92400e",
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
    signUpButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#2f855a",
        backgroundColor: "#f0fdf4",
        gap: 8,
    },
    signUpText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2f855a",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
        marginTop: 12,
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
