import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsAndConditionsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#2f855a" />
                </Pressable>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Last Updated: 04/02/2026</Text>

                <Text style={styles.paragraph}>
                    Welcome to Vybe ("App", "we", "our", "us"). Vybe is a social discovery platform that helps users connect with others to hang out, attend events, explore places, or vibe together. By accessing or using Vybe, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the App.
                </Text>

                <Text style={styles.sectionTitle}>1. Eligibility</Text>
                <Text style={styles.paragraph}>
                    • You must be at least 18 years old to use Vybe.{"\n"}
                    • By using the App, you confirm that all information you provide is accurate and truthful.{"\n"}
                    • We reserve the right to suspend or terminate accounts that provide false information.
                </Text>

                <Text style={styles.sectionTitle}>2. Account Registration</Text>
                <Text style={styles.paragraph}>
                    • You must create an account using valid credentials (Google or Email).{"\n"}
                    • You are responsible for maintaining the confidentiality of your account.{"\n"}
                    • Any activity performed through your account is your responsibility.
                </Text>

                <Text style={styles.sectionTitle}>3. Purpose of the App</Text>
                <Text style={styles.paragraph}>
                    Vybe is not a dating app. It is a social discovery platform designed for:{"\n\n"}
                    • Temporary companionship{"\n"}
                    • Attending events or plans{"\n"}
                    • Exploring cafes, places, walks, or casual meetups{"\n\n"}
                    Any personal interactions, meetups, or decisions made outside the app are entirely your responsibility.
                </Text>

                <Text style={styles.sectionTitle}>4. User Conduct</Text>
                <Text style={styles.paragraph}>
                    You agree NOT to:{"\n\n"}
                    • Harass, abuse, threaten, or harm other users{"\n"}
                    • Share illegal, offensive, or explicit content{"\n"}
                    • Impersonate another person{"\n"}
                    • Use the app for commercial solicitation without permission{"\n"}
                    • Create fake profiles or misrepresent yourself{"\n\n"}
                    Violation of these rules may result in account suspension or permanent removal.
                </Text>

                <Text style={styles.sectionTitle}>5. Events & Meetups</Text>
                <Text style={styles.paragraph}>
                    • Vybe only provides a platform to create and join events.{"\n"}
                    • We do not verify events, hosts, or participants.{"\n"}
                    • You attend events or meetups at your own risk.{"\n"}
                    • Vybe is not responsible for any physical, emotional, financial, or legal harm resulting from meetups.{"\n"}
                    • Always prioritize your personal safety.
                </Text>

                <Text style={styles.sectionTitle}>6. Content & Media</Text>
                <Text style={styles.paragraph}>
                    • You retain ownership of photos and content you upload.{"\n"}
                    • By uploading content, you grant Vybe a non-exclusive, royalty-free license to display it within the app.{"\n"}
                    • We reserve the right to remove any content that violates our policies.
                </Text>

                <Text style={styles.sectionTitle}>7. Location Services</Text>
                <Text style={styles.paragraph}>
                    • Vybe may use approximate location data to show nearby users or events.{"\n"}
                    • We do not share your exact location publicly.{"\n"}
                    • You can disable location access, but some features may not work properly.
                </Text>

                <Text style={styles.sectionTitle}>8. Privacy</Text>
                <Text style={styles.paragraph}>
                    Your data is handled according to our Privacy Policy. We use third-party services like Supabase and Cloudinary for authentication and storage. Vybe is not responsible for outages or failures caused by third-party services.
                </Text>

                <Text style={styles.sectionTitle}>9. Account Termination</Text>
                <Text style={styles.paragraph}>
                    • You may delete your account at any time.{"\n"}
                    • We reserve the right to suspend or terminate accounts without notice if these Terms are violated.{"\n"}
                    • Termination may result in loss of data associated with your account.
                </Text>

                <Text style={styles.sectionTitle}>10. Disclaimer</Text>
                <Text style={styles.paragraph}>
                    Vybe is provided "as is" without warranties of any kind. We do not guarantee:{"\n\n"}
                    • Matches{"\n"}
                    • Companionship{"\n"}
                    • Safety of interactions{"\n"}
                    • Accuracy of user profiles or events{"\n\n"}
                    Use the app responsibly.
                </Text>

                <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
                <Text style={styles.paragraph}>
                    Vybe and its creators shall not be liable for:{"\n\n"}
                    • Personal disputes between users{"\n"}
                    • Injuries, losses, or damages{"\n"}
                    • Emotional distress or misunderstandings{"\n"}
                    • Any incidents occurring outside the app
                </Text>

                <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
                <Text style={styles.paragraph}>
                    We may update these Terms from time to time. Continued use of Vybe after changes means you accept the updated Terms.
                </Text>

                <Text style={styles.sectionTitle}>13. Governing Law</Text>
                <Text style={styles.paragraph}>
                    These Terms shall be governed by and interpreted in accordance with the laws of India.
                </Text>

                <Text style={styles.sectionTitle}>14. Contact</Text>
                <Text style={styles.paragraph}>
                    If you have questions or concerns regarding these Terms, contact us at:{"\n"}
                    📧 vimalrana877@gmail.com
                </Text>

                <View style={styles.bottomPadding} />
            </ScrollView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2d3748",
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    lastUpdated: {
        fontSize: 14,
        color: "#718096",
        fontStyle: "italic",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2f855a",
        marginTop: 20,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        lineHeight: 24,
        color: "#4a5568",
        marginBottom: 12,
    },
    bottomPadding: {
        height: 40,
    },
});
