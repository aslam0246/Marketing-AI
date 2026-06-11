/**
 * Festival & Seasonal Calendar
 * Returns upcoming festivals/events for a given region and date.
 * Used to enrich trend analysis with time-sensitive cultural context.
 */

export interface Festival {
    name: string;
    region: string[];       // which regions this applies to
    date: (year: number) => { month: number; day: number }; // 1-indexed
    type: "festival" | "holiday" | "event" | "season";
    marketingAngle: string; // content marketing opportunity
}

// ── Festival Database ──────────────────────────────────────────────
export const FESTIVALS: Festival[] = [
    // ── India ──────────────────────────────────────────────────────
    { name: "Republic Day", region: ["IN"], date: () => ({ month: 1, day: 26 }), type: "holiday", marketingAngle: "patriotic content, national pride, brand India campaigns" },
    { name: "Holi", region: ["IN", "GLOBAL"], date: (y) => ({ month: 3, day: y === 2026 ? 4 : 17 }), type: "festival", marketingAngle: "color, joy, celebration, product launches with vibrant visuals" },
    { name: "Eid ul-Fitr", region: ["IN", "MIDDLE_EAST", "GLOBAL"], date: (y) => ({ month: 3, day: y === 2026 ? 31 : 30 }), type: "festival", marketingAngle: "togetherness, gifting, fashion, food, charity" },
    { name: "Mothers Day India", region: ["IN"], date: () => ({ month: 5, day: 10 }), type: "event", marketingAngle: "emotional storytelling, gifting guides, family bonds" },
    { name: "Independence Day India", region: ["IN"], date: () => ({ month: 8, day: 15 }), type: "holiday", marketingAngle: "patriotism, made-in-India brands, freedom themes" },
    { name: "Ganesh Chaturthi", region: ["IN"], date: (y) => ({ month: y === 2026 ? 8 : 9, day: y === 2026 ? 23 : 7 }), type: "festival", marketingAngle: "new beginnings, devotion, community celebration" },
    { name: "Navratri", region: ["IN"], date: (y) => ({ month: 10, day: y === 2026 ? 10 : 15 }), type: "festival", marketingAngle: "fashion, dance, tradition, ethnic wear promotions" },
    { name: "Dussehra", region: ["IN"], date: (y) => ({ month: 10, day: y === 2026 ? 19 : 24 }), type: "festival", marketingAngle: "good over evil, new beginnings, vehicle/gold purchases" },
    { name: "Diwali", region: ["IN", "GLOBAL"], date: (y) => ({ month: 10, day: y === 2026 ? 29 : 20 }), type: "festival", marketingAngle: "gifting, light, celebration, biggest Indian shopping season" },
    { name: "Bhai Dooj / Raksha Bandhan", region: ["IN"], date: () => ({ month: 8, day: 9 }), type: "festival", marketingAngle: "sibling bonds, gifting, emotional campaigns" },
    { name: "Pongal / Makar Sankranti", region: ["IN"], date: () => ({ month: 1, day: 14 }), type: "festival", marketingAngle: "harvest, new beginnings, South India-specific campaigns" },
    { name: "Christmas India", region: ["IN"], date: () => ({ month: 12, day: 25 }), type: "festival", marketingAngle: "joy, gifting, year-end sales" },

    // ── United States ───────────────────────────────────────────────
    { name: "Super Bowl", region: ["US"], date: (y) => ({ month: 2, day: y === 2026 ? 1 : 11 }), type: "event", marketingAngle: "sports, entertainment, food, ad campaigns, real-time marketing" },
    { name: "Valentine's Day", region: ["US", "IN", "UK", "GLOBAL"], date: () => ({ month: 2, day: 14 }), type: "event", marketingAngle: "romance, gifting, couples content, self-love" },
    { name: "St. Patrick's Day", region: ["US", "UK"], date: () => ({ month: 3, day: 17 }), type: "festival", marketingAngle: "fun, green theme, Irish culture, bar/restaurant promotions" },
    { name: "Easter", region: ["US", "UK", "GLOBAL"], date: (y) => ({ month: y === 2026 ? 4 : 4, day: y === 2026 ? 5 : 20 }), type: "festival", marketingAngle: "spring, renewal, family, chocolate, travel" },
    { name: "Mother's Day US", region: ["US", "UK"], date: (y) => ({ month: 5, day: y === 2026 ? 10 : 12 }), type: "event", marketingAngle: "emotional storytelling, gifting, appreciation campaigns" },
    { name: "Memorial Day", region: ["US"], date: (y) => ({ month: 5, day: y === 2026 ? 25 : 26 }), type: "holiday", marketingAngle: "patriotism, summer kickoff, outdoor/travel content" },
    { name: "Father's Day", region: ["US", "UK", "IN", "GLOBAL"], date: (y) => ({ month: 6, day: y === 2026 ? 21 : 15 }), type: "event", marketingAngle: "fatherhood, gifting, appreciation, sports content" },
    { name: "Independence Day US", region: ["US"], date: () => ({ month: 7, day: 4 }), type: "holiday", marketingAngle: "freedom, patriotism, summer, BBQ, fireworks visuals" },
    { name: "Labor Day US", region: ["US"], date: (y) => ({ month: 9, day: y === 2026 ? 7 : 1 }), type: "holiday", marketingAngle: "end of summer, back-to-school, work appreciation" },
    { name: "Halloween", region: ["US", "UK", "GLOBAL"], date: () => ({ month: 10, day: 31 }), type: "festival", marketingAngle: "spooky themes, costumes, fun content, horror aesthetics" },
    { name: "Thanksgiving", region: ["US"], date: (y) => ({ month: 11, day: y === 2026 ? 26 : 27 }), type: "holiday", marketingAngle: "gratitude, family, food, pre-Black Friday deals" },
    { name: "Black Friday", region: ["US", "UK", "GLOBAL"], date: (y) => ({ month: 11, day: y === 2026 ? 27 : 28 }), type: "event", marketingAngle: "deals, urgency, FOMO, shopping season launch" },
    { name: "Cyber Monday", region: ["US", "GLOBAL"], date: (y) => ({ month: 11, day: y === 2026 ? 30 : 30 }), type: "event", marketingAngle: "online deals, tech products, urgency-driven content" },
    { name: "Christmas", region: ["US", "UK", "IN", "GLOBAL"], date: () => ({ month: 12, day: 25 }), type: "festival", marketingAngle: "gifting, joy, year-end reflection, brand warmth" },
    { name: "New Year's Eve", region: ["GLOBAL"], date: () => ({ month: 12, day: 31 }), type: "event", marketingAngle: "reflection, resolutions, celebration, new beginnings" },

    // ── Global / Cross-Regional ─────────────────────────────────────
    { name: "New Year's Day", region: ["GLOBAL"], date: () => ({ month: 1, day: 1 }), type: "holiday", marketingAngle: "resolutions, fresh starts, goal-setting content" },
    { name: "International Women's Day", region: ["GLOBAL"], date: () => ({ month: 3, day: 8 }), type: "event", marketingAngle: "female empowerment, brand values, inclusive campaigns" },
    { name: "World Earth Day", region: ["GLOBAL"], date: () => ({ month: 4, day: 22 }), type: "event", marketingAngle: "sustainability, eco-friendly products, green branding" },
    { name: "World Mental Health Day", region: ["GLOBAL"], date: () => ({ month: 10, day: 10 }), type: "event", marketingAngle: "wellness, empathy, brand humanity, community support" },
    { name: "World Social Media Day", region: ["GLOBAL"], date: () => ({ month: 6, day: 30 }), type: "event", marketingAngle: "meta-content about social media itself, engagement drives" },
    { name: "International Yoga Day", region: ["IN", "GLOBAL"], date: () => ({ month: 6, day: 21 }), type: "event", marketingAngle: "wellness, mindfulness, fitness, lifestyle brands" },
];

