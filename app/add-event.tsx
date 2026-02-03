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

export default function AddEventScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxDescriptionLength = 200;

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !time.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "You must be logged in to create an event");
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            time: time.trim(),
            host_id: user.id,
            max_attendees: maxAttendees ? parseInt(maxAttendees) : 10,
          },
        ])
        .select();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Success!", "Event created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create event");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header with Gradient Background */}
        <View style={styles.headerGradient}>
          <Text style={styles.title}>Create an Event 🌿</Text>
          <Text style={styles.subtitle}>
            Post what you want to do and find a buddy
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Event Title */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="sparkles" size={16} color="#2f855a" />
              <Text style={styles.label}>Event Title</Text>
            </View>
            <TextInput
              placeholder="Evening Walk, Herb Session, Chill Talk"
              placeholderTextColor="#a0aec0"
              style={[
                styles.input,
                focusedField === "title" && styles.inputFocused,
              ]}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="document-text" size={16} color="#2f855a" />
              <Text style={styles.label}>Description</Text>
              <Text style={styles.charCount}>
                {description.length}/{maxDescriptionLength}
              </Text>
            </View>
            <TextInput
              placeholder="What are you looking for? What's the vibe?"
              placeholderTextColor="#a0aec0"
              style={[
                styles.input,
                styles.textArea,
                focusedField === "description" && styles.inputFocused,
              ]}
              value={description}
              onChangeText={(text) => {
                if (text.length <= maxDescriptionLength) {
                  setDescription(text);
                }
              }}
              onFocus={() => setFocusedField("description")}
              onBlur={() => setFocusedField(null)}
              multiline
              maxLength={maxDescriptionLength}
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="location" size={16} color="#2f855a" />
              <Text style={styles.label}>Location</Text>
            </View>
            <TextInput
              placeholder="Nearby area or landmark"
              placeholderTextColor="#a0aec0"
              style={[
                styles.input,
                focusedField === "location" && styles.inputFocused,
              ]}
              value={location}
              onChangeText={setLocation}
              onFocus={() => setFocusedField("location")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* When */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="time" size={16} color="#2f855a" />
              <Text style={styles.label}>When?</Text>
            </View>
            <TextInput
              placeholder="Today / Tonight / Weekend"
              placeholderTextColor="#a0aec0"
              style={[
                styles.input,
                focusedField === "time" && styles.inputFocused,
              ]}
              value={time}
              onChangeText={setTime}
              onFocus={() => setFocusedField("time")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>
              {loading ? "Creating..." : "Create Event"}
            </Text>
          </Pressable>

          {/* Cancel */}
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2f855a",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f7fafc",
  },
  headerGradient: {
    backgroundColor: "#2f855a",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#e6fffa",
  },
  formContainer: {
    padding: 24,
    marginTop: -20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d3748",
    marginLeft: 6,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: "#a0aec0",
  },
  input: {
    backgroundColor: "#f7fafc",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    color: "#2d3748",
  },
  inputFocused: {
    borderColor: "#2f855a",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f855a",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginVertical: 8,
    shadowColor: "#2f855a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelText: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  cancel: {
    textAlign: "center",
    marginTop: 20,
    color: "#718096",
    fontSize: 16,
  },
});
