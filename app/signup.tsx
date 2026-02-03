import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function SignupScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        if (!agreedToTerms) {
            Alert.alert("Error", "Please agree to the terms and conditions");
            return;
        }
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: name.trim(),
                    },
                },
            });

            if (error) {
                Alert.alert("Signup Failed", error.message);
                return;
            }

            if (data.user) {
                Alert.alert(
                    "Success!",
                    "Account created successfully. You can now login.",
                    [{ text: "OK", onPress: () => router.replace("/login") }]
                );
            }
        } catch (error) {
            Alert.alert("Error", "An unexpected error occurred");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🌿</Text>
                    <Text style={styles.title}>Join HerbBuddy</Text>
                    <Text style={styles.subtitle}>Create your account to get started</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#718096" />
                            <TextInput
                                style={styles.input}
                                placeholder="John Doe"
                                placeholderTextColor="#a0aec0"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

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
                                placeholder="At least 8 characters"
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

                    <Pressable
                        style={styles.termsContainer}
                        onPress={() => setAgreedToTerms(!agreedToTerms)}
                    >
                        <View style={styles.checkbox}>
                            {agreedToTerms && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the{" "}
                            <Text style={styles.termsLink}>Terms & Conditions</Text>
                        </Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.signupButton,
                            pressed && styles.signupButtonPressed,
                            loading && styles.signupButtonDisabled,
                        ]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        <Text style={styles.signupButtonText}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </Text>
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.loginPrompt}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Pressable onPress={() => router.push("/login")}>
                            <Text style={styles.loginLink}>Login</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
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
    termsContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#2f855a",
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },
    termsText: {
        fontSize: 14,
        color: "#4a5568",
        flex: 1,
    },
    termsLink: {
        color: "#2f855a",
        fontWeight: "600",
    },
    signupButton: {
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
    signupButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    signupButtonDisabled: {
        backgroundColor: "#9ca3af",
        opacity: 0.7,
    },
    signupButtonText: {
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
    loginPrompt: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    loginText: {
        fontSize: 15,
        color: "#4a5568",
    },
    loginLink: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2f855a",
    },
});
