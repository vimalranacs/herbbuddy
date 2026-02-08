import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
    EVENTS: 'herbbuddy_events_cache',
    EVENTS_TIME: 'herbbuddy_events_cache_time',
    PROFILE: 'herbbuddy_profile_cache',
    PROFILE_TIME: 'herbbuddy_profile_cache_time',
    CHATS: 'herbbuddy_chats_cache',
    CHATS_TIME: 'herbbuddy_chats_cache_time',
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Generic cache functions
export const setCache = async <T>(key: string, data: T): Promise<void> => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
        await AsyncStorage.setItem(`${key}_time`, Date.now().toString());
    } catch (error) {
        console.warn('Cache write error:', error);
    }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
    try {
        const timeStr = await AsyncStorage.getItem(`${key}_time`);
        if (!timeStr) return null;

        const cacheTime = parseInt(timeStr, 10);
        if (Date.now() - cacheTime > CACHE_DURATION) {
            // Cache expired
            await clearCache(key);
            return null;
        }

        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.warn('Cache read error:', error);
        return null;
    }
};

export const clearCache = async (key: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(key);
        await AsyncStorage.removeItem(`${key}_time`);
    } catch (error) {
        console.warn('Cache clear error:', error);
    }
};

// Specific cache functions for events
export const getCachedEvents = async () => {
    return getCache<any[]>(CACHE_KEYS.EVENTS);
};

export const setCachedEvents = async (events: any[]) => {
    return setCache(CACHE_KEYS.EVENTS, events);
};

export const clearEventsCache = async () => {
    return clearCache(CACHE_KEYS.EVENTS);
};

// Specific cache functions for profile
export const getCachedProfile = async () => {
    return getCache<any>(CACHE_KEYS.PROFILE);
};

export const setCachedProfile = async (profile: any) => {
    return setCache(CACHE_KEYS.PROFILE, profile);
};

export const clearProfileCache = async () => {
    return clearCache(CACHE_KEYS.PROFILE);
};

// Specific cache functions for chats
export const getCachedChats = async () => {
    return getCache<any[]>(CACHE_KEYS.CHATS);
};

export const setCachedChats = async (chats: any[]) => {
    return setCache(CACHE_KEYS.CHATS, chats);
};

export const clearChatsCache = async () => {
    return clearCache(CACHE_KEYS.CHATS);
};

// Clear all app caches
export const clearAllCaches = async () => {
    await clearEventsCache();
    await clearProfileCache();
    await clearChatsCache();
};
