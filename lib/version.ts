import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import { supabase } from "./supabase";

export interface VersionCheckResult {
    isNeeded: boolean;
    isForceUpdate: boolean;
    storeUrl: string;
    message?: string;
}

export const checkAppVersion = async (): Promise<VersionCheckResult> => {
    try {
        const currentVersion = Constants.expoConfig?.version || "1.0.0";
        const platform = Platform.OS === "ios" ? "ios" : "android";

        console.log(`Checking version for ${platform}. Current: ${currentVersion}`);

        const { data, error } = await supabase
            .from("app_versions")
            .select("*")
            .eq("platform", platform)
            .single();

        if (error || !data) {
            console.log("Version check skipped or failed:", error);
            return { isNeeded: false, isForceUpdate: false, storeUrl: "" };
        }

        const latestVersion = data.latest_version;
        const forceUpdate = data.force_update;
        const updateUrl = data.update_url;
        const message = data.message;

        // Simple semantic version comparison
        const isOutdated = compareVersions(currentVersion, latestVersion) < 0;

        if (isOutdated) {
            return {
                isNeeded: true,
                isForceUpdate: forceUpdate,
                storeUrl: updateUrl,
                message: message
            };
        }

        return { isNeeded: false, isForceUpdate: false, storeUrl: "" };

    } catch (error) {
        console.error("Version check error:", error);
        return { isNeeded: false, isForceUpdate: false, storeUrl: "" };
    }
};

// Returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
const compareVersions = (v1: string, v2: string): number => {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const val1 = v1Parts[i] || 0;
        const val2 = v2Parts[i] || 0;

        if (val1 < val2) return -1;
        if (val1 > val2) return 1;
    }

    return 0;
};

export const openUpdateLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
};
