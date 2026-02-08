import { router, useLocalSearchParams, useRootNavigationState } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackScreen() {
    const params = useLocalSearchParams();
    const navigationState = useRootNavigationState();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your login...");

    useEffect(() => {
        // Wait for navigation to be ready
        if (!navigationState?.key) return;

        handleAuthCallback();
    }, [navigationState?.key]);

    const handleAuthCallback = async () => {
        try {
            console.log("🔐 Auth callback received with params:", params);

            // Get the current session - Supabase should have automatically
            // processed the magic link and created a session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("❌ Auth callback error:", error);
                setStatus("error");
                setMessage("Authentication failed. Please try again.");
                setTimeout(() => router.replace("/welcome"), 2000);
                return;
            }

            if (session) {
                console.log("✅ Session found! User:", session.user.email);
                setStatus("success");
                setMessage("Login successful! Redirecting...");

                // Check if user has a profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", session.user.id)
                    .single();

                setTimeout(() => {
                    if (profile) {
                        router.replace("/(tabs)");
                    } else {
                        router.replace("/profile-setup");
                    }
                }, 1000);
            } else {
                // No session - might need to exchange tokens
                console.log("⚠️ No session found after callback");
                setStatus("error");
                setMessage("Could not verify login. Please try again.");
                setTimeout(() => router.replace("/welcome"), 2000);
            }
        } catch (error) {
            console.error("💥 Auth callback error:", error);
            setStatus("error");
            setMessage("An error occurred. Please try again.");
            setTimeout(() => router.replace("/welcome"), 2000);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {status === "loading" && (
                    <>
                        <ActivityIndicator size="large" color="#2f855a" />
                        <Text style={styles.text}>{message}</Text>
                    </>
                )}
                {status === "success" && (
                    <>
                        <Text style={styles.icon}>✅</Text>
                        <Text style={styles.text}>{message}</Text>
                    </>
                )}
                {status === "error" && (
                    <>
                        <Text style={styles.icon}>❌</Text>
                        <Text style={styles.text}>{message}</Text>
                    </>
                )}
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
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    text: {
        fontSize: 18,
        color: "#4a5568",
        textAlign: "center",
        marginTop: 16,
    },
});
