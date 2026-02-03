import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { uploadImageToCloudinary } from "../lib/cloudinary";

interface ImageUploaderProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    maxPhotos?: number;
    minPhotos?: number;
}

export default function ImageUploader({
    photos,
    onPhotosChange,
    maxPhotos = 5,
    minPhotos = 2,
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        if (photos.length >= maxPhotos) {
            Alert.alert("Maximum reached", `You can only upload ${maxPhotos} photos`);
            return;
        }

        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "We need camera roll permissions");
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            const result = await uploadImageToCloudinary(uri, "profiles");
            onPhotosChange([...photos, result.secure_url]);
        } catch (error) {
            Alert.alert("Upload failed", "Please try again");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile Photos</Text>
                <Text style={styles.subtitle}>
                    Add {minPhotos}-{maxPhotos} photos (at least {minPhotos} required)
                </Text>
            </View>

            <View style={styles.grid}>
                {photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                        <Image source={{ uri: photo }} style={styles.photo} />
                        <Pressable
                            style={styles.removeButton}
                            onPress={() => removePhoto(index)}
                        >
                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </Pressable>
                        {index === 0 && (
                            <View style={styles.primaryLabel}>
                                <Text style={styles.primaryText}>Primary</Text>
                            </View>
                        )}
                    </View>
                ))}

                {photos.length < maxPhotos && (
                    <Pressable
                        style={styles.addButton}
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="large" color="#2f855a" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={48} color="#2f855a" />
                                <Text style={styles.addText}>Add Photo</Text>
                            </>
                        )}
                    </Pressable>
                )}
            </View>

            {photos.length > 0 && photos.length < minPhotos && (
                <Text style={styles.warning}>
                    Add at least {minPhotos - photos.length} more photo(s)
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a202c",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#718096",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    photoContainer: {
        position: "relative",
        width: 100,
        height: 130,
        borderRadius: 12,
        overflow: "hidden",
    },
    photo: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f7fafc",
    },
    removeButton: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "#fff",
        borderRadius: 12,
    },
    primaryLabel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(47, 133, 90, 0.9)",
        paddingVertical: 4,
        alignItems: "center",
    },
    primaryText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
    },
    addButton: {
        width: 100,
        height: 130,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#2f855a",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
    },
    addText: {
        marginTop: 8,
        fontSize: 13,
        color: "#2f855a",
        fontWeight: "500",
    },
    warning: {
        marginTop: 12,
        fontSize: 13,
        color: "#f59e0b",
        fontWeight: "500",
    },
});
