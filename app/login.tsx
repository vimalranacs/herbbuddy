import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            console.log("🔄 Attempting login with email:", email.trim());

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) {
                console.error("❌ Login error:", error);
                Alert.alert("Login Failed", error.message);
                return;
            }

            if (data.user) {
                console.log("✅ Login successful for:", data.user.email);

                // Check if user has completed their profile (including new fields)
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, full_name, interests, vibe")
                    .eq("id", data.user.id)
                    .single();

                console.log("📋 Profile check:", {
                    hasProfile: !!profile,
                    fullName: profile?.full_name,
                    interests: profile?.interests?.length || 0,
                    profileError: profileError?.message
                });

                // Profile is complete only if it has full_name AND interests (from new flow)
                const isProfileComplete = profile &&
                    profile.full_name &&
                    profile.interests &&
                    profile.interests.length > 0;

                if (!isProfileComplete) {
                    // No profile or incomplete profile - redirect to profile setup
                    console.log("🆕 Incomplete profile - redirecting to profile setup");
                    router.replace("/profile-setup");
                } else {
                    // Profile exists and is complete - go to main app
                    console.log("👤 Complete profile - redirecting to main app");
                    router.replace("/(tabs)");
                }
            }
        } catch (error) {
            console.error("💥 Unexpected login error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            Alert.alert("Enter Email", "Please enter your email address first");
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

            if (error) {
                Alert.alert("Error", error.message);
                return;
            }

            Alert.alert(
                "Check Your Email",
                "We've sent a password reset link to your email."
            );
        } catch (error) {
            Alert.alert("Error", "Failed to send reset email");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🌿</Text>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Login to find your herb buddies</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#718096" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#a0aec0"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#718096" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#a0aec0"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                />
                                <Pressable onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#718096"
                                    />
                                </Pressable>
                            </View>
                        </View>

                        <Pressable style={styles.forgotPassword} onPress={handleForgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.loginButton,
                                pressed && styles.loginButtonPressed,
                                loading && styles.loginButtonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? "Logging in..." : "Login"}
                            </Text>
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.signupPrompt}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <Pressable onPress={() => router.push("/signup")}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        backgroundColor: "#2f855a",
        paddingTop: 40,
        paddingBottom: 60,
        alignItems: "center",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    logo: {
        fontSize: 60,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#d1fae5",
    },
    form: {
        padding: 24,
        marginTop: -30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#2d3748",
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: "#e2e8f0",
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#2d3748",
    },
    forgotPassword: {
        alignSelf: "flex-end",
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: "#2f855a",
        fontWeight: "600",
    },
    loginButton: {
        backgroundColor: "#2f855a",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: "#2f855a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    loginButtonDisabled: {
        backgroundColor: "#9ca3af",
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#e2e8f0",
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: "#718096",
    },
    signupPrompt: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signupText: {
        fontSize: 15,
        color: "#4a5568",
    },
    signupLink: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2f855a",
    },
});
