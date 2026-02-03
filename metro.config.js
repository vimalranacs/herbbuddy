const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for CommonJS modules (required for Supabase)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
