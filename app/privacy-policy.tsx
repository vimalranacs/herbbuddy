import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="shield-checkmark" size={48} color="#2f855a" />
                    <Text style={styles.title}>Privacy Policy</Text>
                    <Text style={styles.lastUpdated}>Last updated: February 2026</Text>
                </View>

                {/* Introduction */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.paragraph}>
                        Welcome to HerbBuddy. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application.
                    </Text>
                </View>

                {/* Information We Collect */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                    <Text style={styles.paragraph}>
                        We collect the following types of information:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>
                                <Text style={styles.bold}>Account Information:</Text> Name, email, age, and profile details you provide during registration.
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>
                                <Text style={styles.bold}>Location Data:</Text> When you enable location services, we collect your approximate location to show nearby events.
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>
                                <Text style={styles.bold}>Usage Data:</Text> Information about how you interact with the app, including events joined and messages sent.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* How We Use Your Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
                    <Text style={styles.paragraph}>
                        We use your information to:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Provide and maintain our services</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Connect you with events and other users</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Send notifications about events and messages</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Improve our app and user experience</Text>
                        </View>
                    </View>
                </View>

                {/* Data Sharing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Data Sharing</Text>
                    <Text style={styles.paragraph}>
                        We do not sell your personal information. We may share your data only:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>With other users (your public profile and event participation)</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>With service providers who help us operate the app</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>When required by law or to protect our rights</Text>
                        </View>
                    </View>
                </View>

                {/* Data Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Data Security</Text>
                    <Text style={styles.paragraph}>
                        We implement appropriate security measures to protect your personal information. Your data is stored securely using industry-standard encryption and security practices.
                    </Text>
                </View>

                {/* Your Rights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Your Rights</Text>
                    <Text style={styles.paragraph}>
                        You have the right to:
                    </Text>
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Access your personal data</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Request correction of inaccurate data</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Request deletion of your account and data</Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>Opt out of marketing communications</Text>
                        </View>
                    </View>
                </View>

                {/* Guest Mode */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Guest Mode</Text>
                    <Text style={styles.paragraph}>
                        If you use HerbBuddy as a guest, your profile data is stored locally on your device only and is not synced to our servers. This data will be lost if you uninstall the app or clear app data.
                    </Text>
                </View>

                {/* Contact Us */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Contact Us</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions about this Privacy Policy, please contact us at:
                    </Text>
                    <Text style={styles.contactEmail}>support@herbbuddy.app</Text>
                </View>

                {/* Bottom padding */}
                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Accept Button */}
            <View style={styles.footer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.acceptButton,
                        pressed && styles.acceptButtonPressed,
                    ]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.acceptButtonText}>I Understand</Text>
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
        marginTop: 12,
    },
    lastUpdated: {
        fontSize: 14,
        color: "#718096",
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2d3748",
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: "#4a5568",
    },
    bulletList: {
        marginTop: 8,
    },
    bulletItem: {
        flexDirection: "row",
        marginBottom: 8,
    },
    bullet: {
        fontSize: 15,
        color: "#2f855a",
        marginRight: 8,
        fontWeight: "bold",
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: "#4a5568",
    },
    bold: {
        fontWeight: "600",
        color: "#2d3748",
    },
    contactEmail: {
        fontSize: 15,
        color: "#2f855a",
        fontWeight: "600",
        marginTop: 8,
    },
    bottomPadding: {
        height: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    acceptButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2f855a",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    acceptButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
});
