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
import { supabase } from "../lib/supabase";

export default function WelcomeScreen() {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // User is logged in, redirect to tabs
            router.replace("/(tabs)");
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

            // OAuth will redirect automatically
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignIn = () => {
        router.push("/login");
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
                        <Ionicons name="leaf" size={64} color="#2f855a" />
                    </View>
                    <Text style={styles.appName}>HerbBuddy</Text>
                    <Text style={styles.tagline}>
                        Find your perfect smoking buddy nearby
                    </Text>
                </View>

                {/* Illustration/Image Space */}
                <View style={styles.illustrationContainer}>
                    <Ionicons name="people-outline" size={120} color="#a0aec0" />
                    <Text style={styles.illustrationText}>
                        Connect • Vibe • Chill
                    </Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonsContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.googleButton,
                            pressed && styles.googleButtonPressed,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#1a202c" />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={24} color="#1a202c" />
                                <Text style={styles.googleButtonText}>Continue with Google</Text>
                            </>
                        )}
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.emailButton,
                            pressed && styles.emailButtonPressed,
                        ]}
                        onPress={handleEmailSignIn}
                    >
                        <Ionicons name="mail-outline" size={24} color="#2f855a" />
                        <Text style={styles.emailButtonText}>Sign in with Email</Text>
                    </Pressable>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By continuing, you agree to our{" "}
                        <Text style={styles.link}>Terms</Text> and{" "}
                        <Text style={styles.link}>Privacy Policy</Text>
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
        paddingVertical: 32,
    },
    brandingContainer: {
        alignItems: "center",
        marginTop: 40,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 3,
        borderColor: "#2f855a",
    },
    appName: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: "#718096",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    illustrationContainer: {
        alignItems: "center",
        paddingVertical: 40,
    },
    illustrationText: {
        marginTop: 16,
        fontSize: 18,
        color: "#718096",
        fontWeight: "500",
    },
    buttonsContainer: {
        gap: 16,
    },
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    googleButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a202c",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#e2e8f0",
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: "#a0aec0",
    },
    emailButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0fdf4",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: "#2f855a",
    },
    emailButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    emailButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2f855a",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    footer: {
        alignItems: "center",
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
