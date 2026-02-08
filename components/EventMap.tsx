import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { Coordinates, getCurrentLocation } from "../lib/location";

// Dynamically import MapLibre to handle cases where native module isn't available (e.g., Expo Go)
let MapLibreGL: any = null;
let mapLibreAvailable = false;

try {
    MapLibreGL = require("@maplibre/maplibre-react-native").default;
    if (MapLibreGL && typeof MapLibreGL.setAccessToken === "function") {
        MapLibreGL.setAccessToken(null);
        mapLibreAvailable = true;
    }
} catch (error) {
    console.log("MapLibre not available - using fallback UI");
    mapLibreAvailable = false;
}

interface Event {
    id: string;
    title: string;
    location: string;
    latitude?: number;
    longitude?: number;
}

interface EventMapProps {
    events: Event[];
    height?: number;
}

export default function EventMap({ events, height = 250 }: EventMapProps) {
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        initLocation();
    }, []);

    const initLocation = async () => {
        try {
            const result = await getCurrentLocation();
            if (result.success && result.coordinates) {
                setUserLocation(result.coordinates);
            } else {
                // Default to a central location if permission denied
                setUserLocation({ latitude: 28.6139, longitude: 77.209 }); // Delhi
            }
        } catch (error) {
            console.log("Location error:", error);
            setUserLocation({ latitude: 28.6139, longitude: 77.209 });
        } finally {
            setLoading(false);
        }
    };

    // Filter events that have coordinates
    const eventsWithLocation = events.filter(
        (e) => e.latitude && e.longitude
    );

    if (loading) {
        return (
            <View style={[styles.container, { height }]}>
                <ActivityIndicator size="large" color="#2f855a" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    // Fallback UI when MapLibre native module is not available (e.g., in Expo Go)
    if (!mapLibreAvailable) {
        return (
            <View style={[styles.container, { height }]}>
                <View style={styles.fallbackMapArea}>
                    {/* Simulated map background */}
                    <View style={styles.fallbackMap}>
                        <View style={styles.fallbackGrid} />

                        {/* Event pins */}
                        {eventsWithLocation.slice(0, 6).map((event, index) => (
                            <Pressable
                                key={event.id}
                                style={[
                                    styles.fallbackPin,
                                    {
                                        top: 20 + (index % 3) * 50,
                                        left: 30 + (index % 4) * 60,
                                    }
                                ]}
                                onPress={() => {
                                    router.push(
                                        `/join-plan?eventId=${event.id}&title=${encodeURIComponent(event.title)}`
                                    );
                                }}
                            >
                                <View style={styles.eventMarker}>
                                    <Ionicons name="leaf" size={14} color="#fff" />
                                </View>
                            </Pressable>
                        ))}

                        {/* Center icon */}
                        <View style={styles.fallbackCenter}>
                            <Ionicons name="navigate" size={32} color="#3b82f6" />
                        </View>
                    </View>
                </View>

                <View style={styles.fallbackInfo}>
                    <Ionicons name="information-circle-outline" size={20} color="#718096" />
                    <Text style={styles.fallbackText}>
                        Interactive map available in development build
                    </Text>
                </View>

                {/* Legend */}
                <View style={styles.fallbackLegend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                        <Text style={styles.legendText}>You</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: "#2f855a" }]} />
                        <Text style={styles.legendText}>Events ({eventsWithLocation.length})</Text>
                    </View>
                </View>
            </View>
        );
    }

    if (mapError || !userLocation) {
        return (
            <View style={[styles.container, { height }]}>
                <Ionicons name="map-outline" size={48} color="#a0aec0" />
                <Text style={styles.errorText}>Map unavailable</Text>
                <Text style={styles.subText}>
                    {eventsWithLocation.length} events with location
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.mapContainer, { height }]}>
            <MapLibreGL.MapView
                style={styles.map}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                onDidFailLoadingMap={() => setMapError(true)}
                logoEnabled={false}
                attributionEnabled={false}
            >
                <MapLibreGL.Camera
                    zoomLevel={12}
                    centerCoordinate={[userLocation.longitude, userLocation.latitude]}
                />

                {/* User Location Marker */}
                <MapLibreGL.PointAnnotation
                    id="user-location"
                    coordinate={[userLocation.longitude, userLocation.latitude]}
                >
                    <View style={styles.userMarker}>
                        <View style={styles.userMarkerInner} />
                    </View>
                </MapLibreGL.PointAnnotation>

                {/* Event Markers */}
                {eventsWithLocation.map((event) => (
                    <MapLibreGL.PointAnnotation
                        key={event.id}
                        id={event.id}
                        coordinate={[event.longitude!, event.latitude!]}
                        onSelected={() => {
                            router.push(
                                `/join-plan?eventId=${event.id}&title=${encodeURIComponent(
                                    event.title
                                )}`
                            );
                        }}
                    >
                        <View style={styles.eventMarker}>
                            <Ionicons name="leaf" size={16} color="#fff" />
                        </View>
                        <MapLibreGL.Callout title={event.title} />
                    </MapLibreGL.PointAnnotation>
                ))}
            </MapLibreGL.MapView>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                    <Text style={styles.legendText}>You</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#2f855a" }]} />
                    <Text style={styles.legendText}>Events ({eventsWithLocation.length})</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f4f8",
        borderRadius: 16,
        margin: 16,
    },
    mapContainer: {
        margin: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#f0f4f8",
    },
    map: {
        flex: 1,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#718096",
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: "600",
        color: "#4a5568",
    },
    subText: {
        marginTop: 4,
        fontSize: 13,
        color: "#718096",
    },
    userMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "rgba(59, 130, 246, 0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    userMarkerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#3b82f6",
        borderWidth: 2,
        borderColor: "#fff",
    },
    eventMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#2f855a",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    legend: {
        position: "absolute",
        bottom: 12,
        left: 12,
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 16,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: "#4a5568",
        fontWeight: "500",
    },
    // Fallback UI styles
    fallbackMapArea: {
        width: "100%",
        flex: 1,
        borderRadius: 12,
        overflow: "hidden",
    },
    fallbackMap: {
        flex: 1,
        backgroundColor: "#e8f4ea",
        position: "relative",
    },
    fallbackGrid: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
    },
    fallbackPin: {
        position: "absolute",
    },
    fallbackCenter: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -16,
        marginLeft: -16,
    },
    fallbackInfo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 8,
    },
    fallbackText: {
        fontSize: 12,
        color: "#718096",
    },
    fallbackLegend: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
        paddingBottom: 8,
    },
});
