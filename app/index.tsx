import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// This is the entry point - redirect to welcome
export default function Index() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Small delay to ensure app is fully initialized
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    if (!isReady) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2f855a" />
            </View>
        );
    }

    return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f7fafc",
    },
});
