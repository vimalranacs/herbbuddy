import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_PROFILE_KEY = 'guest_profile';
const IS_GUEST_KEY = 'is_guest_user';

export interface GuestProfile {
    id: string;
    full_name: string;
    age: number;
    gender?: string;
    city: string;
    area?: string;
    interests: string[];
    vibe: string[];
    social_preferences: string[];
    group_comfort: string;
    photos: string[];
    created_at: string;
    updated_at: string;
}

// Generate a unique guest ID
export const generateGuestId = (): string => {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

// Check if user is in guest mode
export const isGuestMode = async (): Promise<boolean> => {
    try {
        const isGuest = await AsyncStorage.getItem(IS_GUEST_KEY);
        return isGuest === 'true';
    } catch {
        return false;
    }
};

// Set guest mode
export const setGuestMode = async (isGuest: boolean): Promise<void> => {
    try {
        await AsyncStorage.setItem(IS_GUEST_KEY, isGuest ? 'true' : 'false');
    } catch (error) {
        console.error('Error setting guest mode:', error);
    }
};

// Save guest profile locally
export const saveGuestProfile = async (profile: GuestProfile): Promise<void> => {
    try {
        await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
        await setGuestMode(true);
        console.log('✅ Guest profile saved:', profile.id);
    } catch (error) {
        console.error('Error saving guest profile:', error);
        throw error;
    }
};

// Get guest profile
export const getGuestProfile = async (): Promise<GuestProfile | null> => {
    try {
        const profileJson = await AsyncStorage.getItem(GUEST_PROFILE_KEY);
        if (profileJson) {
            return JSON.parse(profileJson);
        }
        return null;
    } catch (error) {
        console.error('Error getting guest profile:', error);
        return null;
    }
};

// Clear guest data (for logout)
export const clearGuestData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([GUEST_PROFILE_KEY, IS_GUEST_KEY]);
        console.log('🗑️ Guest data cleared');
    } catch (error) {
        console.error('Error clearing guest data:', error);
    }
};
