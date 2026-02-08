import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

// Base shimmer animation component
export function SkeletonBox({
    width = "100%",
    height = 20,
    borderRadius = 8,
    style,
}: SkeletonLoaderProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
}

// Skeleton for event cards
export function SkeletonCard() {
    return (
        <View style={styles.card}>
            {/* Cover image placeholder */}
            <SkeletonBox height={140} borderRadius={16} style={styles.cardImage} />
            <View style={styles.cardContent}>
                {/* Title */}
                <SkeletonBox width="70%" height={20} style={styles.mb8} />
                {/* Location */}
                <SkeletonBox width="50%" height={14} style={styles.mb8} />
                {/* Date/Time */}
                <View style={styles.row}>
                    <SkeletonBox width={80} height={14} />
                    <SkeletonBox width={60} height={14} />
                </View>
            </View>
        </View>
    );
}

// Skeleton for chat list items
export function SkeletonChatItem() {
    return (
        <View style={styles.chatItem}>
            {/* Avatar */}
            <SkeletonBox width={56} height={56} borderRadius={28} />
            <View style={styles.chatContent}>
                {/* Name */}
                <SkeletonBox width="60%" height={16} style={styles.mb6} />
                {/* Last message */}
                <SkeletonBox width="80%" height={14} />
            </View>
            {/* Time */}
            <SkeletonBox width={40} height={12} />
        </View>
    );
}

// Skeleton for profile header
export function SkeletonProfile() {
    return (
        <View style={styles.profile}>
            {/* Avatar */}
            <SkeletonBox width={100} height={100} borderRadius={50} style={styles.profileAvatar} />
            {/* Name */}
            <SkeletonBox width={150} height={24} style={styles.mb8} />
            {/* Bio */}
            <SkeletonBox width={200} height={14} style={styles.mb8} />
            {/* Stats */}
            <View style={styles.statsRow}>
                <SkeletonBox width={60} height={40} borderRadius={12} />
                <SkeletonBox width={60} height={40} borderRadius={12} />
                <SkeletonBox width={60} height={40} borderRadius={12} />
            </View>
        </View>
    );
}

// Skeleton list for events
export function SkeletonEventList({ count = 3 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}

// Skeleton list for chats
export function SkeletonChatList({ count = 5 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonChatItem key={index} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: "#e2e8f0",
    },
    mb6: {
        marginBottom: 6,
    },
    mb8: {
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    // Card styles
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardImage: {
        width: "100%",
    },
    cardContent: {
        padding: 16,
    },
    // Chat item styles
    chatItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    chatContent: {
        flex: 1,
    },
    // Profile styles
    profile: {
        alignItems: "center",
        padding: 24,
    },
    profileAvatar: {
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: "row",
        gap: 16,
        marginTop: 16,
    },
});
