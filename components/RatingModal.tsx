import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: () => void;
    eventId: string;
    eventTitle: string;
    ratedUserId: string;
    ratedUserName: string;
    raterId: string;
}

export default function RatingModal({
    visible,
    onClose,
    onSubmit,
    eventId,
    eventTitle,
    ratedUserId,
    ratedUserName,
    raterId,
}: RatingModalProps) {
    const [vibeScore, setVibeScore] = useState(0);
    const [trustScore, setTrustScore] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (vibeScore === 0 || trustScore === 0) {
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from("event_ratings").insert({
                event_id: eventId,
                rater_id: raterId,
                rated_user_id: ratedUserId,
                vibe_score: vibeScore,
                trust_score: trustScore,
                comment: comment.trim() || null,
            });

            if (error) {
                console.error("Rating error:", error);
            } else {
                onSubmit();
            }
        } catch (error) {
            console.error("Rating error:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (
        score: number,
        setScore: (val: number) => void,
        icon: string,
        color: string
    ) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => setScore(star)}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={star <= score ? (icon as any) : (`${icon}-outline` as any)}
                            size={36}
                            color={star <= score ? color : "#d1d5db"}
                        />
                    </Pressable>
                ))}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Rate Your Experience</Text>
                        <Text style={styles.subtitle}>
                            How was <Text style={styles.userName}>{ratedUserName}</Text> at{" "}
                            <Text style={styles.eventName}>{eventTitle}</Text>?
                        </Text>
                    </View>

                    {/* Vibe Score */}
                    <View style={styles.ratingSection}>
                        <View style={styles.ratingHeader}>
                            <Text style={styles.ratingEmoji}>⚡</Text>
                            <Text style={styles.ratingLabel}>Vibe Score</Text>
                        </View>
                        <Text style={styles.ratingDescription}>
                            How fun and enjoyable was this person?
                        </Text>
                        {renderStars(vibeScore, setVibeScore, "star", "#f59e0b")}
                    </View>

                    {/* Trust Score */}
                    <View style={styles.ratingSection}>
                        <View style={styles.ratingHeader}>
                            <Text style={styles.ratingEmoji}>🛡️</Text>
                            <Text style={styles.ratingLabel}>Trust Score</Text>
                        </View>
                        <Text style={styles.ratingDescription}>
                            How reliable and safe did you feel?
                        </Text>
                        {renderStars(trustScore, setTrustScore, "shield-checkmark", "#10b981")}
                    </View>

                    {/* Comment */}
                    <View style={styles.commentSection}>
                        <Text style={styles.commentLabel}>Add a comment (optional)</Text>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Share your experience..."
                            placeholderTextColor="#9ca3af"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            maxLength={200}
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <Pressable style={styles.skipButton} onPress={onClose}>
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.submitButton,
                                (vibeScore === 0 || trustScore === 0) && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={vibeScore === 0 || trustScore === 0 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Rating</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modal: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 400,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a202c",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#718096",
        textAlign: "center",
        lineHeight: 22,
    },
    userName: {
        fontWeight: "600",
        color: "#2f855a",
    },
    eventName: {
        fontWeight: "600",
        color: "#4a5568",
    },
    ratingSection: {
        marginBottom: 20,
        backgroundColor: "#f7fafc",
        padding: 16,
        borderRadius: 16,
    },
    ratingHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    ratingEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    ratingLabel: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1a202c",
    },
    ratingDescription: {
        fontSize: 13,
        color: "#718096",
        marginBottom: 12,
    },
    starsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    commentSection: {
        marginBottom: 24,
    },
    commentLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4a5568",
        marginBottom: 8,
    },
    commentInput: {
        backgroundColor: "#f7fafc",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#1a202c",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        minHeight: 80,
        textAlignVertical: "top",
    },
    buttons: {
        flexDirection: "row",
        gap: 12,
    },
    skipButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        alignItems: "center",
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#718096",
    },
    submitButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#2f855a",
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#a0aec0",
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
});
