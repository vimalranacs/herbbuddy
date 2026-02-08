import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getGuestProfile, isGuestMode } from "../lib/guest-mode";
import { supabase } from "../lib/supabase";

export default function WelcomeScreen() {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        // Check for authenticated user first
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            router.replace("/(tabs)");
            setChecking(false);
            return;
        }

        // Check for guest user
        const isGuest = await isGuestMode();
        if (isGuest) {
            const guestProfile = await getGuestProfile();
            if (guestProfile) {
                console.log("👋 Welcome back, guest:", guestProfile.full_name);
                router.replace("/(tabs)");
                setChecking(false);
                return;
            }
        }

        setChecking(false);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: process.env.EXPO_PUBLIC_REDIRECT_URL,
                    skipBrowserRedirect: false,
                },
            });

            if (error) {
                Alert.alert("Sign in failed", error.message);
                return;
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignIn = () => {
        router.push("/login");
    };

    const handleGuestMode = async () => {
        console.log("🎭 Starting guest mode...");
        router.push("/profile-setup?guest=true");
    };

    if (checking) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#2f855a" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo/Branding */}
                <View style={styles.brandingContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="leaf" size={56} color="#2f855a" />
                    </View>
                    <Text style={styles.appName}>HerbBuddy</Text>
                    <Text style={styles.tagline}>
                        Find your vibe. Find your crew.
                    </Text>
                </View>

                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    <Ionicons name="people-outline" size={100} color="#a0aec0" />
                    <Text style={styles.illustrationText}>
                        Connect • Vibe • Chill
                    </Text>
                </View>

                {/* Auth Buttons */}
                <View style={styles.buttonsContainer}>
                    {/* Google Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.googleButton,
                            pressed && styles.buttonPressed,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#1a202c" />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={22} color="#1a202c" />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </Pressable>

                    {/* Email Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.emailButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleEmailSignIn}
                    >
                        <Ionicons name="mail-outline" size={22} color="#2f855a" />
                        <Text style={styles.emailButtonText}>Sign in with Email</Text>
                    </Pressable>

                    {/* Divider with Guest option */}
                    <View style={styles.guestContainer}>
                        <View style={styles.dividerLine} />
                        <Pressable
                            style={({ pressed }) => [
                                styles.guestButton,
                                pressed && styles.guestButtonPressed,
                            ]}
                            onPress={handleGuestMode}
                        >
                            <Ionicons name="person-outline" size={16} color="#718096" />
                            <Text style={styles.guestButtonText}>Try as Guest</Text>
                        </Pressable>
                        <View style={styles.dividerLine} />
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By continuing, you agree to our{" "}
                        <Text
                            style={styles.link}
                            onPress={() => router.push("/terms-and-conditions")}
                        >
                            Terms
                        </Text>{" "}
                        and{" "}
                        <Text
                            style={styles.link}
                            onPress={() => router.push("/privacy-policy")}
                        >Privacy Policy</Text>
                    </Text>
                </View>
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
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "space-between",
        paddingVertical: 24,
    },
    brandingContainer: {
        alignItems: "center",
        marginTop: 32,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 3,
        borderColor: "#2f855a",
    },
    appName: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        color: "#718096",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    illustrationContainer: {
        alignItems: "center",
        paddingVertical: 24,
    },
    illustrationText: {
        marginTop: 12,
        fontSize: 16,
        color: "#718096",
        fontWeight: "500",
    },
    buttonsContainer: {
        gap: 12,
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1a202c",
    },
    emailButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0fdf4",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: "#2f855a",
    },
    emailButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#2f855a",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    guestContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#e2e8f0",
    },
    guestButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    guestButtonPressed: {
        opacity: 0.7,
    },
    guestButtonText: {
        fontSize: 14,
        color: "#718096",
        fontWeight: "500",
    },
    footer: {
        alignItems: "center",
        paddingTop: 8,
    },
    footerText: {
        fontSize: 12,
        color: "#a0aec0",
        textAlign: "center",
        lineHeight: 18,
    },
    link: {
        color: "#2f855a",
        fontWeight: "600",
    },
});
