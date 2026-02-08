import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { generateGuestId, GuestProfile, saveGuestProfile } from "../lib/guest-mode";
import { supabase } from "../lib/supabase";

// Constants for selections
const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

const INTEREST_OPTIONS = [
    { id: "parties", label: "🎉 House Parties" },
    { id: "drinks", label: "🍻 Drinks & Nightouts" },
    { id: "chill", label: "🌿 Chill & Smoke-Friendly" },
    { id: "exploring", label: "🚶 Exploring Places" },
    { id: "travel", label: "🧳 Travel Companions" },
    { id: "movies", label: "🎬 Movie / Cafe Plans" },
    { id: "gaming", label: "🎮 Game / Hangouts" },
    { id: "talks", label: "🧠 Deep Talks" },
    { id: "fitness", label: "🏋️ Fitness / Activities" },
];

const VIBE_OPTIONS = [
    { id: "introvert", label: "Introvert but social" },
    { id: "extrovert", label: "Extrovert & outgoing" },
    { id: "calm", label: "Calm & chill" },
    { id: "energy", label: "High energy" },
    { id: "planner", label: "Planner" },
    { id: "spontaneous", label: "Spontaneous" },
];

const SOCIAL_OPTIONS = [
    { id: "alcohol", label: "🍺 Alcohol-friendly" },
    { id: "smoke", label: "🌿 Smoke-friendly" },
    { id: "none", label: "🚫 No substances" },
    { id: "neutral", label: "🤷 Doesn't matter" },
];

const GROUP_OPTIONS = [
    { id: "duo", label: "1–2 people" },
    { id: "small", label: "Small group (3–6)" },
    { id: "medium", label: "Medium (7–15)" },
    { id: "large", label: "Big parties (15+)" },
];

