
import * as Location from 'expo-location';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface LocationResult {
    success: boolean;
    coordinates?: Coordinates;
    error?: string;
}

/**
 * Request location permissions and get current GPS coordinates
 */
export async function getCurrentLocation(): Promise<LocationResult> {
    try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            return {
                success: false,
                error: 'Location permission denied. Please enable location in settings.',
            };
        }

        // Get current position
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            success: true,
            coordinates: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            },
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return {
            success: false,
            error: 'Failed to get location. Please try again.',
        };
    }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * Shows meters if < 1km, otherwise kilometers
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return `${meters} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}

/**
 * Check if location permission is already granted
 */
export async function hasLocationPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
}
