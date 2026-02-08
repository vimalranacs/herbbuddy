import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ForceUpdateScreenProps {
    message?: string;
    updateUrl: string;
}

export default function ForceUpdateScreen({ message, updateUrl }: ForceUpdateScreenProps) {
    const handleUpdate = () => {
        Linking.openURL(updateUrl).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="cloud-download-outline" size={80} color="#2f855a" />
                </View>

                <Text style={styles.title}>Update Required</Text>

                <Text style={styles.message}>
                    {message || "A new version of HerbBuddy is available. Please update to continue using the app."}
                </Text>

                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                    <Text style={styles.buttonText}>Update Now</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    Version v{require("../app.json").expo.version}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7fafc",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "#f0fdf4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 32,
        borderWidth: 2,
        borderColor: "#2f855a",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1a202c",
        marginBottom: 16,
        textAlign: "center",
    },
    message: {
        fontSize: 16,
        color: "#4a5568",
        textAlign: "center",
        marginBottom: 40,
        lineHeight: 24,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2f855a",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#2f855a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    footerText: {
        position: "absolute",
        bottom: 40,
        color: "#a0aec0",
        fontSize: 14,
    }
});
