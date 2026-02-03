import { Redirect } from "expo-router";

// This is the entry point - redirect to welcome for now
// Auth will be handled in welcome screen
export default function Index() {
    return <Redirect href="/welcome" />;
}