// ── Region Labels ──────────────────────────────────────────────────
export const REGIONS: Record<string, string> = {
    IN: "India",
    US: "United States",
    UK: "United Kingdom",
    GLOBAL: "Global",
    MIDDLE_EAST: "Middle East",
};

// ── Detect upcoming festivals within N days ────────────────────────
export function getUpcomingFestivals(
    region: string,
    withinDays: number = 30
): Array<Festival & { daysAway: number; dateStr: string }> {
    const now = new Date();
    const year = now.getFullYear();

    return FESTIVALS
        .filter(f => f.region.includes(region) || f.region.includes("GLOBAL"))
        .map(f => {
            const { month, day } = f.date(year);
            let festDate = new Date(year, month - 1, day);

            // If already passed this year, check next occurrence next year
            if (festDate < now) {
                const next = f.date(year + 1);
                festDate = new Date(year + 1, next.month - 1, next.day);
            }

            const daysAway = Math.ceil((festDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const dateStr = festDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

            return { ...f, daysAway, dateStr };
        })
        .filter(f => f.daysAway >= 0 && f.daysAway <= withinDays)
        .sort((a, b) => a.daysAway - b.daysAway);
}

// ── Get current season ─────────────────────────────────────────────
export function getCurrentSeason(region: string): string {
    const month = new Date().getMonth() + 1; // 1-12

    if (region === "IN") {
        if (month >= 3 && month <= 5)  return "Summer (hot season — focus on cooling, refreshing content)";
        if (month >= 6 && month <= 9)  return "Monsoon (rainy season — cozy, indoor, rain-themed content)";
        if (month >= 10 && month <= 11) return "Festive Season (Navratri → Diwali — biggest marketing period)";
        return "Winter (cool weather — comfort, warmth, travel content)";
    }

    if (month >= 3 && month <= 5)  return "Spring (renewal, outdoor activities, fresh launches)";
    if (month >= 6 && month <= 8)  return "Summer (travel, outdoor, energy, beach content)";
    if (month >= 9 && month <= 11) return "Autumn/Fall (cozy, back-to-school, harvest themes)";
    return "Winter (holiday season, gifting, warmth themes)";
}