export default function ProfileSetupScreen() {
    const { guest } = useLocalSearchParams<{ guest?: string }>();
    const isGuestMode = guest === "true";

    // Current step (1, 2, or 3)
    const [step, setStep] = useState(1);

    // Step 1: Basic Info
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [city, setCity] = useState("");
    const [selectedGender, setSelectedGender] = useState("");

    // Step 2: Interests & Vibe
    const [interests, setInterests] = useState<string[]>([]);
    const [vibes, setVibes] = useState<string[]>([]);

    // Step 3: Preferences & Photo
    const [socialPrefs, setSocialPrefs] = useState<string[]>([]);
    const [groupComfort, setGroupComfort] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Load existing profile for editing
    useEffect(() => {
        const loadExistingProfile = async () => {
            if (isGuestMode) return;

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profile && profile.interests && profile.interests.length > 0) {
                    // Pre-fill all fields
                    setName(profile.full_name || "");
                    setAge(profile.age?.toString() || "");
                    setCity(profile.city || "");
                    setSelectedGender(profile.gender || "");
                    setInterests(profile.interests || []);
                    setVibes(profile.vibe || []);
                    setSocialPrefs(profile.social_preferences || []);
                    setGroupComfort(profile.group_comfort || "");
                    setPhotos(profile.photos || []);
                    setIsEditing(true);
                }
            } catch (error) {
                console.log("No existing profile to load");
            }
        };
        loadExistingProfile();
    }, [isGuestMode]);

    // Toggle selection for multi-select
    const toggleSelection = (
        item: string,
        list: string[],
        setList: (val: string[]) => void,
        max?: number
    ) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else if (!max || list.length < max) {
            setList([...list, item]);
        }
    };

    // Validation for each step
    const isStep1Valid = () => {
        return (
            name.trim().length > 0 &&
            age.trim().length > 0 &&
            parseInt(age) >= 18 &&
            parseInt(age) <= 100 &&
            city.trim().length > 0
        );
    };

    const isStep2Valid = () => {
        return interests.length >= 3 && interests.length <= 5 && vibes.length >= 1 && vibes.length <= 2;
    };

    const isStep3Valid = () => {
        return socialPrefs.length > 0 && groupComfort.length > 0 && photos.length >= 1;
    };

    const handleNext = () => {
        if (step === 1 && !isStep1Valid()) {
            Alert.alert("Incomplete", "Please fill in your name, age (18+), and city");
            return;
        }
        if (step === 2 && !isStep2Valid()) {
            Alert.alert("Incomplete", "Select 3-5 interests and 1-2 vibes");
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!isStep3Valid()) {
            Alert.alert("Incomplete", "Add a photo and select your preferences");
            return;
        }

        setLoading(true);
        try {
            const profileData = {
                full_name: name.trim(),
                age: parseInt(age),
                city: city.trim(),
                gender: selectedGender || null,
                interests: interests,
                vibe: vibes,
                social_preferences: socialPrefs,
                group_comfort: groupComfort,
                photos: photos,
                updated_at: new Date().toISOString(),
            };

            if (isGuestMode) {
                const guestProfile: GuestProfile = {
                    id: generateGuestId(),
                    ...profileData,
                    gender: profileData.gender || undefined, // Convert null to undefined
                    created_at: new Date().toISOString(),
                };
                await saveGuestProfile(guestProfile);
                Alert.alert("Welcome!", "Your profile has been created!", [
                    { text: "Let's Go!", onPress: () => router.replace("/(tabs)") },
                ]);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    Alert.alert("Error", "Please log in first");
                    router.replace("/welcome");
                    return;
                }

                const { error } = await supabase.from("profiles").upsert({
                    id: user.id,
                    ...profileData,
                });

                if (error) {
                    console.error("Profile save error:", error);
                    Alert.alert("Error", error.message);
                    return;
                }

                console.log("✅ Profile saved successfully");
                router.replace("/(tabs)");
            }
        } catch (error: any) {
            console.error("Profile setup error:", error);
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // Render Step 1: Basic Info
    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Basic Info</Text>
            <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

            {/* Name */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="What should we call you?"
                    placeholderTextColor="#a0aec0"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="18+"
                    placeholderTextColor="#a0aec0"
                    value={age}
                    onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    maxLength={2}
                />
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Where are you based?"
                    placeholderTextColor="#a0aec0"
                    value={city}
                    onChangeText={setCity}
                />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender (Optional)</Text>
                <View style={styles.chipContainer}>
                    {GENDER_OPTIONS.map((option) => (
                        <Pressable
                            key={option}
                            style={[
                                styles.chip,
                                selectedGender === option && styles.chipSelected,
                            ]}
                            onPress={() => setSelectedGender(selectedGender === option ? "" : option)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    selectedGender === option && styles.chipTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );

    // Render Step 2: Interests & Vibe
    const renderStep2 = () => (
        <View style={styles.stepContent}>
            {/* Interests */}
            <Text style={styles.stepTitle}>What are you here for?</Text>
            <Text style={styles.stepSubtitle}>Select 3–5 interests</Text>
            <View style={styles.chipContainer}>
                {INTEREST_OPTIONS.map((option) => (
                    <Pressable
                        key={option.id}
                        style={[
                            styles.chip,
                            interests.includes(option.id) && styles.chipSelected,
                        ]}
                        onPress={() => toggleSelection(option.id, interests, setInterests, 5)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                interests.includes(option.id) && styles.chipTextSelected,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.countText}>{interests.length}/5 selected</Text>

            {/* Vibe */}
            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Your Vibe</Text>
            <Text style={styles.stepSubtitle}>Pick 1–2 that match you</Text>
            <View style={styles.chipContainer}>
                {VIBE_OPTIONS.map((option) => (
                    <Pressable
                        key={option.id}
                        style={[
                            styles.chip,
                            vibes.includes(option.id) && styles.chipSelected,
                        ]}
                        onPress={() => toggleSelection(option.id, vibes, setVibes, 2)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                vibes.includes(option.id) && styles.chipTextSelected,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.countText}>{vibes.length}/2 selected</Text>
        </View>
    );

    // Render Step 3: Preferences & Photo
    const renderStep3 = () => (
        <View style={styles.stepContent}>
            {/* Social Preferences */}
            <Text style={styles.stepTitle}>Social Preferences</Text>
            <Text style={styles.stepSubtitle}>Are you comfortable with?</Text>
            <View style={styles.chipContainer}>
                {SOCIAL_OPTIONS.map((option) => (
                    <Pressable
                        key={option.id}
                        style={[
                            styles.chip,
                            socialPrefs.includes(option.id) && styles.chipSelected,
                        ]}
                        onPress={() => toggleSelection(option.id, socialPrefs, setSocialPrefs)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                socialPrefs.includes(option.id) && styles.chipTextSelected,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Group Comfort */}
            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Group Size Comfort</Text>
            <Text style={styles.stepSubtitle}>How many people are you comfortable meeting?</Text>
            <View style={styles.chipContainer}>
                {GROUP_OPTIONS.map((option) => (
                    <Pressable
                        key={option.id}
                        style={[
                            styles.chip,
                            groupComfort === option.id && styles.chipSelected,
                        ]}
                        onPress={() => setGroupComfort(option.id)}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                groupComfort === option.id && styles.chipTextSelected,
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Photo Upload */}
            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Profile Photo</Text>
            <Text style={styles.stepSubtitle}>Add at least 1 photo (face visible)</Text>
            <ImageUploader photos={photos} onPhotosChange={setPhotos} maxPhotos={3} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                {/* Header with Progress */}
                <View style={styles.header}>
                    <Text style={styles.title}>{isEditing ? "Edit Profile" : "Create Your Profile"}</Text>
                    {isGuestMode && (
                        <View style={styles.guestBadge}>
                            <Text style={styles.guestBadgeText}>🎭 Guest Mode</Text>
                        </View>
                    )}
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>Step {step} of 3</Text>
                    </View>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Navigation Buttons */}
                <View style={styles.footer}>
                    {step > 1 && (
                        <Pressable style={styles.backButton} onPress={handleBack}>
                            <Ionicons name="arrow-back" size={20} color="#718096" />
                            <Text style={styles.backButtonText}>Back</Text>
                        </Pressable>
                    )}
                    {step < 3 ? (
                        <Pressable
                            style={[styles.nextButton, step === 1 && styles.nextButtonFull]}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                            <Text style={styles.submitButtonText}>
                                {loading ? "Creating..." : "Create Profile"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    header: {
        backgroundColor: "#2f855a",
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 8,
    },
    guestBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    guestBadgeText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#fff",
        borderRadius: 4,
    },
    progressText: {
        color: "#d1fae5",
        fontSize: 13,
        marginTop: 8,
        fontWeight: "500",
    },
    scrollView: {
        flex: 1,
    },
    stepContent: {
        padding: 24,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 4,
    },
    stepSubtitle: {
        fontSize: 14,
        color: "#718096",
        marginBottom: 20,
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
    input: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        color: "#1a202c",
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    chipSelected: {
        backgroundColor: "#2f855a",
        borderColor: "#2f855a",
    },
    chipText: {
        fontSize: 14,
        color: "#4a5568",
        fontWeight: "500",
    },
    chipTextSelected: {
        color: "#fff",
    },
    countText: {
        fontSize: 13,
        color: "#718096",
        marginTop: 12,
        textAlign: "right",
    },
    footer: {
        flexDirection: "row",
        padding: 20,
        paddingBottom: 32,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        gap: 12,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 6,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#718096",
    },
    nextButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2f855a",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    submitButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2f855a",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: "#2f855a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
