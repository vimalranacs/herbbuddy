import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function VerifyOTPScreen() {
    const { email, isNewUser } = useLocalSearchParams<{ email: string; isNewUser?: string }>();
    const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<TextInput[]>([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        // Countdown timer for resend
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleOtpChange = (value: string, index: number) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 7) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-verify when all digits entered
        if (value && index === 7) {
            const fullOtp = newOtp.join("");
            if (fullOtp.length === 8) {
                verifyOtp(fullOtp);
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace - move to previous input
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyOtp = async (otpCode: string) => {
        if (!email) {
            Alert.alert("Error", "Email not found. Please go back and try again.");
            return;
        }

        setLoading(true);
        try {
            console.log("🔐 Verifying OTP for:", email);

            const { data, error } = await supabase.auth.verifyOtp({
                email: email,
                token: otpCode,
                type: "email",
            });

            if (error) {
                console.error("❌ OTP verification error:", error);
                Alert.alert("Invalid Code", error.message);
                // Clear OTP inputs
                setOtp(["", "", "", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
                return;
            }

            if (data.session) {
                console.log("✅ OTP verified successfully!");

                // If this is a new user from signup, go directly to profile setup
                if (isNewUser === "true") {
                    console.log("🆕 New user - redirecting to profile setup");
                    router.replace("/profile-setup");
                    return;
                }

                // For existing users, check if they have a profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", data.user?.id)
                    .single();

                if (profile) {
                    // Existing user with profile
                    console.log("👤 Existing user with profile - going to tabs");
                    router.replace("/(tabs)");
                } else {
                    // User without profile - go to profile setup
                    console.log("🆕 User without profile - redirecting to profile setup");
                    router.replace("/profile-setup");
                }
            }
        } catch (error: any) {
            console.error("💥 OTP verification error:", error);
            Alert.alert("Error", "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        if (!email || countdown > 0) return;

        setResending(true);
        try {
            console.log("📧 Resending OTP to:", email);

            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: true,
                },
            });

            if (error) {
                console.error("❌ Resend error:", error);
                Alert.alert("Error", error.message);
                return;
            }

            Alert.alert("Code Sent!", "A new verification code has been sent to your email.");
            setCountdown(60); // 60 second cooldown
            setOtp(["", "", "", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } catch (error: any) {
            console.error("💥 Resend error:", error);
            Alert.alert("Error", "Failed to resend code.");
        } finally {
            setResending(false);
        }
    };

    const handleManualVerify = () => {
        const fullOtp = otp.join("");
        if (fullOtp.length !== 8) {
            Alert.alert("Invalid Code", "Please enter the complete 8-digit code.");
            return;
        }
        verifyOtp(fullOtp);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2f855a" />
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-open-outline" size={64} color="#2f855a" />
                </View>

                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                    We've sent an 8-digit code to{"\n"}
                    <Text style={styles.email}>{email}</Text>
                </Text>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                if (ref) inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.otpInput,
                                digit && styles.otpInputFilled,
                                loading && styles.otpInputDisabled,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            editable={!loading}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {/* Verify Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.verifyButton,
                        pressed && styles.verifyButtonPressed,
                        loading && styles.verifyButtonDisabled,
                    ]}
                    onPress={handleManualVerify}
                    disabled={loading}
                >
                    <Text style={styles.verifyButtonText}>
                        {loading ? "Verifying..." : "Verify Email"}
                    </Text>
                </Pressable>

                {/* Resend */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    {countdown > 0 ? (
                        <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                    ) : (
                        <Pressable onPress={resendOtp} disabled={resending}>
                            <Text style={styles.resendLink}>
                                {resending ? "Sending..." : "Resend Code"}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* Hint */}
                <View style={styles.hintContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#718096" />
                    <Text style={styles.hintText}>
                        Check your spam folder if you don't see the email
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
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: "center",
        paddingTop: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#718096",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    email: {
        fontWeight: "600",
        color: "#2f855a",
    },
    otpContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6,
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    otpInput: {
        width: 36,
        height: 48,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#e2e8f0",
        backgroundColor: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        color: "#1a202c",
    },
    otpInputFilled: {
        borderColor: "#2f855a",
        backgroundColor: "#f0fdf4",
    },
    otpInputDisabled: {
        opacity: 0.6,
    },
    verifyButton: {
        backgroundColor: "#2f855a",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 48,
        alignItems: "center",
        shadowColor: "#2f855a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        width: "100%",
    },
    verifyButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    verifyButtonDisabled: {
        backgroundColor: "#9ca3af",
    },
    verifyButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    resendContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 24,
    },
    resendText: {
        fontSize: 14,
        color: "#718096",
    },
    resendLink: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2f855a",
    },
    countdownText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#9ca3af",
    },
    hintContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 40,
        paddingHorizontal: 16,
        gap: 8,
    },
    hintText: {
        fontSize: 13,
        color: "#718096",
    },
});
