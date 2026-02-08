/**
 * Content Moderation Utility
 * Client-side blocklist for event creation
 * Should be upgraded to server-side (Supabase Edge Function) later
 */

// Category 1: Drugs & Intoxication
const DRUGS_BLOCKLIST = [
    "ganja", "weed", "marijuana", "charas", "hash", "hashish", "bhang", "joint",
    "spliff", "pot", "dope", "maal", "sutta", "sutte", "smoke up", "stoned",
    "high af", "nashe", "nasha", "nashila", "drug", "drugs", "cocaine", "heroin",
    "mdma", "lsd", "acid trip", "ecstasy", "meth", "brown sugar", "opioid",
    "cigarette party"
];

// Category 2: Sexual / Explicit
const SEXUAL_BLOCKLIST = [
    "sex", "sexual", "hookup", "hook up", "one night stand", "ons", "fuck",
    "fucking", "fwb", "friends with benefits", "threesome", "orgy", "escort",
    "paid meet", "adult fun", "nude", "nudes", "blowjob", "bj", "handjob",
    "porn", "pornhub", "cam show", "strip", "strip club"
];

// Category 3: Illegal / Criminal
const ILLEGAL_BLOCKLIST = [
    "gun", "guns", "pistol", "revolver", "weapon", "arms deal", "knife fight",
    "murder", "kill", "killing", "hitman", "contract killing", "robbery", "loot",
    "steal", "theft", "scam", "fraud", "fake id", "forgery", "drugs supply",
    "dealer", "smuggling"
];

// Category 4: Gambling / Betting
const GAMBLING_BLOCKLIST = [
    "bet", "betting", "gamble", "gambling", "satta", "matka", "casino",
    "blackjack", "roulette", "stake money"
];

// Category 5: Hate / Abuse
const HATE_BLOCKLIST = [
    "rape", "rapist", "molest", "molestation", "child abuse", "pedo", "pedophile",
    "terrorist", "terrorism", "bomb", "blast", "jihad"
];

// Combined blocklist
const BLOCKED_WORDS = [
    ...DRUGS_BLOCKLIST,
    ...SEXUAL_BLOCKLIST,
    ...ILLEGAL_BLOCKLIST,
    ...GAMBLING_BLOCKLIST,
    ...HATE_BLOCKLIST,
];

// Normalize text for checking
const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ") // Remove punctuation
        .replace(/\s+/g, " ")     // Normalize whitespace
        .trim();
};

// Check if text contains blocked content
export const containsBlockedContent = (text: string): { blocked: boolean; category?: string } => {
    const normalized = normalizeText(text);

    // Check each word and phrase
    for (const word of BLOCKED_WORDS) {
        // Check for exact word match (with word boundaries)
        const regex = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
        if (regex.test(normalized)) {
            // Determine category for logging (not shown to user)
            let category = "unknown";
            if (DRUGS_BLOCKLIST.includes(word)) category = "drugs";
            else if (SEXUAL_BLOCKLIST.includes(word)) category = "sexual";
            else if (ILLEGAL_BLOCKLIST.includes(word)) category = "illegal";
            else if (GAMBLING_BLOCKLIST.includes(word)) category = "gambling";
            else if (HATE_BLOCKLIST.includes(word)) category = "hate";

            return { blocked: true, category };
        }
    }

    return { blocked: false };
};

// Validate event content
export const validateEventContent = (
    title: string,
    description: string,
    location?: string
): { valid: boolean; message?: string } => {
    // Check title
    const titleCheck = containsBlockedContent(title);
    if (titleCheck.blocked) {
        console.log(`[Moderation] Blocked title - category: ${titleCheck.category}`);
        return {
            valid: false,
            message: "This event title violates community guidelines. Please update it."
        };
    }

    // Check description
    const descCheck = containsBlockedContent(description);
    if (descCheck.blocked) {
        console.log(`[Moderation] Blocked description - category: ${descCheck.category}`);
        return {
            valid: false,
            message: "This event description violates community guidelines. Please update it."
        };
    }

    // Check location if provided
    if (location) {
        const locCheck = containsBlockedContent(location);
        if (locCheck.blocked) {
            console.log(`[Moderation] Blocked location - category: ${locCheck.category}`);
            return {
                valid: false,
                message: "This location name violates community guidelines. Please update it."
            };
        }
    }

    return { valid: true };
};

// Validate chat message
export const validateMessage = (message: string): { valid: boolean; message?: string } => {
    const check = containsBlockedContent(message);
    if (check.blocked) {
        console.log(`[Moderation] Blocked message - category: ${check.category}`);
        return {
            valid: false,
            message: "This message violates community guidelines."
        };
    }
    return { valid: true };
};
