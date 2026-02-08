import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { Coordinates, getCurrentLocation } from "../lib/location";
import { validateEventContent } from "../lib/moderation";
import { supabase } from "../lib/supabase";

export default function AddEventScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  // Enhanced date/time handling - Start
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // End date/time handling
  const [eventEndDate, setEventEndDate] = useState<Date>(new Date());
  const [eventEndTime, setEventEndTime] = useState<Date>(() => {
    const time = new Date();
    time.setHours(time.getHours() + 2); // Default 2 hours after start
    return time;
  });
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Cover image
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [maxAttendees, setMaxAttendees] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [contributionNeeded, setContributionNeeded] = useState(false);
  const [contributionDetails, setContributionDetails] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Available tags
  const AVAILABLE_TAGS = ["Hangout", "Party", "Outdoor", "Indoor", "Study", "Cafe", "Music", "Sports", "Gaming", "Food", "Chill"];

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      if (tags.length >= 3) {
        Alert.alert("Limit Reached", "You can select up to 3 tags");
        return;
      }
      setTags([...tags, tag]);
    }
  };

  const maxDescriptionLength = 500;

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle date change
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  // Handle time change
  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEventTime(selectedTime);
    }
  };

  // Handle end date change
  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventEndDate(selectedDate);
    }
  };

  // Handle end time change
  const onEndTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEventEndTime(selectedTime);
    }
  };

  // Pick cover image
  const pickCoverImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;

        try {
          // Upload to Cloudinary
          const cloudinaryResult = await uploadImageToCloudinary(imageUri, 'events');
          if (cloudinaryResult?.secure_url) {
            setCoverImage(cloudinaryResult.secure_url);
          } else {
            // If cloudinary fails, use local URI for preview
            setCoverImage(imageUri);
          }
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          // Fallback to local URI
          setCoverImage(imageUri);
        }
        setUploadingImage(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setUploadingImage(false);
      Alert.alert("Error", "Failed to select image");
    }
  };

  // Remove cover image
  const removeCoverImage = () => {
    setCoverImage(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim()) {
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

      // Content moderation check
      const moderation = validateEventContent(title, description, location);
      if (!moderation.valid) {
        Alert.alert("Content Policy", moderation.message);
        setLoading(false);
        return;
      }

      // Combine start date and time
      const combinedDateTime = new Date(eventDate);
      combinedDateTime.setHours(eventTime.getHours(), eventTime.getMinutes(), 0, 0);

      // Combine end date and time
      const combinedEndDateTime = new Date(eventEndDate);
      combinedEndDateTime.setHours(eventEndTime.getHours(), eventEndTime.getMinutes(), 0, 0);

      // Validate end time is after start time
      if (combinedEndDateTime <= combinedDateTime) {
        Alert.alert("Error", "End time must be after start time");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            time: formatDate(eventDate) + " at " + formatTime(eventTime), // Legacy field
            event_date: combinedDateTime.toISOString(),
            event_end_date: combinedEndDateTime.toISOString(),
            status: 'upcoming',
            cover_image_url: coverImage,
            host_id: user.id,
            max_attendees: maxAttendees ? parseInt(maxAttendees) : 10,
            latitude: coordinates?.latitude || null,
            longitude: coordinates?.longitude || null,
            tags: tags,
            contribution_needed: contributionNeeded,
            contribution_details: contributionNeeded ? contributionDetails.trim() : null,
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient Background */}
          <View style={styles.headerGradient}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Create an Event 🌿</Text>
            <Text style={styles.subtitle}>
              Post what you want to do and find a buddy
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Cover Image Section */}
            <View style={styles.sectionHeader}>
              <Ionicons name="image" size={18} color="#2f855a" />
              <Text style={styles.sectionTitle}>Cover Image</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>

            {coverImage ? (
              <View style={styles.coverImageContainer}>
                <Image source={{ uri: coverImage }} style={styles.coverImage} />
                <Pressable style={styles.removeImageButton} onPress={removeCoverImage}>
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.coverImagePlaceholder}
                onPress={pickCoverImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="large" color="#2f855a" />
                ) : (
                  <>
                    <Ionicons name="camera" size={40} color="#a0aec0" />
                    <Text style={styles.coverImageText}>Add a cover photo</Text>
                    <Text style={styles.coverImageSubtext}>Tap to upload (16:9 recommended)</Text>
                  </>
                )}
              </Pressable>
            )}

            <View style={styles.divider} />

            {/* Event Title */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="sparkles" size={16} color="#2f855a" />
                <Text style={styles.label}>Event Title *</Text>
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
                returnKeyType="next"
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
                placeholder="What are you looking for? What's the vibe? Tell people what to expect..."
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

            <View style={styles.divider} />

            {/* Tags Section */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="pricetags" size={16} color="#2f855a" />
                <Text style={styles.label}>Tags (Max 3)</Text>
              </View>
              <View style={styles.tagsContainer}>
                {AVAILABLE_TAGS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tagPill,
                      tags.includes(tag) && styles.tagPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagPillText,
                        tags.includes(tag) && styles.tagPillTextSelected,
                      ]}
                    >
                      {tag} {tags.includes(tag) ? "✓" : "+"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Date & Time Section */}
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={18} color="#2f855a" />
              <Text style={styles.sectionTitle}>When is it happening?</Text>
            </View>

            {/* Date Picker */}
            <View style={styles.dateTimeRow}>
              <Pressable
                style={styles.dateTimeCard}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateTimeIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#2f855a" />
                </View>
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeLabel}>Date</Text>
                  <Text style={styles.dateTimeValue}>{formatDate(eventDate)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
              </Pressable>
            </View>

            {/* Time Picker */}
            <View style={styles.dateTimeRow}>
              <Pressable
                style={styles.dateTimeCard}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeIcon}>
                  <Ionicons name="time-outline" size={24} color="#2f855a" />
                </View>
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeLabel}>Time</Text>
                  <Text style={styles.dateTimeValue}>{formatTime(eventTime)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
              </Pressable>
            </View>

            {/* Date/Time Picker Modals */}
            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={eventTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            {/* End Time Section */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Ionicons name="calendar" size={18} color="#e53e3e" />
              <Text style={styles.sectionTitle}>When does it end?</Text>
            </View>

            {/* End Date Picker */}
            <View style={styles.dateTimeRow}>
              <Pressable
                style={styles.dateTimeCard}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={[styles.dateTimeIcon, { backgroundColor: '#fed7d7' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#e53e3e" />
                </View>
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeLabel}>End Date</Text>
                  <Text style={styles.dateTimeValue}>{formatDate(eventEndDate)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
              </Pressable>
            </View>

            {/* End Time Picker */}
            <View style={styles.dateTimeRow}>
              <Pressable
                style={styles.dateTimeCard}
                onPress={() => setShowEndTimePicker(true)}
              >
                <View style={[styles.dateTimeIcon, { backgroundColor: '#fed7d7' }]}>
                  <Ionicons name="time-outline" size={24} color="#e53e3e" />
                </View>
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeLabel}>End Time</Text>
                  <Text style={styles.dateTimeValue}>{formatTime(eventEndTime)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
              </Pressable>
            </View>

            {/* End Date/Time Picker Modals */}
            {showEndDatePicker && (
              <DateTimePicker
                value={eventEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndDateChange}
                minimumDate={eventDate}
              />
            )}

            {showEndTimePicker && (
              <DateTimePicker
                value={eventEndTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndTimeChange}
              />
            )}

            <View style={styles.divider} />

            {/* Location */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="location" size={16} color="#2f855a" />
                <Text style={styles.label}>Location *</Text>
                {coordinates && (
                  <View style={styles.gpsBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#2f855a" />
                    <Text style={styles.gpsBadgeText}>GPS</Text>
                  </View>
                )}
              </View>
              <TextInput
                placeholder="City, Park, or Landmark (e.g. Central Park)"
                placeholderTextColor="#a0aec0"
                style={[
                  styles.input,
                  focusedField === "location" && styles.inputFocused,
                ]}
                value={location}
                onChangeText={setLocation}
                returnKeyType="next"
                onFocus={() => setFocusedField("location")}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.gpsButton,
                  pressed && styles.gpsButtonPressed,
                  gettingLocation && styles.gpsButtonDisabled,
                ]}
                onPress={async () => {
                  setGettingLocation(true);
                  const result = await getCurrentLocation();
                  setGettingLocation(false);

                  if (result.success && result.coordinates) {
                    setCoordinates(result.coordinates);
                    Alert.alert(
                      "📍 Location Captured!",
                      `GPS coordinates saved. Your event will show up for nearby users.`
                    );
                  } else {
                    Alert.alert("Location Error", result.error || "Failed to get location");
                  }
                }}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color="#2f855a" />
                ) : (
                  <>
                    <Ionicons name="navigate" size={16} color="#2f855a" />
                    <Text style={styles.gpsButtonText}>
                      {coordinates ? "Update Location" : "Use Current Location"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Max Attendees */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="people" size={16} color="#2f855a" />
                <Text style={styles.label}>Max Attendees</Text>
              </View>
              <TextInput
                placeholder="How many people? (default: 10)"
                placeholderTextColor="#a0aec0"
                style={[
                  styles.input,
                  focusedField === "maxAttendees" && styles.inputFocused,
                ]}
                value={maxAttendees}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericText = text.replace(/[^0-9]/g, '');
                  setMaxAttendees(numericText);
                }}
                keyboardType="number-pad"
                returnKeyType="done"
                onFocus={() => setFocusedField("maxAttendees")}
                onBlur={() => setFocusedField(null)}
              />
            </View>



            <View style={styles.divider} />

            {/* Contribution Section */}
            <View style={styles.inputGroup}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                onPress={() => setContributionNeeded(!contributionNeeded)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="wallet" size={18} color="#2f855a" />
                  </View>
                  <View>
                    <Text style={[styles.label, { marginBottom: 2 }]}>Contribution / Entry Fee</Text>
                    <Text style={{ fontSize: 13, color: '#718096' }}>Does this event cost money?</Text>
                  </View>
                </View>
                <Switch
                  value={contributionNeeded}
                  onValueChange={setContributionNeeded}
                  trackColor={{ false: "#cbd5e0", true: "#2f855a" }}
                  thumbColor="#fff"
                />
              </Pressable>

              {contributionNeeded && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    placeholder="e.g. $10 per person, Bring snacks, BYOB"
                    placeholderTextColor="#a0aec0"
                    style={[
                      styles.input,
                      focusedField === "contribution" && styles.inputFocused,
                    ]}
                    value={contributionDetails}
                    onChangeText={setContributionDetails}
                    returnKeyType="done"
                    onFocus={() => setFocusedField("contribution")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Text style={styles.helperText}>
                    Specify what attendees need to bring or pay.
                  </Text>
                </View>
              )}
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
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>Create Event</Text>
                </>
              )}
            </Pressable>

            {/* Cancel */}
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView >
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
    paddingTop: 8,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 8,
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
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a202c",
    flex: 1,
  },
  optionalTag: {
    fontSize: 12,
    color: "#a0aec0",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 24,
  },
  coverImageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
  },
  coverImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    backgroundColor: "#f7fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  coverImageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#718096",
  },
  coverImageSubtext: {
    fontSize: 13,
    color: "#a0aec0",
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
  dateTimeRow: {
    marginBottom: 12,
  },
  dateTimeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  dateTimeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e6fffa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dateTimeContent: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a202c",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f855a",
    paddingVertical: 18,
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
    fontSize: 17,
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
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6fffa",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginLeft: 8,
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2f855a",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 4,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tagPillSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#2f855a",
  },
  tagPillText: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  tagPillTextSelected: {
    color: "#2f855a",
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  helperText: {
    fontSize: 12,
    color: "#718096",
    marginTop: 6,
    marginLeft: 4,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6fffa",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2f855a",
    borderStyle: "dashed",
  },
  gpsButtonPressed: {
    backgroundColor: "#c6f6d5",
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2f855a",
  },
});
