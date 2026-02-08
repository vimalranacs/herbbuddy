import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Environment variables with fallbacks for production builds
// Note: In production, set these via EAS secrets or app.config.js
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hqdhxhssxyayshuanmrf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZGh4aHNzeHlheXNodWFubXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2NTk4MTksImV4cCI6MjA1NDIzNTgxOX0.sb_publishable_bTYOdPXwHlcfMUOn1vRUYg_eaLiG6VJ';

console.log('🔌 Supabase URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('🔑 Supabase Key:', supabaseAnonKey ? 'SET' : 'MISSING');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
