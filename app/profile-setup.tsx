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
import ImageUploader from "../components/ImageUploader";
import { supabase } from "../lib/supabase";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say", "Custom"];

export default function ProfileSetupScreen() {
    const [photos, setPhotos] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [selectedGender, setSelectedGender] = useState("");
    const [customGender, setCustomGender] = useState("");
    const [city, setCity] = useState("");
    const [area, setArea] = useState("");
    const [loading, setLoading] = useState(false);

    const isValid = () => {
        return (
            photos.length >= 2 &&
            name.trim().length > 0 &&
            age.trim().length > 0 &&
            parseInt(age) >= 18 &&
            parseInt(age) <= 100 &&
            selectedGender.length > 0 &&
            (selectedGender !== "Custom" || customGender.trim().length > 0) &&
            city.trim().length > 0 &&
            area.trim().length > 0
        );
    };

    const handleContinue = async () => {
        if (!isValid()) {
            Alert.alert("Incomplete", "Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert("Error", "Please log in first");
                router.replace("/welcome");
                return;
            }

            const finalGender =
                selectedGender === "Custom" ? customGender.trim() : selectedGender;

            const { error } = await supabase.from("profiles").upsert({
                id: user.id,
                full_name: name.trim(),
                age: parseInt(age),
                gender: finalGender,
                city: city.trim(),
                area: area.trim(),
                photos: photos,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                Alert.alert("Error", error.message);
                return;
            }

            // Navigate to home
            router.replace("/(tabs)");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Your Profile</Text>
                        <Text style={styles.subtitle}>Tell us about yourself</Text>
                        <Text style={styles.stepText}>Step 1 of 10</Text>
                    </View>

                    {/* Photo Upload */}
                    <ImageUploader photos={photos} onPhotosChange={setPhotos} />

                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Name / Nickname <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="How should people call you?"
                            value={name}
                            onChangeText={setName}
                            maxLength={50}
                        />
                    </View>

                    {/* Age */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Age <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="18+"
                            value={age}
                            onChangeText={setAge}
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Gender <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.optionsGrid}>
                            {GENDER_OPTIONS.map((option) => (
                                <Pressable
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        selectedGender === option && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => setSelectedGender(option)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedGender === option && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        {selectedGender === "Custom" && (
                            <TextInput
                                style={[styles.input, styles.customInput]}
                                placeholder="Specify your gender"
                                value={customGender}
                                onChangeText={setCustomGender}
                                maxLength={30}
                            />
                        )}
                    </View>

                    {/* City */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            City <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Which city are you in?"
                            value={city}
                            onChangeText={setCity}
                            maxLength={50}
                        />
                    </View>

                    {/* Area */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Area (approx) <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Downtown, North Side"
                            value={area}
                            onChangeText={setArea}
                            maxLength={50}
                        />
                        <Text style={styles.helperText}>
                            We won't share your exact location
                        </Text>
                    </View>

                    {/* Continue Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.continueButton,
                            pressed && styles.continueButtonPressed,
                            (!isValid() || loading) && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!isValid() || loading}
                    >
                        <Text style={styles.continueButtonText}>
                            {loading ? "Saving..." : "Continue"}
                        </Text>
                    </Pressable>

                    {/* Skip for now */}
                    <Pressable
                        style={styles.skipButton}
                        onPress={() => router.replace("/(tabs)")}
                    >
                        <Text style={styles.skipButtonText}>Skip for now</Text>
                    </Pressable>

                    <View style={{ height: 40 }} />
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
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#718096",
        marginBottom: 8,
    },
    stepText: {
        fontSize: 13,
        color: "#2f855a",
        fontWeight: "600",
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a202c",
        marginBottom: 8,
    },
    required: {
        color: "#ef4444",
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: "#1a202c",
    },
    customInput: {
        marginTop: 12,
    },
    helperText: {
        marginTop: 6,
        fontSize: 13,
        color: "#a0aec0",
    },
    optionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#fff",
    },
    optionButtonSelected: {
        backgroundColor: "#2f855a",
        borderColor: "#2f855a",
    },
    optionText: {
        fontSize: 14,
        color: "#4a5568",
        fontWeight: "500",
    },
    optionTextSelected: {
        color: "#fff",
    },
    continueButton: {
        backgroundColor: "#2f855a",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    continueButtonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    continueButtonDisabled: {
        backgroundColor: "#cbd5e0",
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 12,
    },
    skipButtonText: {
        fontSize: 14,
        color: "#718096",
    },
});
